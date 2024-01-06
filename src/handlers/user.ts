import { IRequest } from 'itty-router';
import { Feed } from 'feed';
import z from 'zod';

import { CastsByFid } from '../types';
import { fidToProfile, fromFarcasterTime } from '../farcaster';

const pathSchema = z.object({
	feedType: z.enum(['rss', 'json', 'atom']),
});

const paramsSchema = z.object({
	hub: z.string().url().default('https://nemes.farcaster.xyz:2281'),
	fid: z.coerce.number(),
	pageSize: z.coerce.number().max(1000).default(1000),
});

export default async function handler(req: IRequest, env: Env) {
	const safePath = pathSchema.safeParse(req.params);
	const safeParams = paramsSchema.safeParse(req.query);

	if (!safePath.success) return Response.json(safePath.error, { status: 400 });
	if (!safeParams.success) return Response.json(safeParams.error, { status: 400 });

	const { feedType } = safePath.data;
	const { hub: _hub, fid, pageSize } = safeParams.data;

	const hub = _hub.replace(/\/$/, ''); // remove trailing slash
	const endpoint = hub + `/v1/castsByFid?pageSize=${pageSize}&reverse=1&fid=${fid}`;
	const profile = await fidToProfile(hub, fid);
	const res = await fetch(endpoint);

	if (!res.ok) {
		return Response.json(res.statusText, { status: res.status });
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

	let feedOutput;

	if (feedType === 'rss') feedOutput = feed.rss2();
	else if (feedType === 'json') feedOutput = feed.json1();
	else if (feedType === 'atom') feedOutput = feed.atom1();

	return new Response(feedOutput, { status: 200 });
}
