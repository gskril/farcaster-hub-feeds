import { CastAddBody, Profile } from "./types";

export function profileName(profile: Profile) {
	return profile.name || `@${profile.username}`;
}

export function warpcastProfileUrl(profile: Profile) {
	return `https://farcaster.xyz/${profile.username || `~/profiles/${profile.fid}`}`;
}

export function warpcastConvoUrl(hash: string) {
	return `https://farcaster.xyz/~/conversations/${hash}`;
}

export function parseEmbeds(castAddBody: CastAddBody) {
	// This isn't really the best to determine if the embed is an image, but it's the best we can do
	// without fetching each URL and checking the content type
	const imageExtensions = ["png", "jpg", "jpeg", "gif"];
	const embedUrl = castAddBody.embeds
		.filter((embed) => embed.url)
		.map((embed) => embed.url);

	const images = embedUrl?.filter((url) => {
		const urlExtension = url?.split(".").pop();

		return (
			imageExtensions.includes(urlExtension || "") ||
			url?.startsWith("https://imagedelivery.net") ||
			url?.startsWith("https://wrpcd.net")
		);
	});

	const videos = embedUrl?.filter(
		(url) =>
			url?.includes(".mp4") || url?.startsWith("https://stream.farcaster.xyz/"),
	);

	const nonImages = embedUrl?.filter(
		(url) => !images?.includes(url) && !videos?.includes(url),
	);

	const castEmbeds = castAddBody.embeds.filter((embed) => embed.castId);
	const castHashes = castEmbeds
		.filter((embed) => embed.castId!.hash)
		.map((embed) => embed.castId!.hash);

	let res = ``;
	// if quote cast, add to string
	if (castHashes.length === 1) {
		res += `<a href="${warpcastConvoUrl(castHashes[0])}">Quoted cast</a>`;
	}

	if (castHashes?.length > 1) {
		res += `<p>Quoted casts:</p><ul>${castHashes
			.map(
				(hash, index) =>
					`<li><a href="${warpcastConvoUrl(hash)}">${index + 1}</a></li>`,
			)
			.join("\n")}</ul>`;
	}

	// add to string if images
	if (images?.length > 0) {
		res += `<div>${images?.map((image) => `<img src="${image}" />`).join("\n")}</div>`;
	}

	// add to string if videos
	if (videos?.length > 0) {
		res += `<div>${videos?.map((video) => `<video src="${video}" />`).join("\n")}</div>`;
	}

	// add to string if embeds
	if (nonImages?.length > 0) {
		res += `<div>${nonImages
			?.map((url) => `<a href="${url}">${url}</a>`)
			.join("\n")}</div>`;
	}

	return res;
}
