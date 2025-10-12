import type { Context } from "hono";
import { Feed } from "feed";
import z from "zod";

import {
	fromFarcasterTime,
	generateCastText,
	getCastsByParent,
} from "../lib/farcaster";
import {
	parseEmbeds,
	warpcastConvoUrl,
	warpcastProfileUrl,
} from "../lib/utils";

const schema = z.object({
	url: z.string(),
	feedType: z.enum(["rss", "json", "atom"]),
	hub: z.string().url().optional(),
	limit: z.coerce.number().default(1000),
});

type Bindings = {
	DEFAULT_HUB: string;
};

// TODO: Enhance parent_url data to include name, icon, etc if possible
// Maybe we can use something like this https://github.com/neynarxyz/farcaster-channels/blob/main/warpcast.json
export async function channelFeedHandler(c: Context<{ Bindings: Bindings }>) {
	const feedType = c.req.param("feedType") as "rss" | "json" | "atom";
	const url = c.req.query("url");
	const hub = c.req.query("hub");
	const limit = c.req.query("limit");

	const safeParse = schema.safeParse({
		feedType,
		url,
		hub,
		limit,
	});

	if (!safeParse.success) {
		return c.json(safeParse.error, 400);
	}

	const { url: channelUrl, hub: _hub, limit: pageLimit } = safeParse.data;
	const hubUrl = (_hub || c.env.DEFAULT_HUB).replace(/\/$/, ""); // remove trailing slash
	const castsByParent = await getCastsByParent(hubUrl, channelUrl, pageLimit);

	if (castsByParent.error) {
		return c.json(castsByParent, 500);
	}

	const casts = castsByParent?.data?.messages;

	const feed = new Feed({
		id: channelUrl,
		title: `Farcaster Channel`,
		link: channelUrl,
		copyright: "",
	});

	casts?.forEach((cast) => {
		if (!cast.data.castAddBody) return;
		if (cast.data.castAddBody.parentCastId) return; // exclude replies

		feed.addItem({
			id: cast.hash,
			title: generateCastText(cast.data.castAddBody),
			link: warpcastConvoUrl(cast.hash),
			date: new Date(fromFarcasterTime(cast.data.timestamp)),
			content: parseEmbeds(cast.data.castAddBody),
			author: [
				{
					link: warpcastProfileUrl({ fid: cast.data.fid }),
				},
			],
		});
	});

	if (feedType === "rss") {
		return c.body(feed.rss2(), 200, {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=240, stale-while-revalidate=60",
		});
	}

	if (feedType === "atom") {
		return c.body(feed.atom1(), 200, {
			"Content-Type": "application/atom+xml; charset=utf-8",
			"Cache-Control": "public, max-age=240, stale-while-revalidate=60",
		});
	}

	return c.json(feed.json1(), 200, {
		"Cache-Control": "public, max-age=240, stale-while-revalidate=60",
	});
}
