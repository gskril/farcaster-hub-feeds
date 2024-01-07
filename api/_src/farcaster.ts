import { CastAddBody, Casts, Profile, UserData } from './types';

const FARCASTER_EPOCH = 1609459200000; // January 1, 2021 UTC

/**
 * Converts from a Farcaster to Unix timestamp.
 * @param time seconds since the Farcaster Epoch
 * @returns unix milliseconds
 */
export function fromFarcasterTime(time: number) {
  return time * 1000 + FARCASTER_EPOCH;
}

export async function fidToProfile(hub: string, fid: number): Promise<Profile> {
  const endpoint = hub + `/v1/userDataByFid?fid=${fid}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    return {
      fid,
      name: undefined,
      username: undefined,
      pfp: undefined,
      bio: undefined,
    };
  }

  const json = await res.json();
  const userData = json as UserData;

  function findUserData(type: string) {
    return userData.messages?.find((m) => m.data.userDataBody.type === type)?.data
      .userDataBody.value;
  }

  const profile = {
    fid,
    name: findUserData('USER_DATA_TYPE_DISPLAY'),
    username: findUserData('USER_DATA_TYPE_USERNAME'),
    pfp: findUserData('USER_DATA_TYPE_PFP'),
    bio: findUserData('USER_DATA_TYPE_BIO'),
  };

  return profile;
}

export async function getCastsByFid(hub: string, fid: number) {
  const endpoint = hub + `/v1/castsByFid?pageSize=1000&reverse=1&fid=${fid}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    return { error: res.statusText };
  }

  const json = await res.json();
  const castsByFid = json as Casts;
  return { data: castsByFid };
}

export async function getCastsByParent(hub: string, url: string) {
  const endpoint = hub + `/v1/castsByParent?url=${url}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    return { error: res.statusText };
  }

  const json = await res.json();
  const castsByParent = json as Casts;
  return { data: castsByParent };
}

/**
 * Combines the cast text with mentions by position. Mentions are represented
 * by FIDs rather than usernames due to the way hubs store mentions.
 * @param castBody
 * @returns A formatted string of the cast's text including mentions
 */
export function generateCastText(castBody: CastAddBody) {
  if (castBody.mentions.length === 0) return castBody.text;

  const text = castBody.text;
  const mentionFids = castBody.mentions;
  const mentionPositions = castBody.mentionsPositions;

  const mentionsMap = new Map<number, number>();
  for (let i = 0; i < mentionPositions.length; i++) {
    mentionsMap.set(mentionPositions[i], mentionFids[i]);
  }

  let castText = '';

  for (let i = 0; i < text.length; i++) {
    if (mentionsMap.has(i)) {
      const fid = mentionsMap.get(i);
      castText += `@!${fid}`;
    }

    castText += text[i];
  }

  return castText;
}
