"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
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
  { href: "/quests", label: "Quests", icon: ShieldCheck },
  { href: "/defi-missions", label: "DeFi", icon: Wallet },
  { href: "/raids", label: "Raids", icon: Swords },
  { href: "/rewards", label: "Rewards", icon: Gem },
] as const;

const utilityNavItems: ReadonlyArray<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  requiresAccount?: boolean;
}> = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell, requiresAccount: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shortenWallet(address?: string | null) {
  if (!address) {
    return "Not connected";
  }

  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function TopNavLink({
  pathname,
  href,
  label,
  icon: Icon,
}: {
  pathname: string;
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border border-white/10 bg-white/[0.09] text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
          : "border border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? "text-lime-200" : "text-slate-500"}`} />
      <span>{label}</span>
    </Link>
  );
}

function UtilityLink({
  pathname,
  href,
  label,
  icon: Icon,
}: {
  pathname: string;
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
        active
          ? "border-lime-300/18 bg-lime-300/12 text-lime-100"
          : "border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function HeaderRead({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function SessionMenu({
  accountReady,
  authConfigured,
  walletReady,
  wallet,
  identityLabel,
  onSignOut,
}: {
  accountReady: boolean;
  authConfigured: boolean;
  walletReady: boolean;
  wallet?: string | null;
  identityLabel: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const accessLabel = accountReady ? "Signed in" : authConfigured ? "Preview mode" : "Auth offline";

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
      >
        <span className={`h-2 w-2 rounded-full ${accountReady ? "bg-lime-300 shadow-[0_0_14px_rgba(190,255,74,0.5)]" : "bg-slate-500"}`} />
        <span className="hidden sm:inline">Session</span>
        <span className="max-w-[7rem] truncate normal-case tracking-normal text-white sm:max-w-[9rem]">
          {walletReady ? shortenWallet(wallet) : accountReady ? identityLabel : "Guest"}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180 text-lime-200" : "text-slate-500"}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(21rem,calc(100vw-2rem))] rounded-[22px] border border-white/8 bg-[#080a0e]/95 p-3.5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-lime-300">
                Session read
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
                Compact account state without taking space from the page banner.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-2.5">
            <HeaderRead label="Access" value={accessLabel} />
            <HeaderRead label="Wallet" value={walletReady ? shortenWallet(wallet) : "Not connected"} />
            <HeaderRead label="Member" value={identityLabel} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/profile/edit"
              onClick={() => setOpen(false)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                walletReady
                  ? "border border-lime-300/18 bg-lime-300/12 text-lime-100"
                  : "border border-white/8 bg-white/[0.04] text-slate-300 hover:border-white/12 hover:text-white"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              {walletReady ? "Manage wallet" : "Connect wallet"}
            </Link>

            {accountReady ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-full border border-lime-300/18 bg-lime-300/12 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-lime-100 transition hover:bg-lime-300/18"
              >
                Access
              </Link>
            )}
          </div>
        </div>
      ) : null}
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,98,255,0.12),transparent_18%),linear-gradient(180deg,#050608_0%,#040507_36%,#020304_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#030406]/86 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <Link href="/home" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(111,249,182,0.16),rgba(116,244,255,0.12))] shadow-[0_16px_50px_rgba(0,0,0,0.3)]">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white">V</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Veltrix</p>
                  <p className="mt-1 text-sm font-semibold text-white">Member OS</p>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 xl:flex">
                {primaryNavItems.map((item) => (
                  <TopNavLink
                    key={item.href}
                    pathname={pathname}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </nav>
            </div>

            <label className="ml-auto hidden w-[min(24vw,360px)] max-w-[360px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 2xl:flex">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search spaces, quests, raids and rewards..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
              <div className="flex items-center gap-2">
                {utilityNavItems.map((item) => {
                  if (item.requiresAccount && !accountReady) {
                    return null;
                  }

                  return (
                    <UtilityLink
                      key={item.href}
                      pathname={pathname}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                    />
                  );
                })}
              </div>

              <SessionMenu
                accountReady={accountReady}
                authConfigured={authConfigured}
                walletReady={walletReady}
                wallet={profile?.wallet}
                identityLabel={identityLabel}
                onSignOut={() => void signOut()}
              />

              {!accountReady ? (
                <Link
                  href="/sign-in"
                  className="rounded-full border border-lime-300/18 bg-lime-300/12 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300/18"
                >
                  Access
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {primaryNavItems.map((item) => (
              <TopNavLink
                key={item.href}
                pathname={pathname}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2rem,3vw,3.3rem)] font-black leading-[0.96] tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[0.95rem]">
            {description}
          </p>
        </div>

        <main className="mt-8 lg:mt-10">{children}</main>
      </div>
    </div>
  );
}
