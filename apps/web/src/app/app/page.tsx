"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Workspace } from "@nottermost/shared";
import { apiFetch, getToken, setToken } from "../../lib/api";

export default function AppPage() {
  const token = useMemo(() => getToken(), []);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const ws = await apiFetch<Workspace[]>("/workspaces");
        if (!cancelled) setWorkspaces(ws);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "load_failed");
      }
    }
    if (token) void load();
    else setError("missing_token");
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>App</h1>
          <div className="muted">Workspaces</div>
        </div>
        <div className="row">
          <button
            className="button secondary"
            onClick={() => {
              setToken(null);
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
          <Link className="button secondary" href="/">
            Home
          </Link>
        </div>
      </div>

      <div className="card col">
        {error ? (
          <div className="error">
            Error: {error}{" "}
            {error === "missing_token" ? (
              <span className="muted">
                (go to <Link href="/login">/login</Link>)
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="row">
          <input
            className="input"
            placeholder="New workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              setError(null);
              try {
                const ws = await apiFetch<Workspace>("/workspaces", {
                  method: "POST",
                  body: JSON.stringify({ name: newName }),
                });
                setWorkspaces((prev) => [ws, ...prev]);
                setNewName("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "create_failed");
              }
            }}
          >
            Create
          </button>
        </div>

        <div className="col" style={{ gap: 8 }}>
          {workspaces.length === 0 ? (
            <div className="muted">No workspaces yet.</div>
          ) : (
            workspaces.map((w) => (
              <div key={w.id} className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div>{w.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {w.id}
                  </div>
                </div>
                <Link className="button secondary" href={`/app/workspaces/${w.id}`}>
                  Open
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

