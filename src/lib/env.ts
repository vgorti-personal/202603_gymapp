function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get adminPasscode() {
    return required("ADMIN_PASSCODE");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get spotifyClientId() {
    return required("SPOTIFY_CLIENT_ID");
  },
  get spotifyClientSecret() {
    return required("SPOTIFY_CLIENT_SECRET");
  },
  get spotifyRedirectUri() {
    return required("SPOTIFY_REDIRECT_URI");
  },
  get tokenEncryptionKey() {
    return required("TOKEN_ENCRYPTION_KEY");
  },
};
