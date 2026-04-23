import { publicEnv } from "@/lib/env";

export const publicAuthRoutes = {
  start: "/start",
  signIn: "/sign-in",
  signUp: "/auth/sign-up",
  verify: "/auth/verify",
  recover: "/auth/recover",
  postAuth: "/getting-started",
} as const;

function resolveWebappOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return publicEnv.webappUrl;
}

export function buildPublicAuthRedirect(pathname: string) {
  return new URL(pathname, resolveWebappOrigin()).toString();
}

export function buildPublicAuthPathWithNext(pathname: string, next?: string | null) {
  const target = new URL(pathname, resolveWebappOrigin());
  if (next?.trim()) {
    target.searchParams.set("next", next.trim());
  }

  return `${target.pathname}${target.search}`;
}

export function buildVerificationRedirectUrl(next?: string | null) {
  return buildPublicAuthRedirect(buildPublicAuthPathWithNext(publicAuthRoutes.verify, next));
}

export function buildRecoveryRedirectUrl() {
  return buildPublicAuthRedirect(`${publicAuthRoutes.recover}?mode=reset`);
}
