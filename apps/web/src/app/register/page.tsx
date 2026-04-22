"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthResponse } from "@nottermost/shared";
import { apiFetch, setToken } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="container">
      <div className="card col" style={{ maxWidth: 520 }}>
        <h1 style={{ margin: 0 }}>Create account</h1>
        <p className="muted" style={{ margin: 0 }}>
          Minimal local dev registration.
        </p>

        <form
          className="col"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              const resp = await apiFetch<AuthResponse>("/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });
              setToken(resp.token);
              router.push("/app");
            } catch (err) {
              setError(err instanceof Error ? err.message : "register_failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="col" style={{ gap: 6 }}>
            <span className="muted">Email</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span className="muted">Password (min 8 chars)</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <div className="error">Error: {error}</div> : null}

          <button className="button" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="muted" href="/login">
              Back to login
            </Link>
            <Link className="muted" href="/">
              Home
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

