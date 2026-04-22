import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card col">
        <h1 style={{ margin: 0 }}>Nottermost (local)</h1>
        <p className="muted" style={{ margin: 0 }}>
          Minimal UI to exercise the local API and realtime delivery.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="button" href="/login">
            Login
          </Link>
          <Link className="button secondary" href="/register">
            Create account
          </Link>
          <Link className="button secondary" href="/app">
            Open app
          </Link>
        </div>
      </div>
    </main>
  );
}

