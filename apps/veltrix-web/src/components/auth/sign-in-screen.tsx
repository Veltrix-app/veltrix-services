"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function SignInScreen() {
  const router = useRouter();
  const { signIn, signUp, loading, error, clearError, authConfigured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function handleSubmit() {
    clearError();

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, username);

    if (result.ok) {
      router.push("/");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px] rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
        Veltrix Access
      </p>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
        Sign in to the web mission layer
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
        This webapp shares the same Supabase auth and profile layer as the mobile app.
      </p>

      <div className="mt-8 grid grid-cols-2 rounded-full border border-white/10 bg-black/20 p-1">
        <button
          className={`rounded-full px-4 py-3 text-sm font-bold transition ${
            mode === "signin" ? "bg-lime-300 text-black" : "text-slate-300"
          }`}
          onClick={() => setMode("signin")}
        >
          Sign In
        </button>
        <button
          className={`rounded-full px-4 py-3 text-sm font-bold transition ${
            mode === "signup" ? "bg-lime-300 text-black" : "text-slate-300"
          }`}
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {mode === "signup" ? (
          <input
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        ) : null}

        <input
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!authConfigured ? (
        <div className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Supabase envs ontbreken nog. Voeg eerst de publishable web envs toe in Vercel of lokaal.
        </div>
      ) : null}

      <button
        onClick={handleSubmit}
        disabled={loading || !authConfigured}
        className="mt-6 w-full rounded-full bg-lime-300 px-5 py-4 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-lime-300/40"
      >
        {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
      </button>
    </div>
  );
}
