import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await login(email, password);
      const destination = (location.state as { from?: string } | null)?.from || "/";
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page page-section page-top">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <div className="field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary full" disabled={saving}>{saving ? "Signing in…" : "Sign in"}</button>
        <p>New to Atelier? <Link to="/register">Create an account</Link>.</p>
      </form>
    </div>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await register(name, email, password);
      navigate("/collections");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page page-section page-top">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Your private gallery</p>
        <h1>Create an account</h1>
        <div className="field"><label htmlFor="register-name">Name</label><input id="register-name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="field"><label htmlFor="register-email">Email</label><input id="register-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="field"><label htmlFor="register-password">Password</label><input id="register-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><small>Use at least eight characters.</small></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary full" disabled={saving}>{saving ? "Creating account…" : "Create account"}</button>
        <p>Already registered? <Link to="/login">Sign in</Link>.</p>
      </form>
    </div>
  );
};
