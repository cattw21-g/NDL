"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LAST_SYNC_KEY = "ndl_device_gps_synced_v1";
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function DeviceLocationSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      if (lastSync && Date.now() - Number(lastSync) < SYNC_INTERVAL_MS) {
        return;
      }
    } catch {
      // Storage unavailable
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const res = await fetch("/api/location/device-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon }),
          });

          if (res.ok) {
            try {
              localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
            } catch {
              // Ignore
            }
          }
        } catch {
          // Non-blocking
        }
      },
      () => {
        // User clicked block or device location unavailable
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [pathname]);

  return null;
}
