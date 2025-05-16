import { VercelRequest, VercelResponse } from '@vercel/node';
import { Feed } from 'feed';
import z from 'zod';

import {
  fromFarcasterTime,
  generateCastText,
  getCastsByParent,
} from '../_src/farcaster.js';
import {
  DEFAULT_HUB,
  getImageFromCast,
  warpcastConvoUrl,
  warpcastProfileUrl,
} from '../_src/utils.js';

const schema = z.object({
  url: z.string(),
  feedType: z.enum(['rss', 'json', 'atom']),
  hub: z.string().url().default(DEFAULT_HUB),
});

// TODO: Enhance parent_url data to include name, icon, etc if possible
// Maybe we can use something like this https://github.com/neynarxyz/farcaster-channels/blob/main/warpcast.json
export default async function handleUser(req: VercelRequest, res: VercelResponse) {
  const safeParse = schema.safeParse(req.query);
  if (!safeParse.success) return res.status(400).json(safeParse.error);

  const { feedType, url, hub: _hub } = safeParse.data;
  const hub = _hub.replace(/\/$/, ''); // remove trailing slash
  const castsByParent = await getCastsByParent(hub, url);

  if (castsByParent.error) return res.status(500).json(castsByParent);
  const casts = castsByParent?.data?.messages;

  const feed = new Feed({
    id: url,
    title: `Farcaster Channel`,
    link: url,
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
          link: warpcastProfileUrl({ fid: cast.data.fid }),
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
    .setHeader('Cache-Control', 'public, max-age=240, stale-while-revalidate=60')
    .json(feed.json1())
    .status(200);
}
