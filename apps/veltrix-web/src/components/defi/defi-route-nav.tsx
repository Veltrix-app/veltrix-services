"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  BookOpenCheck,
  LayoutDashboard,
  Layers3,
  Wallet,
  WalletCards,
} from "lucide-react";

const defiRouteItems = [
  { href: "/defi", label: "Overview", icon: LayoutDashboard },
  { href: "/defi/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/defi/swap", label: "Swap", icon: ArrowRightLeft },
  { href: "/defi/vaults", label: "Vaults", icon: Wallet },
  { href: "/defi/borrow-lending", label: "Borrow", icon: Layers3 },
  { href: "/trading-arena", label: "Trading", icon: BarChart3 },
  { href: "/defi/risk-guide", label: "Risk", icon: BookOpenCheck },
  { href: "/defi/activity", label: "Activity", icon: Activity },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DefiRouteNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="DeFi routes"
      className={`flex gap-2 overflow-x-auto rounded-[24px] border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_48%,rgba(190,255,74,0.035))] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl ${
        compact ? "" : "mt-5"
      }`}
    >
      {defiRouteItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
              active
                ? "bg-[linear-gradient(135deg,#BEFF4A,#7DFFB2)] text-black shadow-[0_12px_34px_rgba(190,255,74,0.2)]"
                : "border border-white/7 bg-black/20 text-slate-300 hover:border-lime-300/18 hover:bg-white/[0.055] hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
