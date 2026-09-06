export type GdLevelInfo = {
  id: string;
  name: string;
  description: string;
  author: string;
  difficulty: string;
  downloads: number;
  likes: number;
  length: string;
  objects: number;
  songName: string;
  songArtist: string;
  songId: string;
  gameVersion: string;
  copyPassword: string | null;
};

/**
 * Fetch level metadata directly from Geometry Dash servers (via GDBrowser API / Boomlings proxy)
 */
export async function fetchGdLevelMetadata(gdLevelId: string): Promise<GdLevelInfo | null> {
  const cleanId = gdLevelId.trim();
  if (!cleanId || !/^\d+$/.test(cleanId)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://gdbrowser.com/api/level/${cleanId}`, {
      headers: {
        "User-Agent": "NerfedDemonlist-Bot/2.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data || data === -1 || data.error) {
      return null;
    }

    return {
      id: cleanId,
      name: data.name || "Unknown Level",
      description: data.description || "",
      author: data.author || "Unknown",
      difficulty: data.difficulty || "Extreme Demon",
      downloads: Number(data.downloads) || 0,
      likes: Number(data.likes) || 0,
      length: data.length || "XL",
      objects: Number(data.objects) || 0,
      songName: data.songName || "Unknown Song",
      songArtist: data.songAuthor || "Unknown Artist",
      songId: String(data.songID || ""),
      gameVersion: data.gameVersion ? String(data.gameVersion) : "2.2",
      copyPassword: data.password && data.password !== "0" ? String(data.password) : null,
    };
  } catch {
    // Network / abort error fallback
    return null;
  }
}
