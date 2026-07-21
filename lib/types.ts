export type RegisteredClient = {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: "none" | "client_secret_post" | "client_secret_basic";
  createdAt: number;
};

export type PendingAuthorization = {
  clientId: string;
  redirectUri: string;
  clientState?: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource: string;
  requestedScope: string;
  createdAt: number;
};

export type PinterestConnection = {
  connectionId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt?: number;
  pinterestScope: string;
  createdAt: number;
  updatedAt: number;
};

export type AuthorizationCode = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  connectionId: string;
  scope: string;
  expiresAt: number;
};

export type McpTokenRecord = {
  clientId: string;
  connectionId: string;
  resource: string;
  scope: string;
  expiresAt: number;
};

export type McpRefreshTokenRecord = McpTokenRecord & {
  createdAt: number;
};

export type PinterestTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  refresh_token_expires_at?: number;
  scope: string;
};

export type PinterestBoard = {
  id: string;
  name?: string;
  description?: string;
  privacy?: string;
  pin_count?: number;
  follower_count?: number;
  owner?: { username?: string };
  [key: string]: unknown;
};

export type PinterestImage = {
  width?: number;
  height?: number;
  url?: string;
};

export type PinterestPin = {
  id: string;
  title?: string;
  description?: string;
  alt_text?: string;
  link?: string;
  board_id?: string;
  board_section_id?: string;
  media?: {
    media_type?: string;
    images?: Record<string, PinterestImage>;
  };
  [key: string]: unknown;
};

export type PinterestPage<T> = {
  items: T[];
  bookmark?: string | null;
};
