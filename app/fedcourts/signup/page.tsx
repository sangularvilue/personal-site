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
    const res = await fetch("/api/fc/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    setLoading(false);
    const data = await res.json();
    if (!data.ok) setError(data.error || "Signup failed");
    else router.push("/me");
  }

  return (
    <div>
      <h1 className="fc-h1">Sign up</h1>
      <form onSubmit={submit} className="fc-form">
        <label>
          Username (3-20 chars, letters/numbers/_)
          <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20} />
        </label>
        <label>
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={1} maxLength={30} />
        </label>
        <label>
          Password (min 8 chars)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <p className="fc-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
