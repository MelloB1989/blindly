// GraphQL Client Configuration
// Provides urql client with auth exchange for authenticated requests

import { Client, cacheExchange, fetchExchange, mapExchange } from "urql";
import { authExchange } from "@urql/exchange-auth";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// API Configuration
const GRAPHQL_URL = __DEV__
  ? "http://localhost:7777/query"
  : "https://api.blindly.app/query";

// Storage keys
const ACCESS_TOKEN_KEY = "blindly_access_token";

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
    // Auth exchange - adds Authorization header
    authExchange(async (utils) => {
      let token = await getAccessToken();

      return {
        addAuthToOperation(operation) {
          if (!token) return operation;
          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          });
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
          // Get fresh token from storage
          token = await getAccessToken();
        },
      };
    }),
    fetchExchange,
  ],
});

export default graphqlClient;
