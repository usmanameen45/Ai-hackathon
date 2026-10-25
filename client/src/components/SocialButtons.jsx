import { useState } from "react";
import { authClient } from "../lib/auth-client";

const PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "facebook", label: "Continue with Facebook" },
];

export default function SocialButtons({ onError }) {
  const [loading, setLoading] = useState(null);

  const handleClick = async (provider) => {
    setLoading(provider);
    // The callback URL must be an absolute URL on the frontend.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}/login`,
    });
    // On success the browser is redirected, so we only get here on failure.
    if (error) {
      onError?.(error.message ?? `Could not sign in with ${provider}`);
      setLoading(null);
    }
  };

  return (
    <div className="social">
      {PROVIDERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className="btn btn-outline"
          disabled={loading !== null}
          onClick={() => handleClick(id)}
        >
          {loading === id ? "Redirecting…" : label}
        </button>
      ))}
    </div>
  );
}
