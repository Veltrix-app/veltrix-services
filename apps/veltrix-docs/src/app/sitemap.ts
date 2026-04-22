import type { MetadataRoute } from "next";
import { docsAllLinks, docsTracks } from "@/lib/docs/docs-pages";
import { docsSiteUrl } from "@/lib/docs/site";

const launchDate = new Date("2026-04-22T09:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const liveRoutes = [
    ...docsTracks.map((track) => track.href),
    ...docsAllLinks.filter((page) => page.status === "live" || page.status === "flagship").map((page) => page.href),
  ];

  const uniqueRoutes = [...new Set(liveRoutes)];

  return uniqueRoutes.map((route) => ({
    url: `${docsSiteUrl}${route === "/" ? "" : route}`,
    lastModified: launchDate,
    changeFrequency: route.startsWith("/release-notes") ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/project-docs") || route.startsWith("/operator-docs") ? 0.8 : 0.7,
  }));
}
