import { connectedAccounts } from "@/lib/demo-data";
import { publicEnv } from "@/lib/env";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";

export function ProfileScreen() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            Identity Hub
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Connected accounts become the switchboard for verification-aware quests.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This is the first web version of the user profile: tier, XP, streak, trust posture and
            provider linking all live in one place so web and mobile can share the same identity layer.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">XP</p>
              <p className="mt-3 text-3xl font-black text-white">1,480</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Streak</p>
              <p className="mt-3 text-3xl font-black text-white">7</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Trust</p>
              <p className="mt-3 text-3xl font-black text-white">92</p>
            </div>
          </div>
        </div>

        <Surface
          eyebrow="Session"
          title="Auth foundation"
          description="Sprint one wires the auth surface first, then we swap preview data for live Supabase session state."
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">Supabase client</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {publicEnv.authConfigured
                  ? "Publishable Supabase envs are present, so the web app can graduate to live sign-in and user session reads next."
                  : "Publishable Supabase envs are still missing, so this MVP currently renders preview data for the first shell and profile surfaces."}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">Linked account source</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Connected accounts will read from <code className="rounded bg-white/8 px-1 py-0.5 text-xs">user_connected_accounts</code> and control which quests can start verification.
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Connected Accounts"
        title="Provider readiness"
        description="This is the first UX pass for identity linking on web: clear states, clear next action, no hidden dependencies."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {connectedAccounts.map((account) => (
            <div
              key={account.provider}
              className="rounded-[28px] border border-white/8 bg-black/20 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-black text-white">{account.label}</p>
                <StatusChip
                  label={
                    account.state === "connected"
                      ? "Connected"
                      : account.state === "reconnect_needed"
                      ? "Reconnect"
                      : "Not connected"
                  }
                  tone={
                    account.state === "connected"
                      ? "positive"
                      : account.state === "reconnect_needed"
                      ? "warning"
                      : "default"
                  }
                />
              </div>
              <p className="mt-3 text-sm text-cyan-200">{account.handle}</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">{account.detail}</p>
              <button className="mt-6 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                {account.state === "connected"
                  ? `Manage ${account.label}`
                  : account.state === "reconnect_needed"
                  ? `Reconnect ${account.label}`
                  : `Connect ${account.label}`}
              </button>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
