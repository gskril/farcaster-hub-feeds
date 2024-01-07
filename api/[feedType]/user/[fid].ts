import { VercelRequest, VercelResponse } from '@vercel/node';
import { Feed } from 'feed';
import z from 'zod';

import { fidToProfile, fromFarcasterTime, getCastsByFid } from '../../_src/farcaster';

const pathSchema = z.object({
  feedType: z.enum(['rss', 'json', 'atom']),
});

const paramsSchema = z.object({
  hub: z.string().url().default('https://nemes.farcaster.xyz:2281'),
  fid: z.coerce.number(),
  pageSize: z.coerce.number().max(1000).default(1000),
});

export default async function handleUser(req: VercelRequest, res: VercelResponse) {
  const safePath = pathSchema.safeParse(req.query);
  const safeParams = paramsSchema.safeParse(req.query);

  if (!safePath.success) return res.status(400).json(safePath.error);
  if (!safeParams.success) return res.status(400).json(safeParams.error);

  const { feedType } = safePath.data;
  const { hub: _hub, fid, pageSize } = safeParams.data;

  const hub = _hub.replace(/\/$/, ''); // remove trailing slash
  const profile = await fidToProfile(hub, fid);
  const castsByFid = await getCastsByFid(hub, fid);

  if (castsByFid.error) return res.status(500).json(castsByFid);
  const casts = castsByFid?.data?.messages;

  const feed = new Feed({
    title: `${profile.name || `@${profile.username}`}'s Farcaster Feed`,
    description: profile.bio,
    id: fid.toString(),
    link: `https://warpcast.com/${profile.username || `~/profiles/${fid}`}`,
    image: profile.pfp,
    copyright: '',
  });

  casts?.forEach((cast) => {
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
    return res
      .setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
      .send(feed.rss2())
      .status(200);
  }

  if (feedType === 'atom') {
    return res
      .setHeader('Content-Type', 'application/atom+xml; charset=utf-8')
      .send(feed.atom1())
      .status(200);
  }

  return res.json(feed.json1()).status(200);
}
