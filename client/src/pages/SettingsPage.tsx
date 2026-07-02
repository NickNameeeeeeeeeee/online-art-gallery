import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { galleryApi, getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("The new password must contain at least eight characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await galleryApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been updated.");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="page-section page-top settings-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
        <p>Manage your sign-in details and account session.</p>
      </div>

      <div className="settings-grid">
        <section className="settings-card" aria-labelledby="account-heading">
          <p className="eyebrow">Profile</p>
          <h2 id="account-heading">Account details</h2>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
          </dl>
          <p className="settings-note">
            Changing an email address or adding a phone number requires a verified email or SMS delivery service,
            so those controls are intentionally disabled in this version.
          </p>
        </section>

        <section className="settings-card" aria-labelledby="password-heading">
          <p className="eyebrow">Security</p>
          <h2 id="password-heading">Change password</h2>
          <form onSubmit={changePassword} className="settings-form">
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <small>Use at least eight characters.</small>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-message" role="status">{message}</p>}
            <button className="button primary" type="submit" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
          </form>
        </section>

        <section className="settings-card settings-signout" aria-labelledby="session-heading">
          <div>
            <p className="eyebrow">Session</p>
            <h2 id="session-heading">Sign out</h2>
            <p>Sign out of Atelier on this device. Your favorites and exhibitions will remain in your account.</p>
          </div>
          <button className="button secondary danger-button" type="button" onClick={signOut}>Sign out</button>
        </section>
      </div>
    </div>
  );
};
