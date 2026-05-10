"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const REVEAL_SELECTOR = "main section, main article, main [data-vyntro-reveal]";

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

export function VyntroMotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const root = document.documentElement;
    const targets = getRevealTargets();

    root.classList.remove("vyntro-route-motion");
    void root.offsetWidth;
    root.classList.add("vyntro-route-motion");

    targets.forEach((element, index) => {
      element.classList.add("vyntro-reveal-node");
      element.classList.remove("is-visible");
      element.style.setProperty("--vyntro-reveal-index", String(Math.min(index, 7)));
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return undefined;
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

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
