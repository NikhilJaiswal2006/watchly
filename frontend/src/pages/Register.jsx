
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/register.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Check that your backend is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-glow register-glow-one" />
      <div className="register-glow register-glow-two" />

      <nav className="register-topbar">
        <Link to="/" className="register-brand" aria-label="Watchly home">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m10 9 5 3-5 3V9Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span>watchly<span className="brand-dot">.</span></span>
        </Link>

        <p className="topbar-copy">
          Already have an account?
          <Link to="/login"> Sign in</Link>
        </p>
      </nav>

      <section className="register-layout">
        <div className="register-story">
          <div className="story-eyebrow">
            <span className="eyebrow-dot" />
            YOUR PEOPLE. YOUR PLAYLIST. YOUR MOMENT.
          </div>

          <h1>
            Great videos.
            <br />
            <span>Better together.</span>
          </h1>

          <p className="story-description">
            Bring your favourite people into one room. Watch YouTube
            together, share reactions, and make every moment feel closer.
          </p>

          <div className="story-preview">
            <div className="preview-top">
              <div className="preview-live">
                <span />
                LIVE WATCH PARTY
              </div>
              <span className="preview-lock">ROOM #8421</span>
            </div>

            <div className="preview-video">
              <div className="preview-orb preview-orb-one" />
              <div className="preview-orb preview-orb-two" />

              <div className="preview-play">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.2 5.3c.7.4.7 1.3 0 1.7l-9.2 5.3c-.7.4-1.6-.1-1.6-.9V5.8Z" />
                </svg>
              </div>

              <span className="preview-caption">ONE SCREEN. ALL YOUR PEOPLE.</span>
            </div>

            <div className="preview-bottom">
              <div className="preview-avatars" aria-label="Friends watching together">
                <span>J</span>
                <span>M</span>
                <span>A</span>
                <span>R</span>
              </div>

              <div className="preview-members">
                <strong>Friends, in sync.</strong>
                <span>Every play. Every pause. Together.</span>
              </div>

              <div className="sync-indicator">
                <span />
                Synced
              </div>
            </div>
          </div>

          <div className="story-footer">
            <span>01 — CREATE</span>
            <span className="footer-line" />
            <span>02 — INVITE</span>
            <span className="footer-line" />
            <span>03 — WATCH TOGETHER</span>
          </div>
        </div>

        <div className="register-form-side">
          <div className="register-card">
            <div className="form-heading">
              <div className="form-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11l2 2 3-4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="form-kicker">YOUR NEXT FAVOURITE THING</span>
              <h2>Create your account</h2>
              <p>Good times are better when shared.</p>
            </div>

            {error && (
              <div className="form-alert form-alert-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            {success && (
              <div className="form-alert form-alert-success" role="status">
                <span aria-hidden="true">✓</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="field-group">
                <label htmlFor="register-name">Full name</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="e.g. Alex Morgan"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="register-email">Email address</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="register-password">Password</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="m7 12 3.2 3.2L17.5 8"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 12a8 8 0 1 1-2.3-5.6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Enter your password again"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <p className="password-note">
                Use at least 8 characters for a stronger password.
              </p>

              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create my account
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="terms-copy">
              By creating an account, you agree to use Watchly responsibly.
            </p>

            <div className="register-divider">
              <span />
              <span>MADE FOR SHARED MOMENTS</span>
              <span />
            </div>
          </div>

          <p className="mobile-signin">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>

      <footer className="register-bottom">
        <span>© {new Date().getFullYear()} Watchly</span>
        <span>Made for the moments you share.</span>
      </footer>
    </main>
  );
}
