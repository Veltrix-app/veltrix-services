"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Compass,
  Gem,
  Home,
  Layers3,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { publicEnv } from "@/lib/env";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/rewards", label: "Rewards", icon: Gem },
  { href: "/profile", label: "Profile", icon: UserRound },
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(192,255,0,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(0,204,255,0.12),_transparent_22%),linear-gradient(180deg,_#071014_0%,_#09131a_45%,_#05090c_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[272px] shrink-0 border-r border-white/8 bg-black/20 px-6 py-8 backdrop-blur-xl lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-lime-300">
              Veltrix
            </p>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Mission Control
            </h1>
            <p className="mt-3 max-w-[18rem] text-sm leading-6 text-slate-300">
              Consumer web surface for campaigns, quests, rewards and linked identity.
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-lime-300/14 text-lime-200 shadow-[0_0_0_1px_rgba(192,255,0,0.18)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Auth
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {publicEnv.authConfigured ? "Supabase wired" : "Env not configured yet"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {publicEnv.authConfigured
                ? "Next step is wiring live profile, progress and connected account reads."
                : "Add Supabase publishable envs to switch this shell from preview data to live user sessions."}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-black/25 px-5 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
                  {eyebrow}
                </p>
                <h2 className="mt-2 truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                  Signed-in preview
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>

          <nav className="sticky bottom-0 z-20 border-t border-white/8 bg-black/45 px-3 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-5 gap-2">
              {navItems.map((item) => {
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
