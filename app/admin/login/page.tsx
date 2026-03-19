"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Wrong password");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs animate-rise"
      >
        <h1 className="font-mono text-teal text-xl font-medium mb-8 text-center">
          admin
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text font-mono text-sm focus:outline-none focus:border-teal/50 transition-colors mb-3"
        />
        {error && (
          <p className="text-red-400 text-xs mb-3 font-mono">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal/20 border border-teal/30 rounded-lg text-teal font-mono text-sm hover:bg-teal/30 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "log in"}
        </button>
      </form>
    </main>
  );
}
