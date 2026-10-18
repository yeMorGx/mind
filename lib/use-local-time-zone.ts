"use client";
import { getLocalTimeZone } from "@internationalized/date";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverSnapshot = () => "UTC";

/** Stable during hydration, then uses the browser's actual time zone. */
export function useLocalTimeZone() {
  return useSyncExternalStore(subscribe, getLocalTimeZone, serverSnapshot);
}
