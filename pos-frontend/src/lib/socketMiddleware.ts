import type { Socket } from "socket.io-client";
import { apiSlice } from "../stores/api";

export function createSocketMiddleware(socket: Socket) {
  return (storeAPI: any) => {
    // register listeners
    socket.on("inventory.updated", (payload: any) => {
      // invalidate inventory cache so components refetch
      storeAPI.dispatch(apiSlice.util.invalidateTags(["Inventory"]));
    });

    socket.on("order.created", (payload: any) => {
      // you can invalidate tags or dispatch custom actions
      storeAPI.dispatch(apiSlice.util.invalidateTags(["Company", "Inventory"]));
    });

    return (next: any) => (action: any) => next(action);
  };
}
