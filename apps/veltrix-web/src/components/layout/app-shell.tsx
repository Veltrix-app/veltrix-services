"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
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
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWalletIdentityActions } from "@/hooks/use-wallet-identity-actions";
import {
  getMainPageSignalBanner,
  type MainPageSignalBanner,
} from "@/lib/navigation/page-signal-banners";

const primaryNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Radar },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/quests", label: "Quests", icon: ShieldCheck },
  {
    href: "/defi",
    label: "DeFi",
    icon: Wallet,
    aliases: ["/defi-missions", "/trading-arena"],
    children: [
      { href: "/defi", label: "Overview" },
      { href: "/defi/portfolio", label: "Portfolio" },
      { href: "/defi/swap", label: "Swap" },
      { href: "/defi/vaults", label: "Vaults" },
      { href: "/defi/borrow-lending", label: "Borrow / lending" },
      { href: "/trading-arena", label: "Trading Arena" },
      { href: "/defi/risk-guide", label: "Risk guide" },
      { href: "/defi/activity", label: "Activity" },
    ],
  },
  { href: "/raids", label: "Raids", icon: Swords },
  { href: "/rewards", label: "Rewards", icon: Gem },
] as const;

const utilityNavItems: ReadonlyArray<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  requiresAccount?: boolean;
}> = [
  { href: "/xp", label: "XP Economy", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell, requiresAccount: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const RAID_HERO_IMAGE_SRC = "/brand/heroes/vyntro-raids-hero.png";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveNavItem(pathname: string, item: (typeof primaryNavItems)[number]) {
  if (isActivePath(pathname, item.href)) {
    return true;
  }

  if ("aliases" in item && item.aliases.some((alias) => isActivePath(pathname, alias))) {
    return true;
  }

  return "children" in item && item.children.some((child) => isActivePath(pathname, child.href));
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] transition min-[1720px]:px-2.5 min-[1720px]:text-[11px] ${
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

function TopNavItem({
  pathname,
  item,
  mobile = false,
}: {
  pathname: string;
  item: (typeof primaryNavItems)[number];
  mobile?: boolean;
}) {
  if (!("children" in item)) {
    return (
      <TopNavLink
        pathname={pathname}
        href={item.href}
        label={item.label}
        icon={item.icon}
      />
    );
  }

  const Icon = item.icon;
  const active = isActiveNavItem(pathname, item);

  if (mobile) {
    return (
      <TopNavLink pathname={pathname} href={item.href} label={item.label} icon={item.icon} />
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] transition min-[1720px]:px-2.5 min-[1720px]:text-[11px] ${
          active
            ? "border border-white/10 bg-white/[0.09] text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
            : "border border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        <Icon className={`h-3.5 w-3.5 ${active ? "text-lime-200" : "text-slate-500"}`} />
        <span>{item.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-hover:rotate-180 group-hover:text-lime-200" />
      </Link>

      <div className="invisible absolute left-0 top-[calc(100%+0.65rem)] z-50 min-w-[15rem] rounded-[22px] border border-white/8 bg-[#080a0e]/96 p-2 opacity-0 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {item.children.map((child) => {
          const childActive = isActivePath(pathname, child.href);

          return (
            <Link
              key={child.href}
              href={child.href}
              className={`flex items-center justify-between gap-4 rounded-[16px] px-3.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                childActive
                  ? "bg-lime-300/12 text-lime-100"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {child.label}
              <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-lime-300" : "bg-white/12"}`} />
            </Link>
          );
        })}
      </div>
    </div>
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
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition 2xl:h-11 2xl:w-11 ${
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

function MainPageSignalBannerCard({ banner }: { banner: MainPageSignalBanner }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = banner.slides[activeSlideIndex] ?? banner.slides[0];

  useEffect(() => {
    if (banner.slides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % banner.slides.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [banner.route, banner.slides.length]);

  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(14,17,22,0.72),rgba(7,9,12,0.82))] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl xl:ml-auto xl:w-[min(430px,27vw)]">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/28 to-transparent" />

      <Link href={banner.href} className="group block">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] border border-white/8 bg-black">
          {activeSlide ? (
            <Image
              src={activeSlide.src}
              alt={activeSlide.alt}
              fill
              sizes="(min-width: 1280px) 430px, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
              priority={banner.route === "/home"}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_54%,rgba(0,0,0,0.62))]" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <span className="rounded-full border border-white/12 bg-black/45 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">
              {activeSlide?.label ?? banner.signal}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-200 transition group-hover:translate-x-0.5">
              {banner.cta}
            </span>
          </div>
        </div>

        <div className="px-2.5 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-lime-300">
                {banner.eyebrow}
              </p>
              <h2 className="mt-2 text-[0.95rem] font-black leading-tight tracking-[-0.035em] text-white">
                {banner.title}
              </h2>
            </div>
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,255,74,0.5)]" />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">{banner.copy}</p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-white/6 px-2.5 py-2">
        <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
          {banner.signal}
        </span>
        <div className="flex items-center gap-1.5" aria-label="Banner slideshow controls">
          {banner.slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`Show ${slide.label} slide`}
              aria-current={index === activeSlideIndex}
              onClick={() => setActiveSlideIndex(index)}
              className={`h-1.5 rounded-full transition ${
                index === activeSlideIndex
                  ? "w-5 bg-lime-300"
                  : "w-1.5 bg-white/18 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RaidPageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative isolate -mt-px overflow-hidden bg-[#020304]">
      <div className="relative min-h-[430px] sm:min-h-[500px] lg:min-h-[620px] 2xl:min-h-[680px]">
        <Image
          src={RAID_HERO_IMAGE_SRC}
          alt="VYNTRO raids world"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.92] saturate-125"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,38,52,0.1),transparent_30%),linear-gradient(90deg,#020304_0%,rgba(2,3,4,0.68)_18%,rgba(2,3,4,0.12)_50%,rgba(2,3,4,0.62)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#030406] via-[#030406]/62 to-transparent" />
        <div className="absolute inset-x-0 bottom-[-1px] h-56 bg-[linear-gradient(180deg,transparent_0%,rgba(2,3,4,0.58)_42%,#020304_100%)] sm:h-64 lg:h-72" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#020304]/85 to-transparent" />

        <div className="relative mx-auto flex min-h-[430px] max-w-[1720px] items-end px-4 pb-32 pt-20 sm:min-h-[500px] sm:px-6 lg:min-h-[620px] lg:px-8 lg:pb-40 2xl:min-h-[680px]">
          <div className="max-w-2xl pb-8 [text-shadow:0_18px_60px_rgba(0,0,0,0.75)]">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-rose-200/90">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[clamp(2.1rem,4vw,4.9rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-rose-50/78 sm:text-[0.98rem]">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionMenu({
  accountReady,
  authConfigured,
  walletReady,
  wallet,
  onSignOut,
}: {
  accountReady: boolean;
  authConfigured: boolean;
  walletReady: boolean;
  wallet?: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    message: walletMessage,
    connectWallet,
    disconnectWallet,
    connecting,
    disconnecting,
  } = useWalletIdentityActions();
  const accessLabel = accountReady ? "Signed in" : authConfigured ? "Preview mode" : "Auth offline";
  const walletStatusLabel = walletReady ? "Wallet connected" : accountReady ? "Wallet needed" : "Guest";

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-0 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white sm:w-auto sm:px-3.5 sm:py-2.5"
      >
        <span className={`h-2 w-2 rounded-full ${accountReady ? "bg-lime-300 shadow-[0_0_14px_rgba(190,255,74,0.5)]" : "bg-slate-500"}`} />
        <span className="hidden sm:inline">Session</span>
        <span className="hidden max-w-[7rem] truncate normal-case tracking-normal text-white sm:inline sm:max-w-[9rem]">
          {walletReady ? shortenWallet(wallet) : accountReady ? "Wallet needed" : "Guest"}
        </span>
        <ChevronDown className={`hidden h-3.5 w-3.5 transition sm:block ${open ? "rotate-180 text-lime-200" : "text-slate-500"}`} />
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
            <HeaderRead label="Status" value={walletStatusLabel} />
          </div>

          {walletMessage ? (
            <div className="mt-3 rounded-[16px] border border-lime-300/14 bg-lime-300/10 px-3 py-2.5 text-[11px] leading-5 text-lime-100">
              {walletMessage}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {accountReady ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (walletReady) {
                      void disconnectWallet();
                    } else {
                      void connectWallet();
                    }
                  }}
                  disabled={connecting || disconnecting}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    walletReady
                      ? "border border-rose-300/18 bg-rose-300/10 text-rose-100 hover:bg-rose-300/14"
                      : "border border-lime-300/18 bg-lime-300/12 text-lime-100 hover:bg-lime-300/18"
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {connecting
                    ? "Connecting..."
                    : disconnecting
                      ? "Disconnecting..."
                      : walletReady
                        ? "Disconnect wallet"
                        : "Connect wallet"}
                </button>

                <Link
                  href="/profile/edit"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
                >
                  Manage identity
                </Link>
              </>
            ) : null}

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
  hidePageHeader = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  hidePageHeader?: boolean;
}) {
  const pathname = usePathname();
  const { authConfigured, session, profile, signOut } = useAuth();
  const accountReady = Boolean(session);
  const walletReady = Boolean(profile?.wallet);
  const mainPageSignalBanner = getMainPageSignalBanner(pathname);
  const hasRaidHero = pathname === "/raids";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,98,255,0.12),transparent_18%),linear-gradient(180deg,#050608_0%,#040507_36%,#020304_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#030406]/86 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 2xl:gap-4">
            <Link href="/home" className="flex shrink-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(111,249,182,0.16),rgba(116,244,255,0.12))] shadow-[0_16px_50px_rgba(0,0,0,0.3)]">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white">V</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">VYNTRO</p>
                <p className="mt-1 text-sm font-semibold text-white">Member OS</p>
              </div>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden 2xl:flex min-[1720px]:gap-1">
              {primaryNavItems.map((item) => (
                <TopNavItem key={item.href} pathname={pathname} item={item} />
              ))}
            </nav>

            <label className="hidden min-w-[180px] w-[min(16vw,230px)] shrink items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-3 2xl:flex">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="flex shrink-0 items-center justify-end gap-1.5 2xl:gap-2">
              <div className="hidden items-center gap-1.5 sm:flex 2xl:gap-2">
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
                onSignOut={() => void signOut()}
              />

              {!accountReady ? (
                <Link
                  href="/sign-in"
                  className="hidden rounded-full border border-lime-300/18 bg-lime-300/12 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300/18 sm:inline-flex"
                >
                  Access
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 2xl:hidden">
            {primaryNavItems.map((item) => (
              <TopNavItem key={item.href} pathname={pathname} item={item} mobile />
            ))}
          </div>
        </div>
      </header>

      {hasRaidHero ? <RaidPageHero eyebrow={eyebrow} title={title} description={description} /> : null}

      <div
        className={`mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 ${
          hasRaidHero ? "relative z-10 -mt-24 pb-6 lg:-mt-32 lg:pb-7" : "py-6 lg:py-7"
        }`}
      >
        {!hasRaidHero && !hidePageHeader ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300">{eyebrow}</p>
              <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2rem,3vw,3.3rem)] font-black leading-[0.96] tracking-[-0.04em] text-white">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[0.95rem]">
                {description}
              </p>
            </div>

            {mainPageSignalBanner ? (
              <MainPageSignalBannerCard key={mainPageSignalBanner.route} banner={mainPageSignalBanner} />
            ) : null}
          </div>
        ) : null}

        <main className={hasRaidHero || hidePageHeader ? "" : "mt-8 lg:mt-10"}>{children}</main>
      </div>
    </div>
  );
}
