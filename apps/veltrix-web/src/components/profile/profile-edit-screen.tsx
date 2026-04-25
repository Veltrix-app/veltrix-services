"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, Wallet } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { useWalletIdentityActions } from "@/hooks/use-wallet-identity-actions";

function shortenWallet(address: string) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileEditScreen() {
  const router = useRouter();
  const {
    profile,
    updateProfile,
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
  const [uploadingKind, setUploadingKind] = useState<"avatar" | "banner" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const {
    message: walletMessage,
    connectWallet,
    disconnectWallet,
    connecting: connectingWallet,
    disconnecting: disconnectingWallet,
  } = useWalletIdentityActions();

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

    setAssetMessage(`${kind === "avatar" ? "Avatar" : "Banner"} uploaded and ready for profile save.`);
    setUploadingKind(null);
  }

  async function handleConnectWallet() {
    const result = await connectWallet();
    if (result.ok && result.walletAddress) {
      setWallet(result.walletAddress);
    }
  }

  async function handleDisconnectWallet() {
    const result = await disconnectWallet();
    if (result.ok) setWallet("");
  }

  const previewInitial = (username || "R").slice(0, 1).toUpperCase();
  const nextEditMove = !avatarUrl && !bannerUrl
    ? "Upload at least one visual so the rest of the app stops falling back to a generic identity shell."
    : !wallet
      ? "Connect and verify a wallet next so rewards and mission readiness can resolve against a live address."
      : "Save this profile loadout so the live member surfaces start reading from it."
  const watchEditCue = communitySnapshot.lane === "onboarding"
    ? communitySnapshot.nextBestAction?.description ??
      "Your onboarding lane will keep reading from this setup surface until the identity layer is complete."
    : wallet
      ? `Wallet ${shortenWallet(wallet)} is currently ${profile?.walletVerified ? "verified and armed" : "connected but still needs verification review"}.`
      : "Without a wallet, reward and verification readiness stays softer across the app.";

  return (
    <div className="space-y-5">
      {communitySnapshot.lane === "onboarding" ? (
        <div className="rounded-[18px] border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-3.5 text-[12px] text-cyan-100">
          Your onboarding path is using this edit surface as the live identity setup.{" "}
          <Link
            href={communitySnapshot.nextBestAction?.route ?? communitySnapshot.preferredRoute}
            className="font-semibold underline underline-offset-4"
          >
            {communitySnapshot.nextBestAction?.ctaLabel ?? "Return to your next onboarding move"}
          </Link>
        </div>
      ) : null}

      <section className="rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.24)] sm:p-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
          Edit Profile
        </p>
        <h3 className="mt-2.5 text-[1.1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.32rem]">
          Identity loadout
        </h3>
        <p className="mt-2 max-w-2xl text-[12px] leading-5 text-slate-300">
          Avatar, banner, wallet and profile fields now live in one guided edit flow instead of
          manual URL plumbing, so the journey can treat identity as a real member profile instead of setup debt.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <ReadTile
          label="Now"
          value={`${username || "Raider"} is shaping a live identity loadout with ${avatarUrl || bannerUrl ? "custom visuals" : "fallback visuals"} and ${wallet ? "an armed wallet" : "no wallet yet"}.`}
        />
        <ReadTile label="Next" value={nextEditMove} />
        <ReadTile label="Watch" value={watchEditCue} />
      </section>

      {error ? (
          <div className="rounded-[16px] border border-rose-400/20 bg-rose-500/10 px-3 py-3.5 text-[11px] text-rose-200">
          {error}
        </div>
      ) : null}

      {assetMessage ? (
          <div className="rounded-[16px] border border-cyan-300/12 bg-cyan-300/10 px-3 py-3.5 text-[11px] text-cyan-100">
          {assetMessage}
        </div>
      ) : null}

      {walletMessage ? (
          <div className="rounded-[16px] border border-lime-300/12 bg-lime-300/10 px-3 py-3.5 text-[11px] text-lime-100">
          {walletMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
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
                hint="Member portrait used across the app."
                uploading={uploadingKind === "avatar"}
                imageUrl={avatarUrl}
                circular
                inputRef={avatarInputRef}
                onPick={(file) => void handleAssetUpload("avatar", file)}
              />
            </div>

            <div className="grid gap-3">
              <Input label="Username" value={username} onChange={setUsername} />
              <Input label="Title" value={title} onChange={setTitle} />
              <Input label="Faction" value={faction} onChange={setFaction} />
              <Textarea label="Bio" value={bio} onChange={setBio} />
            </div>

            <div className="rounded-[18px] border border-lime-300/12 bg-lime-300/6 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-lime-200">
                    Wallet setup
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-300">
                    Connect a browser wallet, sign the Veltrix challenge, and set it as your
                    verified identity wallet for future verification and reward eligibility.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-[12px] font-semibold text-white">
                  {profile?.walletVerified && wallet
                    ? `${shortenWallet(wallet)} - verified`
                    : shortenWallet(wallet)}
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleConnectWallet()}
                  disabled={connectingWallet}
                  className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-[12px] font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  {connectingWallet ? "Connecting wallet..." : wallet ? "Reconnect wallet" : "Connect wallet"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisconnectWallet()}
                  disabled={!wallet || disconnectingWallet}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnectingWallet ? "Disconnecting..." : "Disconnect wallet"}
                </button>
              </div>

              <div className="mt-3.5">
                <Input label="Wallet address" value={wallet} onChange={() => undefined} readOnly />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => void handleSave()}
                disabled={loading}
                className="rounded-full bg-lime-300 px-4 py-2.5 text-[12px] font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save profile"}
              </button>
              <button
                onClick={() => {
                  clearError();
                  router.push("/profile");
                }}
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-lime-300">Preview</p>
          <div className="mt-3.5 overflow-hidden rounded-[22px] border border-white/8 bg-black/20">
            <div
              className="relative min-h-44 border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-4"
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
                <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                  {title || "Operator"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                    {wallet ? "Wallet ready" : "Wallet pending"}
                </span>
              </div>

              <div className="mt-8 flex items-end gap-3.5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar preview"
                    className="h-16 w-16 rounded-full border border-white/10 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[20px] font-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    {previewInitial}
                  </div>
                )}

                <div className="pb-1">
                  <p className="text-[18px] font-black text-white">{username || "Raider"}</p>
                  <p className="mt-1 text-[12px] text-cyan-200">{title || "Elite Raider"}</p>
                  <p className="mt-1 text-[12px] text-slate-200">{faction || "Unassigned"}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-[12px] leading-5 text-slate-300">{bio || "No bio set yet."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Wallet" value={shortenWallet(wallet)} />
              <MiniStat label="Visual state" value={avatarUrl || bannerUrl ? "Ready" : "Fallback"} />
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
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-white">{label}</p>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {kind === "avatar" ? <ImagePlus className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div
        className={`mt-3.5 overflow-hidden border border-white/8 bg-[linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] ${
          circular ? "h-24 w-24 rounded-full" : "h-32 rounded-[16px]"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
           <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold text-white">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className="rounded-[16px] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[12px] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.05] read-only:cursor-not-allowed read-only:opacity-80"
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
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold text-white">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 rounded-[16px] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[12px] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.05]"
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] px-3.5 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/85">{label}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-200">{value}</p>
    </div>
  );
}
