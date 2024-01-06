type HubData<T> = {
  data: T;
  hash: string;
  hashScheme: string;
  signature: string;
  signatureScheme: string;
  signer: string;
};

type HubResponse<T> = {
  messages: Array<HubData<T>>;
  nextPageToken: string;
};

export type CastsByFid = HubResponse<{
  type: string;
  fid: number;
  timestamp: number;
  network: string;
  castAddBody?: {
    mentions: Array<number>;
    text: string;
    mentionsPositions: Array<number>;
    embeds: Array<{
      url?: string;
      castId?: {
        fid: number;
        hash: string;
      };
    }>;
    parentCastId?: {
      fid: number;
      hash: string;
    };
    parentUrl?: string;
  };
  castRemoveBody?: {
    targetHash: string;
  };
}>;

export type UserData = HubResponse<{
  type: string;
  fid: number;
  timestamp: number;
  network: string;
  userDataBody: {
    type: string;
    value: string;
  };
}>;

export type Profile = {
  name: string | undefined;
  username: string | undefined;
  pfp: string | undefined;
  bio: string | undefined;
};
