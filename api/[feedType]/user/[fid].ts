import { VercelRequest, VercelResponse } from '@vercel/node';
import { Feed } from 'feed';
import z from 'zod';

import { CastsByFid } from '../../_src/types';
import { fidToProfile, fromFarcasterTime } from '../../_src/farcaster';

const pathSchema = z.object({
  feedType: z.enum(['rss', 'json', 'atom']),
});

const paramsSchema = z.object({
  hub: z.string().url().default('https://nemes.farcaster.xyz:2281'),
  fid: z.coerce.number(),
  pageSize: z.coerce.number().max(1000).default(1000),
});

export default async function handleUser(req: VercelRequest, response: VercelResponse) {
  const safePath = pathSchema.safeParse(req.query);
  const safeParams = paramsSchema.safeParse(req.query);

  if (!safePath.success) return response.status(400).json(safePath.error);
  if (!safeParams.success) return response.status(400).json(safeParams.error);

  const { feedType } = safePath.data;
  const { hub: _hub, fid, pageSize } = safeParams.data;

  const hub = _hub.replace(/\/$/, ''); // remove trailing slash
  const endpoint = hub + `/v1/castsByFid?pageSize=${pageSize}&reverse=1&fid=${fid}`;
  const profile = await fidToProfile(hub, fid);
  const res = await fetch(endpoint);

  if (!res.ok) {
    return response.status(res.status).json(res.statusText);
  }

  const json = await res.json();
  const castsByFid = json as CastsByFid;

  const feed = new Feed({
    title: `${profile.name || `@${profile.username}`}'s Farcaster Feed`,
    description: profile.bio,
    id: fid.toString(),
    link: `https://warpcast.com/${profile.username || `~/profiles/${fid}`}`,
    image: profile.pfp,
    copyright: '',
  });

  castsByFid.messages.forEach((cast) => {
    if (!cast.data.castAddBody) return;

    // Exclude replies
    if (cast.data.castAddBody.parentCastId) return;

    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    const firstEmbedUrl = cast.data.castAddBody.embeds?.[0]?.url;
    const firstEmbedUrlExtension = firstEmbedUrl?.split('.').pop();
    const isEmbedImage = imageExtensions.includes(firstEmbedUrlExtension || '');

    feed.addItem({
      id: cast.hash,
      title: cast.data.castAddBody.text,
      link: `https://warpcast.com/~/conversations/${cast.hash}`,
      date: new Date(fromFarcasterTime(cast.data.timestamp)),
      image: isEmbedImage ? firstEmbedUrl : '',
      author: [
        {
          name: profile.name || `@${profile.username}`,
          link: `https://warpcast.com/${profile.username || `~/profiles/${fid}`}`,
        },
      ],
    });
  });

  if (feedType === 'rss') {
    return response
      .setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
      .send(feed.rss2())
      .status(200);
  }

  if (feedType === 'atom') {
    return response
      .setHeader('Content-Type', 'application/atom+xml; charset=utf-8')
      .send(feed.atom1())
      .status(200);
  }

  return response.json(feed.json1()).status(200);
}
