"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  Compass,
  Gem,
  Home,
  Layers3,
  Radar,
  Search,
  ShieldCheck,
  Swords,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const primaryNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Radar },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/raids", label: "Raids", icon: Swords },
  { href: "/rewards", label: "Rewards", icon: Gem },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
] as const;

const accountNavItems = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/sign-in", label: "Access", icon: ShieldCheck },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shortenWallet(address?: string | null) {
  if (!address) {
    return "No wallet";
  }

  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function NavSection({
  label,
  pathname,
  items,
  accountReady,
}: {
  label: string;
  pathname: string;
  items: ReadonlyArray<{ href: string; label: string; icon: ComponentType<{ className?: string }> }>;
  accountReady: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {items.map((item) => {
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
              className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border border-lime-300/18 bg-[linear-gradient(90deg,rgba(186,255,59,0.14),rgba(74,217,255,0.08))] text-lime-100 shadow-[0_0_0_1px_rgba(186,255,59,0.12)]"
                  : "border border-transparent text-slate-300 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-lime-200" : "text-slate-400"}`} />
              <span className="font-display text-[12px] uppercase tracking-[0.16em]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
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
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { authConfigured, session, profile, signOut } = useAuth();
  const identityLabel = profile?.username ?? session?.user?.email ?? "Guest member";
  const accountReady = Boolean(session);
  const walletReady = Boolean(profile?.wallet);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.12),transparent_22%),radial-gradient(circle_at_86%_8%,rgba(74,217,255,0.14),transparent_22%),linear-gradient(180deg,#061015_0%,#071018_38%,#030508_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1660px]">
        <aside className="hidden w-[292px] shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(4,10,16,0.98),rgba(5,9,15,0.94))] px-6 py-7 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Veltrix app</p>
            <h2 className="mt-4 max-w-[10ch] text-balance text-3xl font-black leading-[0.92] tracking-[-0.04em] text-white">
              Premium member workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              One calm product layer for missions, projects, rewards, signals and account momentum.
            </p>
          </div>

          <div className="mt-7 rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">Command read</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Now</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {accountReady ? "Member session is live" : "Preview mode is active"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Next</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {walletReady ? "Stay in motion across projects and rewards" : "Connect wallet to unlock deeper actions"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Watch</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {!authConfigured ? "Auth environment still offline" : shortenWallet(profile?.wallet)}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-6">
            <NavSection label="Explore" pathname={pathname} items={primaryNavItems} accountReady={accountReady} />
            <NavSection label="Account" pathname={pathname} items={accountNavItems} accountReady={accountReady} />
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Session</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {!authConfigured ? "Auth offline" : accountReady ? identityLabel : "Signed out"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Wallet</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{shortenWallet(profile?.wallet)}</p>
                </div>
                <Wallet className={`h-4 w-4 shrink-0 ${walletReady ? "text-lime-200" : "text-slate-500"}`} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/profile/edit"
                className={`inline-flex rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  walletReady
                    ? "border border-lime-300/18 bg-lime-300/10 text-lime-100 hover:bg-lime-300/14"
                    : "border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"
                }`}
              >
                {walletReady ? "Manage wallet" : "Connect wallet"}
              </Link>
              {accountReady ? (
                <button
                  onClick={() => void signOut()}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#041017]/80 px-5 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">{eyebrow}</p>
                <h1 className="mt-3 max-w-[13ch] text-balance text-[clamp(2.5rem,4vw,4.6rem)] font-black leading-[0.92] tracking-[-0.05em] text-white">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/14 focus-within:border-cyan-300/30">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search projects, campaigns, rewards..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Access</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${accountReady ? "border-lime-300/18 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                        {accountReady ? "Signed in" : "Preview"}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${walletReady ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                        {walletReady ? "Wallet ready" : "Wallet pending"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Member</p>
                      <span className="mt-1 block truncate text-sm font-semibold text-white">{identityLabel}</span>
                    </div>
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(186,255,59,0.9),rgba(74,217,255,0.7))]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 xl:hidden">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search surfaces..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
                <Link
                  href="/profile/edit"
                  className={`inline-flex min-w-[122px] items-center justify-between gap-2 rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    walletReady
                      ? "border-lime-300/18 bg-lime-300/10 text-lime-100"
                      : "border-white/10 bg-white/[0.04] text-slate-300"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5" />
                    Wallet
                  </span>
                  <span>{walletReady ? "On" : "Off"}</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>

          <nav className="sticky bottom-0 z-20 border-t border-white/8 bg-black/50 px-3 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {[...primaryNavItems, ...accountNavItems].map((item) => {
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
                      active
                        ? "border border-lime-300/16 bg-lime-300/12 text-lime-100"
                        : "border border-transparent text-slate-400"
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
