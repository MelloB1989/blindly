// GraphQL Client Configuration
// Provides urql client with auth exchange for authenticated requests

import { Client, cacheExchange, fetchExchange, mapExchange } from "urql";
import { authExchange } from "@urql/exchange-auth";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { config } from "@/constants/config";

// API Configuration
const GRAPHQL_URL = config.api_host + "/query";

// Storage keys
const ACCESS_TOKEN_KEY = "blindly_access_token";

// Token refresh threshold (refresh if token expires within this many seconds)
const TOKEN_REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes

/**
 * Decode JWT payload without verification (for expiry check only)
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Base64 URL decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or about to expire
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const thresholdMs = TOKEN_REFRESH_THRESHOLD_SECONDS * 1000;

  return expiryTime - now < thresholdMs;
}

/**
 * Get stored access token
 */
async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Store access token securely
 */
export async function setAccessToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } else {
    if (token) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
  }
}

/**
 * Clear all auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }
}

/**
 * Refresh the access token using current token
 */
async function refreshAccessToken(currentToken: string): Promise<string | null> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken {
            refreshToken {
              access_token
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("Token refresh error:", data.errors);
      return null;
    }

    const newToken = data.data?.refreshToken?.access_token;
    if (newToken) {
      await setAccessToken(newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

/**
 * Create the urql GraphQL client with authentication
 */
export const graphqlClient = new Client({
  url: GRAPHQL_URL,
  exchanges: [
    cacheExchange,
    // Log errors in development
    mapExchange({
      onError(error) {
        console.error("GraphQL Error:", error);
      },
    }),
    // Auth exchange - adds Authorization header and handles token refresh
    authExchange(async (utils) => {
      let token = await getAccessToken();

      return {
        addAuthToOperation(operation) {
          // Always add auth header if we have a token
          if (!token) return operation;
          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          });
        },
        willAuthError() {
          // Check if token is about to expire before making request
          if (!token) return false;
          return isTokenExpiringSoon(token);
        },
        didAuthError(error) {
          // Check if the error is an auth error
          return error.graphQLErrors.some(
            (e) =>
              e.extensions?.code === "UNAUTHENTICATED" ||
              e.message.toLowerCase().includes("unauthorized"),
          );
        },
        async refreshAuth() {
          // Get current token from storage
          const currentToken = await getAccessToken();

          if (!currentToken) {
            token = null;
            return;
          }

          // Try to refresh the token
          const newToken = await refreshAccessToken(currentToken);

          if (newToken) {
            token = newToken;
          } else {
            // Refresh failed, clear token
            await clearAuthTokens();
            token = null;
          }
        },
      };
    }),
    fetchExchange,
  ],
});

export default graphqlClient;
