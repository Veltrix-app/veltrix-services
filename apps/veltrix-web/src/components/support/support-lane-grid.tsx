"use client";

import { AlertTriangle, CreditCard, LifeBuoy, LogIn, Puzzle, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { supportTicketTypeOptions } from "@/lib/support/support-intake";

const iconMap = {
  product_question: Sparkles,
  technical_issue: AlertTriangle,
  billing_issue: CreditCard,
  account_access: LogIn,
  reward_or_claim_issue: Wallet,
  trust_or_abuse_report: ShieldAlert,
  provider_or_integration_issue: Puzzle,
  general_request: LifeBuoy,
} as const;

export function SupportLaneGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {supportTicketTypeOptions.map((option) => {
        const Icon = iconMap[option.value];

        return (
          <div
            key={option.value}
            className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_14px_48px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-lime-300/18 bg-lime-300/10 text-lime-200">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-white">{option.label}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{option.description}</p>
          </div>
        );
      })}
    </div>
  );
}
