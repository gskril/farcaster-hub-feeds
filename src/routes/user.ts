import type { Context } from "hono";
import { Feed } from "feed";
import z from "zod";

import {
	fidToProfile,
	fromFarcasterTime,
	generateCastText,
	getCastsByFid,
} from "../lib/farcaster";
import {
	parseEmbeds,
	profileName,
	warpcastConvoUrl,
	warpcastProfileUrl,
} from "../lib/utils";

const schema = z.object({
	fid: z.coerce.number(),
	parent_url: z.string().optional(),
	feedType: z.enum(["rss", "json", "atom"]),
	hub: z.string().url().optional(),
	limit: z.coerce.number().default(1000),
});

type Bindings = {
	DEFAULT_HUB: string;
};

export async function userFeedHandler(c: Context<{ Bindings: Bindings }>) {
	const feedType = c.req.param("feedType") as "rss" | "json" | "atom";
	const fid = c.req.param("fid");
	const parent_url = c.req.query("parent_url");
	const hub = c.req.query("hub");
	const limit = c.req.query("limit");

	const safeParse = schema.safeParse({
		feedType,
		fid,
		parent_url,
		hub,
		limit,
	});

	if (!safeParse.success) {
		return c.json(safeParse.error, 400);
	}

	const {
		fid: userId,
		parent_url: parentUrl,
		hub: _hub,
		limit: pageLimit,
	} = safeParse.data;
	const hubUrl = (_hub || c.env.DEFAULT_HUB).replace(/\/$/, ""); // remove trailing slash
	const profile = await fidToProfile(hubUrl, userId);
	const castsByFid = await getCastsByFid(hubUrl, userId, pageLimit);

	if (castsByFid.error) {
		return c.json(castsByFid, 500);
	}

	let casts = castsByFid?.data?.messages;

	if (parentUrl) {
		casts = casts?.filter(
			(cast) => cast.data.castAddBody?.parentUrl === parentUrl,
		);
	}

	const feed = new Feed({
		id: userId.toString(),
		title: `${profileName(profile)}'s Farcaster Feed`,
		description: profile.bio,
		link: warpcastProfileUrl(profile),
		image: profile.pfp,
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
					name: profileName(profile),
					link: warpcastProfileUrl(profile),
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
