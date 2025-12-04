if (!process.env.EXPO_PUBLIC_BLINDLY_API_URL) {
  throw new Error("BLINDLY_API_URL environment variable is not set");
}

export const config = {
  api_host: process.env.EXPO_PUBLIC_BLINDLY_API_URL,
  ACCESS_TOKEN_KEY: "blindly_access_token",
};
