"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/lsat/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    const data = await res.json();
    if (!data.ok) setError(data.error || "Login failed");
    else router.push("/me");
  }

  return (
    <div>
      <h1 className="lsat-h1">Log in</h1>
      <form onSubmit={submit} className="lsat-form">
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="lsat-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
