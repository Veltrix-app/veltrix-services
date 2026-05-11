"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Box,
  Command,
  Gem,
  Home,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import {
  buildCommandPaletteActions,
  filterCommandPaletteActions,
  type CommandPaletteAction,
  type CommandPaletteActionGroup,
} from "@/lib/navigation/command-palette";

const groupLabels: Record<CommandPaletteActionGroup, string> = {
  smart: "Best next actions",
  navigate: "Navigation",
  earn: "Earn and claim",
  account: "Account",
};

const groupOrder: CommandPaletteActionGroup[] = ["smart", "navigate", "earn", "account"];

export function VyntroCommandPalette({
  accountReady,
  open,
  onOpenChange,
}: {
  accountReady: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { quests, rewards, projects, loading } = useLiveUserData({
    datasets: ["quests", "rewards", "projects"],
  });
  const actions = useMemo(
    () => buildCommandPaletteActions({ accountReady, quests, rewards, projects }),
    [accountReady, projects, quests, rewards]
  );
  const filteredActions = useMemo(() => filterCommandPaletteActions(actions, query), [actions, query]);
  const groupedActions = useMemo(() => {
    return groupOrder
      .map((group) => ({
        group,
        actions: filteredActions.filter((action) => action.group === group),
      }))
      .filter((section) => section.actions.length > 0);
  }, [filteredActions]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const key = event.key.toLowerCase();
      const wantsPalette = key === "k" && (event.metaKey || event.ctrlKey);

      if (wantsPalette) {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = "";
    };
  }, [open]);

  function runAction(action: CommandPaletteAction) {
    onOpenChange(false);
    setQuery("");
    router.push(action.href);
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, Math.max(filteredActions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const action = filteredActions[selectedIndex];
      if (action) {
        runAction(action);
      }
    }
  }

  if (!open) {
    return null;
  }

  let actionIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/72 px-3 py-5 backdrop-blur-xl sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-label="VYNTRO command palette"
      data-vyntro-motion-skip
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="mx-auto mt-[8vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#05080b] shadow-[0_34px_120px_rgba(0,0,0,0.62)]">
        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_12%_0%,rgba(190,255,74,0.16),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-3">
          <div className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-black/30 px-3.5 py-3">
            <Search className="h-5 w-5 shrink-0 text-lime-200" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search commands..."
              className="h-8 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-slate-500"
            />
            <div className="hidden items-center gap-1.5 sm:flex">
              <kbd className="rounded-[10px] border border-white/10 bg-white/[0.055] px-2 py-1 text-[10px] font-black text-slate-400">
                Esc
              </kbd>
              <kbd className="rounded-[10px] border border-white/10 bg-white/[0.055] px-2 py-1 text-[10px] font-black text-slate-400">
                Enter
              </kbd>
            </div>
          </div>
        </div>

        <div className="max-h-[min(620px,66vh)] overflow-y-auto p-2.5">
          {groupedActions.length > 0 ? (
            groupedActions.map((section) => (
              <div key={section.group} className="py-1.5">
                <p className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {groupLabels[section.group]}
                </p>
                <div className="space-y-1">
                  {section.actions.map((action) => {
                    actionIndex += 1;
                    const currentIndex = actionIndex;
                    const active = actionIndex === selectedIndex;
                    const Icon = getActionIcon(action);

                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => runAction(action)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`motion-press flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                          active
                            ? "border-lime-300/22 bg-lime-300/[0.095]"
                            : "border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border ${
                            active
                              ? "border-lime-300/20 bg-lime-300/12 text-lime-100"
                              : "border-white/8 bg-white/[0.035] text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-black text-white">{action.label}</span>
                            {action.badge ? (
                              <span className="shrink-0 rounded-full border border-white/8 bg-black/24 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-lime-200">
                                {action.badge}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block truncate text-[11px] font-semibold text-slate-400">
                            {action.description}
                          </span>
                        </span>
                        <ArrowRight className={`h-4 w-4 shrink-0 transition ${active ? "translate-x-0.5 text-lime-200" : "text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-8 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mt-3 text-sm font-black text-white">No command found</p>
              <p className="mt-1 text-[12px] text-slate-400">
                {loading ? "Command data is still syncing." : "Try swap, quest, reward, lootbox or profile."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getActionIcon(action: CommandPaletteAction) {
  if (action.id.includes("swap")) return Wallet;
  if (action.id.includes("reward")) return Gem;
  if (action.id.includes("quest")) return ShieldCheck;
  if (action.id.includes("lootbox")) return Box;
  if (action.id.includes("profile")) return UserRound;
  if (action.id.includes("home")) return Home;
  if (action.id.includes("vyntro-project")) return Sparkles;
  return Command;
}
