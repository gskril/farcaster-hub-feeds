import { Profile, UserData } from './types';

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
    name: findUserData('USER_DATA_TYPE_DISPLAY'),
    username: findUserData('USER_DATA_TYPE_USERNAME'),
    pfp: findUserData('USER_DATA_TYPE_PFP'),
    bio: findUserData('USER_DATA_TYPE_BIO'),
  };

  return profile;
}
