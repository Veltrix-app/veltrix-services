"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function ProfileEditScreen() {
  const router = useRouter();
  const { profile, updateProfile, loading, error, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [title, setTitle] = useState("");
  const [faction, setFaction] = useState("");
  const [bio, setBio] = useState("");
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatarUrl);
      setBannerUrl(profile.bannerUrl);
      setTitle(profile.title);
      setFaction(profile.faction);
      setBio(profile.bio);
      setWallet(profile.wallet);
    }
  }, [profile]);

  async function handleSave() {
    const result = await updateProfile({
      username,
      avatarUrl,
      bannerUrl,
      title,
      faction,
      bio,
      wallet,
    });

    if (result.ok) {
      router.push("/profile");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
          Edit Profile
        </p>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Tune the identity surface that powers web and mobile.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Username, title, faction, wallet and visuals all feed the same live profile layer the
          consumer app already uses.
        </p>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-4">
            <Input label="Username" value={username} onChange={setUsername} />
            <Input label="Title" value={title} onChange={setTitle} />
            <Input label="Faction" value={faction} onChange={setFaction} />
            <Textarea label="Bio" value={bio} onChange={setBio} />
            <Input label="Wallet" value={wallet} onChange={setWallet} />
            <p className="-mt-2 text-sm leading-6 text-slate-400">
              Your wallet is used for project verification, reward eligibility and future trust signals.
            </p>
            <Input label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />
            <Input label="Banner URL" value={bannerUrl} onChange={setBannerUrl} />

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => void handleSave()}
                disabled={loading}
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save profile"}
              </button>
              <button
                onClick={() => {
                  clearError();
                  router.push("/profile");
                }}
                className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">Preview</p>
          <div className="mt-4 rounded-[28px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl font-black text-white">
                {(username || "R").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-black text-white">{username || "Raider"}</p>
                <p className="mt-1 text-sm text-cyan-200">{title || "Elite Raider"}</p>
                <p className="mt-1 text-sm text-slate-400">{faction || "Unassigned"}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              {bio || "No bio set yet."}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Wallet: {wallet || "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.05]"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.05]"
      />
    </label>
  );
}
