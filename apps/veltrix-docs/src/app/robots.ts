import type { MetadataRoute } from "next";
import { docsSiteUrl } from "@/lib/docs/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${docsSiteUrl}/sitemap.xml`,
  };
}
