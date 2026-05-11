"use client";

import Link from "next/link";
import { Award, BellRing, Gem, ShieldCheck, Sparkles, Swords, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import {
  buildLiveActivityAmbientEvents,
  type LiveActivityAmbientEvent,
  type LiveActivityAmbientTone,
} from "@/lib/activity/live-activity-ambient";

const DISPLAY_MS = 4200;
const SEEN_STORAGE_KEY = "vyntro_ambient_activity_seen_v1";

export function LiveActivityAmbientLayer({ accountReady }: { accountReady: boolean }) {
  const { notifications } = useLiveUserData({ datasets: ["notifications"] });
  const { snapshot } = useCommunityJourney();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const [visibleEvent, setVisibleEvent] = useState<LiveActivityAmbientEvent | null>(null);
  const ambientEvents = useMemo(
    () =>
      buildLiveActivityAmbientEvents({
        notifications,
        preferredRoute: snapshot.preferredRoute,
      }),
    [notifications, snapshot.preferredRoute]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(SEEN_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const ids = JSON.parse(stored) as string[];
      seenIdsRef.current = new Set(ids.slice(0, 40));
    } catch {
      seenIdsRef.current = new Set();
    }
  }, []);

  useEffect(() => {
    if (!accountReady || ambientEvents.length === 0) {
      return;
    }

    if (!primedRef.current) {
      ambientEvents.forEach((event) => seenIdsRef.current.add(event.id));
      persistSeenIds(seenIdsRef.current);
      primedRef.current = true;
      return;
    }

    const nextEvent = ambientEvents.find((event) => !seenIdsRef.current.has(event.id));
    if (!nextEvent) {
      return;
    }

    seenIdsRef.current.add(nextEvent.id);
    persistSeenIds(seenIdsRef.current);

    const showId = window.setTimeout(() => setVisibleEvent(nextEvent), 180);
    const hideId = window.setTimeout(() => setVisibleEvent(null), DISPLAY_MS);

    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
    };
  }, [accountReady, ambientEvents]);

  if (!accountReady || !visibleEvent) {
    return null;
  }

  const toneClass = getAmbientToneClass(visibleEvent.tone);

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-4 right-4 z-[88] flex justify-center md:bottom-auto md:left-auto md:right-5 md:top-[5.8rem] md:justify-end"
      aria-live="polite"
      data-vyntro-motion-skip
    >
      <div className={`live-activity-ambient pointer-events-auto w-full max-w-[22rem] rounded-[22px] border ${toneClass.shell} bg-[#05080b]/94 p-3 shadow-[0_24px_84px_rgba(0,0,0,0.48)] backdrop-blur-2xl`}>
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border ${toneClass.icon}`}>
            <AmbientIcon event={visibleEvent} />
          </span>
          <Link href={visibleEvent.href} className="min-w-0 flex-1">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${toneClass.eyebrow}`}>
              Live signal
            </p>
            <p className="mt-1 truncate text-[13px] font-black text-white">{visibleEvent.label}</p>
            <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-slate-400">{visibleEvent.detail}</p>
          </Link>
          <button
            type="button"
            onClick={() => setVisibleEvent(null)}
            aria-label="Dismiss live activity"
            className="motion-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function persistSeenIds(seenIds: Set<string>) {
  const ids = Array.from(seenIds).slice(-40);
  window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids));
}

function AmbientIcon({ event }: { event: LiveActivityAmbientEvent }) {
  if (/shards/i.test(event.label)) return <Gem className="h-4 w-4" />;
  if (/badge/i.test(event.label)) return <Award className="h-4 w-4" />;
  if (/raid/i.test(event.label)) return <Swords className="h-4 w-4" />;
  if (/quest/i.test(event.label)) return <ShieldCheck className="h-4 w-4" />;
  if (event.tone === "lime") return <Sparkles className="h-4 w-4" />;
  return <BellRing className="h-4 w-4" />;
}

function getAmbientToneClass(tone: LiveActivityAmbientTone) {
  if (tone === "lime") {
    return {
      shell: "border-lime-300/18",
      icon: "border-lime-300/20 bg-lime-300/10 text-lime-100",
      eyebrow: "text-lime-200",
    };
  }

  if (tone === "amber") {
    return {
      shell: "border-amber-300/18",
      icon: "border-amber-300/20 bg-amber-300/10 text-amber-100",
      eyebrow: "text-amber-200",
    };
  }

  if (tone === "rose") {
    return {
      shell: "border-rose-300/18",
      icon: "border-rose-300/20 bg-rose-300/10 text-rose-100",
      eyebrow: "text-rose-200",
    };
  }

  if (tone === "cyan") {
    return {
      shell: "border-cyan-300/18",
      icon: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      eyebrow: "text-cyan-200",
    };
  }

  return {
    shell: "border-white/10",
    icon: "border-white/10 bg-white/[0.045] text-slate-300",
    eyebrow: "text-slate-400",
  };
}
