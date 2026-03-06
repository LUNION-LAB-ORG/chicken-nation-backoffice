"use client";

import { baseURL } from "@/config/api";
import { getAuthToken } from "@/utils/authUtils";
import { Api } from "ak-api-http";

export const apiClient = new Api({
  baseUrl: baseURL,
  timeout: 10000,
  enableAuth: true,
  getSession: async () => {
    const token = getAuthToken();

    return { accessToken: token };
  },
  signOut: async () => {
    // await nextAuthSignOut({
    //   redirect: true,
    //   callbackUrl: "/?unauthenticated=true",
    // });
  },
  debug: process.env.NODE_ENV === "development",
});
