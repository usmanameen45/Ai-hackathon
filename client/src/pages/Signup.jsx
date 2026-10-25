import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import SocialButtons from "../components/SocialButtons";

const MIN_PASSWORD_LENGTH = 8; // keep in sync with the backend

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    setLoading(true);
    const { error } = await authClient.signUp.email(form);
    setLoading(false);

    if (error) return setError(error.message ?? "Could not create account");
    navigate("/dashboard", { replace: true }); // backend has autoSignIn enabled
  };

  return (
    <div className="card">
      <h2>Create your account</h2>
      <p className="muted">It only takes a minute</p>

      {error && <div className="alert" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange}
            autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange}
            autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange}
            autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <div className="divider"><span>or</span></div>
      <SocialButtons onError={setError} />

      <p className="muted center-text">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
