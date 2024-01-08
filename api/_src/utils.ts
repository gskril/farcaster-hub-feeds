import { CastAddBody, Profile } from './types';

export function profileName(profile: Profile) {
  return profile.name || `@${profile.username}`;
}

export function warpcastProfileUrl(profile: Profile) {
  return `https://warpcast.com/${profile.username || `~/profiles/${profile.fid}`}`;
}

export function warpcastConvoUrl(hash: string) {
  return `https://warpcast.com/~/conversations/${hash}`;
}

export function getImageFromCast(castAddBody: CastAddBody) {
  // This isn't really the best to determine if the embed is an image, but it's the best we can do
  // without fetching each URL and checking the content type
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  const firstEmbedUrl = castAddBody.embeds?.[0]?.url;
  const firstEmbedUrlExtension = firstEmbedUrl?.split('.').pop();
  const isEmbedImage = imageExtensions.includes(firstEmbedUrlExtension || '');

  return isEmbedImage ? firstEmbedUrl : '';
}

export function isUrl(maybeUrl: string) {
  try {
    new URL(maybeUrl);
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_HUB = 'https://nemes.farcaster.xyz:2281';
