import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { api } from "../lib/api";

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  // Demonstrates calling a protected route on your own API.
  useEffect(() => {
    api("/users/me")
      .then((data) => setProfile(data.user))
      .catch((err) => setError(err.message));
  }, []);

  const user = session?.user;

  return (
    <div className="card wide">
      <h2>Hello, {user?.name} 👋</h2>
      <p className="muted">You are signed in as {user?.email}</p>

      <h3>Response from <code>GET /api/users/me</code></h3>
      {error && <div className="alert" role="alert">{error}</div>}
      {profile ? <pre>{JSON.stringify(profile, null, 2)}</pre> : !error && <p>Loading…</p>}
    </div>
  );
}
