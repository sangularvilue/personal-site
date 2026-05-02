"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/lsat/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        display_name: displayName,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!data.ok) setError(data.error || "Signup failed");
    else router.push("/me");
  }

  return (
    <div>
      <h1 className="lsat-h1">
        Begin a <em>book</em>.
      </h1>
      <p className="lsat-sub">
        A username (3–20 chars), a password (8+), and the name you wish
        to be known by on the roll.
      </p>

      <div className="lsat-fleuron" aria-hidden>
        <span>❦</span>
      </div>

      <form onSubmit={submit} className="lsat-form">
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[A-Za-z0-9_]{3,20}"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        {error && <p className="lsat-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "…" : "Sign your name"}
        </button>
      </form>
    </div>
  );
}
