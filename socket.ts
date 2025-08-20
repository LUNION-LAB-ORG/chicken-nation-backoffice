import { io } from "socket.io-client";

export const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "https://chicken.turbodeliveryapp.com") +
  "/app";

export const socket = io(SOCKET_URL);