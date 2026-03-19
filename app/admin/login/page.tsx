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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-teal/[0.03] blur-[100px] pointer-events-none" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs animate-rise glass p-8"
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
          className="w-full px-4 py-3 glass-input rounded-xl text-text font-mono text-sm focus:outline-none focus:border-teal/30 transition-all mb-3"
        />
        {error && (
          <p className="text-red-400 text-xs mb-3 font-mono">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal/15 border border-teal/20 rounded-xl text-teal font-mono text-sm hover:bg-teal/25 transition-all disabled:opacity-50 backdrop-blur-sm"
        >
          {loading ? "..." : "log in"}
        </button>
      </form>
    </main>
  );
}
