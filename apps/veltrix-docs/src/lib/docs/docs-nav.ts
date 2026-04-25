import { docsAllLinks, docsTracks, type DocsPageLink, type DocsTrackDefinition, type DocsTrackId } from "@/lib/docs/docs-pages";

export type DocsTopRoute = Pick<DocsTrackDefinition, "id" | "href" | "label" | "summary">;

export type DocsBreadcrumb = {
  label: string;
  href: string;
};

export const docsTopRoutes: DocsTopRoute[] = docsTracks.map((track) => ({
  id: track.id,
  href: track.href,
  label: track.label,
  summary: track.summary,
}));

export function getDocsTrackById(trackId: DocsTrackId) {
  return docsTracks.find((track) => track.id === trackId);
}

export function getDocsTrackByPath(pathname: string) {
  return (
    [...docsTracks]
      .sort((left, right) => right.href.length - left.href.length)
      .find((track) => (track.href === "/" ? pathname === "/" : pathname === track.href || pathname.startsWith(`${track.href}/`))) ??
    docsTracks[0]
  );
}

export function getDocsPageByHref(href: string): DocsPageLink | undefined {
  const rootTrack = docsTracks.find((track) => track.href === href);

  if (rootTrack) {
    return {
      href: rootTrack.href,
      label: rootTrack.label,
      summary: rootTrack.summary,
      status: "live",
      kind: "surface",
    };
  }

  return docsAllLinks.find((page) => page.href === href);
}

export function getDocsPageByPath(pathname: string) {
  return docsAllLinks.find((page) => page.href === pathname);
}

export function getDocsBreadcrumbs(pathname: string): DocsBreadcrumb[] {
  const track = getDocsTrackByPath(pathname);
  const page = getDocsPageByPath(pathname);
  const trail: DocsBreadcrumb[] = [{ label: "VYNTRO Docs", href: "/" }];

  if (track.id !== "overview") {
    trail.push({ label: track.label, href: track.href });
  }

  if (page && page.href !== track.href) {
    trail.push({ label: page.label, href: page.href });
  }

  return trail;
}

export function getDocsRelatedPages(hrefs: string[]) {
  return hrefs
    .map((href) => getDocsPageByHref(href))
    .filter((page): page is DocsPageLink => Boolean(page));
}

export function isDocsLinkLive(page: DocsPageLink) {
  return page.status === "live" || page.status === "flagship";
}
