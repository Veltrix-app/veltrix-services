"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REVEAL_SELECTOR = "main section, main article, main [data-vyntro-reveal]";
const DEPTH_CARD_SELECTOR = ".motion-3d-card, [data-vyntro-depth-card]";
const FEEDBACK_CONTROL_SELECTOR = ".motion-press, .glass-button, [data-vyntro-feedback]";
const ROUTE_ORDER = ["/home", "/quests", "/projects", "/lootboxes", "/profile"];

type RouteMotionProfile = {
  family: string;
  accent: string;
  shift: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getRevealTargets() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

  return candidates.filter((element) => {
    if (element.closest("[data-vyntro-motion-skip]")) {
      return false;
    }

    if (element.hasAttribute("data-vyntro-reveal")) {
      return true;
    }

    return !element.parentElement?.closest("section, article");
  });
}

function getRouteMotionProfile(pathname: string, previousPathname: string | null): RouteMotionProfile {
  const route = ROUTE_ORDER.find((item) => pathname === item || pathname.startsWith(`${item}/`));
  const previousRoute = previousPathname
    ? ROUTE_ORDER.find((item) => previousPathname === item || previousPathname.startsWith(`${item}/`))
    : null;
  const currentIndex = route ? ROUTE_ORDER.indexOf(route) : -1;
  const previousIndex = previousRoute ? ROUTE_ORDER.indexOf(previousRoute) : currentIndex;
  const direction = currentIndex >= 0 && previousIndex >= 0 ? Math.sign(currentIndex - previousIndex) : 0;

  switch (route) {
    case "/quests":
      return { family: "quests", accent: "rgba(190,255,74,0.3)", shift: direction || 1 };
    case "/projects":
      return { family: "projects", accent: "rgba(34,211,238,0.28)", shift: direction || 1 };
    case "/lootboxes":
      return { family: "lootboxes", accent: "rgba(52,211,153,0.26)", shift: direction || 1 };
    case "/profile":
      return { family: "profile", accent: "rgba(167,139,250,0.26)", shift: direction || 1 };
    case "/home":
      return { family: "home", accent: "rgba(190,255,74,0.24)", shift: direction || -1 };
    default:
      return { family: "default", accent: "rgba(34,211,238,0.2)", shift: direction || 0 };
  }
}

function bindGlobalPointerLight() {
  const root = document.documentElement;
  let frameId = 0;
  let nextX = 0.5;
  let nextY = 0.35;

  const applyPointer = () => {
    frameId = 0;
    root.style.setProperty("--vyntro-global-x", `${(nextX * 100).toFixed(2)}%`);
    root.style.setProperty("--vyntro-global-y", `${(nextY * 100).toFixed(2)}%`);
  };

  const handlePointerMove = (event: PointerEvent) => {
    nextX = clamp(event.clientX / window.innerWidth);
    nextY = clamp(event.clientY / window.innerHeight);

    if (!frameId) {
      frameId = window.requestAnimationFrame(applyPointer);
    }
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
    root.style.removeProperty("--vyntro-global-x");
    root.style.removeProperty("--vyntro-global-y");
  };
}

function bindDepthCards() {
  const cleanupByCard = new Map<HTMLElement, () => void>();

  const attachCard = (card: HTMLElement) => {
    if (cleanupByCard.has(card)) {
      return;
    }

    let frameId = 0;
    let nextX = 0.5;
    let nextY = 0.2;

    const applyDepth = () => {
      frameId = 0;
      const rotateX = (0.5 - nextY) * 4.6;
      const rotateY = (nextX - 0.5) * 5.6;

      card.style.setProperty("--vyntro-card-x", `${(nextX * 100).toFixed(2)}%`);
      card.style.setProperty("--vyntro-card-y", `${(nextY * 100).toFixed(2)}%`);
      card.style.setProperty("--vyntro-card-rotate-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--vyntro-card-rotate-y", `${rotateY.toFixed(2)}deg`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      nextX = clamp((event.clientX - rect.left) / rect.width);
      nextY = clamp((event.clientY - rect.top) / rect.height);

      if (!frameId) {
        frameId = window.requestAnimationFrame(applyDepth);
      }
    };

    const handlePointerLeave = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      card.style.removeProperty("--vyntro-card-x");
      card.style.removeProperty("--vyntro-card-y");
      card.style.removeProperty("--vyntro-card-rotate-x");
      card.style.removeProperty("--vyntro-card-rotate-y");
    };

    card.addEventListener("pointermove", handlePointerMove, { passive: true });
    card.addEventListener("pointerleave", handlePointerLeave);

    cleanupByCard.set(card, () => {
      card.removeEventListener("pointermove", handlePointerMove);
      card.removeEventListener("pointerleave", handlePointerLeave);
      handlePointerLeave();
    });
  };

  const scanForCards = () => {
    document.querySelectorAll<HTMLElement>(DEPTH_CARD_SELECTOR).forEach(attachCard);
  };

  const observer = new MutationObserver(scanForCards);
  scanForCards();
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    cleanupByCard.forEach((cleanup) => cleanup());
    cleanupByCard.clear();
  };
}

