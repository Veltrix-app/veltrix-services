import { normalizeXUsername } from "./tweet-to-raid.js";

export type ParsedXStatusUrl =
  | {
      ok: true;
      username: string;
      postId: string;
      canonicalUrl: string;
    }
  | {
      ok: false;
      reason: "unsupported_x_status_url";
    };

export function parseXStatusUrl(value: string): ParsedXStatusUrl {
  const trimmed = value.trim();
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[1] !== "status") {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const username = normalizeXUsername(parts[0]);
  const postId = parts[2]?.trim() ?? "";
  if (!username || !/^[0-9]+$/.test(postId)) {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  return {
    ok: true,
    username,
    postId,
    canonicalUrl: `https://x.com/${username}/status/${postId}`,
  };
}
