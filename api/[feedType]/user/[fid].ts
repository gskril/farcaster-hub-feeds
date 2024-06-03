import { VercelRequest, VercelResponse } from '@vercel/node';
import { Feed } from 'feed';
import z from 'zod';

import {
  fidToProfile,
  fromFarcasterTime,
  generateCastText,
  getCastsByFid,
} from '../../_src/farcaster';
import {
  DEFAULT_HUB,
  getImageFromCast,
  profileName,
  warpcastConvoUrl,
  warpcastProfileUrl,
} from '../../_src/utils';

const schema = z.object({
  fid: z.coerce.number(),
  parent_url: z.string().optional(),
  feedType: z.enum(['rss', 'json', 'atom']),
  hub: z.string().url().default(DEFAULT_HUB),
});

export default async function handleUser(req: VercelRequest, res: VercelResponse) {
  const safeParse = schema.safeParse(req.query);
  if (!safeParse.success) return res.status(400).json(safeParse.error);

  const { feedType, parent_url: parentUrl, fid, hub: _hub } = safeParse.data;
  const hub = _hub.replace(/\/$/, ''); // remove trailing slash
  const profile = await fidToProfile(hub, fid);
  const castsByFid = await getCastsByFid(hub, fid);

  if (castsByFid.error) return res.status(500).json(castsByFid);
  let casts = castsByFid?.data?.messages;

  if (parentUrl) {
    casts = casts?.filter((cast) => cast.data.castAddBody?.parentUrl === parentUrl);
  }

  const feed = new Feed({
    id: fid.toString(),
    title: `${profileName(profile)}'s Farcaster Feed`,
    description: profile.bio,
    link: warpcastProfileUrl(profile),
    image: profile.pfp,
    copyright: '',
  });

  casts?.forEach((cast) => {
    if (!cast.data.castAddBody) return;
    if (cast.data.castAddBody.parentCastId) return; // exclude replies

    feed.addItem({
      id: cast.hash,
      title: generateCastText(cast.data.castAddBody),
      link: warpcastConvoUrl(cast.hash),
      date: new Date(fromFarcasterTime(cast.data.timestamp)),
      image: getImageFromCast(cast.data.castAddBody),
      author: [
        {
          name: profileName(profile),
          link: warpcastProfileUrl(profile),
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

  return res
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .send(feed.json1())
    .status(200);
}
