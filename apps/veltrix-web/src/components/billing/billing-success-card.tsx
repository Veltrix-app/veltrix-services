"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { publicAuthRoutes } from "@/lib/account/public-auth";

function formatIntent(intent?: string | null) {
  if (intent === "pay_and_continue") {
    return "Your workspace can now jump back into the blocked action and continue from the exact upgrade point.";
  }

  return "The subscription sync and workspace routing can now continue from your normal onboarding and account flow.";
}

export function BillingSuccessCard({
  continueTo,
  planId,
  intent,
}: {
  continueTo?: string | null;
  planId?: string | null;
  intent?: string | null;
}) {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (!continueTo) {
      return;
    }

    const tickTimer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 1 ? current - 1 : current));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(continueTo);
    }, 3000);

    return () => {
      window.clearInterval(tickTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [continueTo]);

  return (
    <div className="border border-lime-300/30 bg-lime-300/[0.08] p-8">
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-lime-200">Billing updated</p>
      <h1 className="mt-4 text-4xl font-black text-white">Your checkout completed.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
        Veltrix has the payment confirmation it needs. {formatIntent(intent)}
      </p>

      {planId ? (
        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
          Active checkout selection: <span className="font-semibold text-white">{planId}</span>
        </div>
      ) : null}

      {continueTo ? (
        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
          Redirecting back into the product flow in{" "}
          <span className="font-semibold text-white">{secondsLeft}</span>{" "}
          second{secondsLeft === 1 ? "" : "s"}.
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {continueTo ? (
          <a
            href={continueTo}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            Return and continue
            <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            href={publicAuthRoutes.postAuth}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            Continue to workspace setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
        >
          Back to pricing
        </Link>
      </div>
    </div>
  );
}
