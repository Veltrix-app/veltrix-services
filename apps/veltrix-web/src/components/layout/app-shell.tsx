"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Compass,
  Gem,
  Home,
  Search,
  Swords,
  Layers3,
  Trophy,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/raids", label: "Raids", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/rewards", label: "Rewards", icon: Gem },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/sign-in", label: "Access", icon: ShieldCheck },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { authConfigured, session, profile, signOut } = useAuth();
  const identityLabel = profile?.username ?? session?.user?.email ?? "Guest";
  const accountReady = Boolean(session);

  return (
    <div className="hud-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(192,255,0,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(0,204,255,0.12),_transparent_22%),linear-gradient(180deg,_#071014_0%,_#09131a_45%,_#05090c_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[292px] shrink-0 border-r border-cyan-300/8 bg-[#041017]/90 px-6 py-8 backdrop-blur-xl lg:flex lg:flex-col">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.4em] text-cyan-300">
              Veltrix // Grid
            </p>
            <h1 className="font-display mt-4 text-3xl font-black tracking-[0.08em] text-white">
              Grid Command
            </h1>
            <p className="mt-3 max-w-[18rem] text-sm leading-6 text-slate-300">
              Live launcher for mission lanes, raid pressure, vault drops and pilot systems.
            </p>
          </div>

          <div className="panel-card mt-8 rounded-[28px] p-4">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Console read
            </p>
            <div className="mt-4 grid gap-3">
              <div className="metric-card rounded-[20px] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Surface
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Live operator surface</p>
              </div>
              <div className="metric-card rounded-[20px] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {accountReady ? "Pilot authenticated" : "Public access shell"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              if (item.href === "/sign-in" && accountReady) {
                return null;
              }

              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[linear-gradient(90deg,rgba(192,255,0,0.18),rgba(0,204,255,0.08))] text-lime-200 shadow-[0_0_0_1px_rgba(192,255,0,0.18)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-display text-[13px] uppercase tracking-[0.12em]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Session
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {!authConfigured
                    ? "Signal link offline"
                    : accountReady
                    ? identityLabel
                    : "Signed out"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {!authConfigured
                ? "Wire the live auth signal to bring the grid fully online."
                : accountReady
                  ? "Live sync is online. Missions, raids, rewards and reputation now pull from the same state as mobile."
                  : "Authenticate your pilot to unlock live progress, linked systems and mission state."}
            </p>
            {accountReady ? (
              <button
                onClick={() => void signOut()}
                className="mt-5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-cyan-300/8 bg-[#041017]/82 px-5 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
              <div className="min-w-0">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
                  {eyebrow}
                </p>
                <h2 className="font-display mt-2 max-w-[16ch] text-balance text-3xl font-black leading-[0.92] tracking-[0.05em] text-white sm:text-4xl xl:max-w-[15ch] 2xl:max-w-[18ch]">
                  {title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>

              <div className="hidden xl:flex xl:min-w-0 xl:flex-col xl:gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="glass-button flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-3 text-sm text-slate-300">
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="truncate text-slate-400">
                      Search missions, worlds, raids...
                    </span>
                  </div>
                  <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]">
                    <Bell className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-[112px] rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                    {accountReady ? "Live session" : "Public shell"}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Pilot
                      </p>
                      <span className="block truncate text-sm font-semibold text-white">{identityLabel}</span>
                    </div>
                    <span className="h-7 w-7 shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(192,255,0,0.85),rgba(0,204,255,0.6))]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 xl:hidden">
                <div className="glass-button flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-3 text-sm text-slate-300">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="truncate text-slate-400">
                    Search missions, worlds, raids...
                  </span>
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>

          <nav className="sticky bottom-0 z-20 border-t border-white/8 bg-black/45 px-3 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {navItems.map((item) => {
                if (item.href === "/sign-in" && accountReady) {
                  return null;
                }

                if (item.href === "/notifications" && !accountReady) {
                  return null;
                }

                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] font-semibold transition ${
                      active ? "bg-lime-300/14 text-lime-200" : "text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
