import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import SocialButtons from "../components/SocialButtons";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? "/dashboard";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email(form);

    setLoading(false);
    if (error) return setError(error.message ?? "Invalid email or password");
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="card">
      <h2>Welcome back</h2>
      <p className="muted">Log in to your account</p>

      {error && <div className="alert" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange}
            autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange}
            autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="divider"><span>or</span></div>
      <SocialButtons onError={setError} />

      <p className="muted center-text">
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
