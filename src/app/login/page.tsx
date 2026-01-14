"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid password");
        setLoading(false);
        return;
      }

      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err) {
      setError("Failed to login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fff3e4,transparent_55%),radial-gradient(circle_at_right,#e8f3ea,transparent_60%),linear-gradient(180deg,#fff6ed,rgba(255,246,237,0.6))] px-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card/95 p-8 shadow-2xl">
        <h1 className="mb-2 font-display text-2xl text-foreground">
          Вхід
        </h1>
        <p className="mb-6 text-sm text-muted">
          Введіть пароль для доступу до калькулятора
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs text-muted">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Введіть пароль"
              required
              autoFocus
            />
          </label>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted">Завантаження...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
