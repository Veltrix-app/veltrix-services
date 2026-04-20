"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, Wallet } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function shortenWallet(address: string) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileEditScreen() {
  const router = useRouter();
  const {
    session,
    profile,
    updateProfile,
    verifyWallet,
    unlinkWallet,
    uploadProfileAsset,
    loading,
    error,
    clearError,
  } = useAuth();
  const { snapshot: communitySnapshot } = useCommunityJourney();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [title, setTitle] = useState("");
  const [faction, setFaction] = useState("");
  const [bio, setBio] = useState("");
  const [wallet, setWallet] = useState("");
  const [assetMessage, setAssetMessage] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<"avatar" | "banner" | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

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
    });

    if (result.ok) {
      router.push("/profile");
    }
  }

  async function handleAssetUpload(kind: "avatar" | "banner", file?: File | null) {
    if (!file) {
      return;
    }

    setAssetMessage(null);
    setUploadingKind(kind);

    const result = await uploadProfileAsset(kind, file);

    if (!result.ok || !result.url) {
      setAssetMessage(result.error ?? "Upload failed.");
      setUploadingKind(null);
      return;
    }

    if (kind === "avatar") {
      setAvatarUrl(result.url);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    } else {
      setBannerUrl(result.url);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }

    setAssetMessage(`${kind === "avatar" ? "Avatar" : "Banner"} uploaded and armed for profile save.`);
    setUploadingKind(null);
  }

  async function handleConnectWallet() {
    setWalletMessage(null);

    if (typeof window === "undefined" || !window.ethereum) {
      setWalletMessage("No browser wallet was found. Install or unlock MetaMask first.");
      return;
    }

    setConnectingWallet(true);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const nextWallet = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";

      if (!nextWallet) {
        setWalletMessage("No wallet account was returned.");
        setConnectingWallet(false);
        return;
      }

      setWallet(nextWallet);
      setWalletMessage("Requesting a signed wallet verification challenge...");

      const nonceResponse = await fetch("/api/identity/wallet/nonce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          walletAddress: nextWallet,
          chain: "evm",
        }),
      });

      const noncePayload = await nonceResponse.json().catch(() => null);

      if (!nonceResponse.ok || !noncePayload?.ok || typeof noncePayload?.message !== "string") {
        throw new Error(noncePayload?.error || "Could not create a wallet verification challenge.");
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [noncePayload.message, nextWallet],
      })) as string;

      const verification = await verifyWallet({
        walletAddress: nextWallet,
        chain: "evm",
        signature,
      });

      if (!verification.ok) {
        throw new Error(verification.error || "Wallet verification failed.");
      }

      setWallet(nextWallet);
      setWalletMessage("Wallet verified and armed as your primary identity wallet.");
    } catch (nextError) {
      setWalletMessage(
        nextError instanceof Error ? nextError.message : "Could not connect your wallet."
      );
    } finally {
      setConnectingWallet(false);
    }
  }

  async function handleDisconnectWallet() {
    setWalletMessage(null);

    const result = await unlinkWallet();
    if (!result.ok) {
      setWalletMessage(result.error || "Could not unlink your wallet.");
      return;
    }

    setWallet("");
    setWalletMessage("Wallet unlinked from your active identity profile.");
  }

  const previewInitial = (username || "R").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-6">
      {communitySnapshot.lane === "onboarding" ? (
        <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-5 text-sm text-cyan-100">
          Your onboarding rail is using this edit surface as the live identity loadout.{" "}
          <Link
            href={communitySnapshot.nextBestAction?.route ?? communitySnapshot.preferredRoute}
            className="font-semibold underline underline-offset-4"
          >
            {communitySnapshot.nextBestAction?.ctaLabel ?? "Return to your next onboarding move"}
          </Link>
        </div>
      ) : null}

      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
          Edit Profile
        </p>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Build a launch-ready identity surface.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Avatar, banner, wallet and profile fields now live in one command-grade edit flow instead
          of manual URL plumbing, so the journey can treat identity as a real loadout instead of setup debt.
        </p>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {assetMessage ? (
        <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/10 px-4 py-6 text-sm text-cyan-100">
          {assetMessage}
        </div>
      ) : null}

      {walletMessage ? (
        <div className="rounded-[24px] border border-lime-300/12 bg-lime-300/10 px-4 py-6 text-sm text-lime-100">
          {walletMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <AssetUploader
                kind="banner"
                label="Banner"
                hint="Large identity backdrop used on profile hero surfaces."
                uploading={uploadingKind === "banner"}
                imageUrl={bannerUrl}
                inputRef={bannerInputRef}
                onPick={(file) => void handleAssetUpload("banner", file)}
              />
              <AssetUploader
                kind="avatar"
                label="Avatar"
                hint="Pilot portrait used across the app."
                uploading={uploadingKind === "avatar"}
                imageUrl={avatarUrl}
                circular
                inputRef={avatarInputRef}
                onPick={(file) => void handleAssetUpload("avatar", file)}
              />
            </div>

            <div className="grid gap-4">
              <Input label="Username" value={username} onChange={setUsername} />
              <Input label="Title" value={title} onChange={setTitle} />
              <Input label="Faction" value={faction} onChange={setFaction} />
              <Textarea label="Bio" value={bio} onChange={setBio} />
            </div>

            <div className="rounded-[24px] border border-lime-300/12 bg-lime-300/6 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-lime-200">
                    Wallet layer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Connect a browser wallet, sign the Veltrix challenge, and arm it as your
                    verified identity wallet for future verification and reward eligibility.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white">
                  {profile?.walletVerified && wallet
                    ? `${shortenWallet(wallet)} • verified`
                    : shortenWallet(wallet)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleConnectWallet()}
                  disabled={connectingWallet}
                  className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  {connectingWallet ? "Connecting wallet..." : wallet ? "Reconnect wallet" : "Connect wallet"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisconnectWallet()}
                  disabled={!wallet}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear wallet
                </button>
              </div>

              <div className="mt-4">
                <Input label="Wallet address" value={wallet} onChange={() => undefined} readOnly />
              </div>
            </div>

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
          <div className="mt-4 overflow-hidden rounded-[28px] border border-white/8 bg-black/20">
            <div
              className="relative min-h-52 border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-5"
              style={
                bannerUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg,rgba(3,8,12,0.18),rgba(3,8,12,0.78)), url(${bannerUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                  {title || "Operator"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white">
                  {wallet ? "Wallet armed" : "Wallet pending"}
                </span>
              </div>

              <div className="mt-10 flex items-end gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar preview"
                    className="h-20 w-20 rounded-full border border-white/10 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-2xl font-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    {previewInitial}
                  </div>
                )}

                <div className="pb-1">
                  <p className="text-2xl font-black text-white">{username || "Raider"}</p>
                  <p className="mt-1 text-sm text-cyan-200">{title || "Elite Raider"}</p>
                  <p className="mt-1 text-sm text-slate-200">{faction || "Unassigned"}</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm leading-7 text-slate-300">{bio || "No bio set yet."}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Wallet" value={shortenWallet(wallet)} />
                <MiniStat label="Visual state" value={avatarUrl || bannerUrl ? "Armed" : "Fallback"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetUploader({
  kind,
  label,
  hint,
  uploading,
  imageUrl,
  circular = false,
  inputRef,
  onPick,
}: {
  kind: "avatar" | "banner";
  label: string;
  hint: string;
  uploading: boolean;
  imageUrl: string;
  circular?: boolean;
  inputRef: { current: HTMLInputElement | null };
  onPick: (file?: File | null) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {kind === "avatar" ? <ImagePlus className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div
        className={`mt-4 overflow-hidden border border-white/8 bg-[linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] ${
          circular ? "h-28 w-28 rounded-full" : "h-36 rounded-[20px]"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            No {kind}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.05] read-only:cursor-not-allowed read-only:opacity-80"
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