function bindFeedbackControls() {
  const cleanupByControl = new Map<HTMLElement, () => void>();

  const attachControl = (control: HTMLElement) => {
    if (cleanupByControl.has(control)) {
      return;
    }

    let frameId = 0;
    let nextX = 0.5;
    let nextY = 0.5;

    const applyFeedback = () => {
      frameId = 0;
      const rect = control.getBoundingClientRect();
      const magneticLimit = Math.min(3.5, Math.max(1.2, Math.min(rect.width, rect.height) * 0.045));
      const magneticX = (nextX - 0.5) * magneticLimit;
      const magneticY = (nextY - 0.5) * magneticLimit;

      control.style.setProperty("--vyntro-feedback-x", `${(nextX * 100).toFixed(2)}%`);
      control.style.setProperty("--vyntro-feedback-y", `${(nextY * 100).toFixed(2)}%`);
      control.style.setProperty("--vyntro-magnetic-x", `${magneticX.toFixed(2)}px`);
      control.style.setProperty("--vyntro-magnetic-y", `${magneticY.toFixed(2)}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = control.getBoundingClientRect();
      nextX = clamp((event.clientX - rect.left) / rect.width);
      nextY = clamp((event.clientY - rect.top) / rect.height);

      if (!frameId) {
        frameId = window.requestAnimationFrame(applyFeedback);
      }
    };

    const handlePointerLeave = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      control.style.removeProperty("--vyntro-feedback-x");
      control.style.removeProperty("--vyntro-feedback-y");
      control.style.removeProperty("--vyntro-magnetic-x");
      control.style.removeProperty("--vyntro-magnetic-y");
    };

    control.addEventListener("pointermove", handlePointerMove, { passive: true });
    control.addEventListener("pointerleave", handlePointerLeave);

    cleanupByControl.set(control, () => {
      control.removeEventListener("pointermove", handlePointerMove);
      control.removeEventListener("pointerleave", handlePointerLeave);
      handlePointerLeave();
    });
  };

  const scanForControls = () => {
    document.querySelectorAll<HTMLElement>(FEEDBACK_CONTROL_SELECTOR).forEach(attachControl);
  };

  const observer = new MutationObserver(scanForControls);
  scanForControls();
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    cleanupByControl.forEach((cleanup) => cleanup());
    cleanupByControl.clear();
  };
}

export function VyntroMotionLayer() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const finePointer = window.matchMedia(FINE_POINTER_QUERY).matches;
    const root = document.documentElement;
    const routeProfile = getRouteMotionProfile(pathname, previousPathnameRef.current);
    const targets = getRevealTargets();
    const cleanupCallbacks: Array<() => void> = [];

    root.classList.remove("vyntro-route-motion");
    void root.offsetWidth;
    root.classList.add("vyntro-route-motion");
    root.classList.add("vyntro-route-loading");
    root.setAttribute("data-vyntro-route-family", routeProfile.family);
    root.style.setProperty("--vyntro-route-accent", routeProfile.accent);
    root.style.setProperty("--vyntro-route-shift", String(routeProfile.shift));
    previousPathnameRef.current = pathname;

    const routePulseId = window.setTimeout(() => {
      root.classList.remove("vyntro-route-loading");
    }, reducedMotion ? 120 : 760);

    cleanupCallbacks.push(() => {
      window.clearTimeout(routePulseId);
      root.classList.remove("vyntro-route-loading");
      root.style.removeProperty("--vyntro-route-accent");
      root.style.removeProperty("--vyntro-route-shift");
      root.removeAttribute("data-vyntro-route-family");
    });

    if (!reducedMotion && finePointer) {
      cleanupCallbacks.push(bindGlobalPointerLight(), bindDepthCards(), bindFeedbackControls());
    }

    targets.forEach((element, index) => {
      element.classList.add("vyntro-reveal-node");
      element.classList.remove("is-visible");
      element.style.setProperty("--vyntro-reveal-index", String(Math.min(index, 7)));
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return () => cleanupCallbacks.forEach((cleanup) => cleanup());
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    targets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  return null;
}
