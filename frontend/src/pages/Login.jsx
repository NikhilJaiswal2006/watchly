
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      if (!data.token) {
        throw new Error("Login succeeded but no authentication token was returned.");
      }

      // Save the token and basic user information.
      localStorage.setItem("token", data.token);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccess("Login successful! Redirecting...");

      // Change this route when your dashboard is ready.
      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check your backend."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-layout">
        {/* Left side: Watchly branding */}
        <section className="login-showcase">
          <Link to="/" className="login-brand">
            <span className="login-brand-icon">▶</span>
            <span>watchly</span>
            <span className="login-brand-dot">.</span>
          </Link>

          <div className="login-showcase-content">
            <span className="login-eyebrow">
              YOUR PEOPLE. YOUR VIDEOS.
            </span>

            <h1>
              Your next
              <br />
              watch party
              <br />
              <span>starts here.</span>
            </h1>

            <p>
              Sign in, invite your friends, and enjoy YouTube
              together in real time — wherever you are.
            </p>

            <div className="login-preview">
              <div className="login-preview-top">
                <div className="login-live">
                  <span></span> LIVE ROOM
                </div>
                <span className="login-viewers">4 watching</span>
              </div>

              <div className="login-video">
                <div className="login-video-orb"></div>
                <div className="login-play">▶</div>
                <div className="login-video-label">
                  <span>NOW PLAYING</span>
                  <strong>Good times, together.</strong>
                </div>
              </div>

              <div className="login-preview-bottom">
                <div className="login-avatars">
                  <span>N</span>
                  <span>A</span>
                  <span>R</span>
                  <span>+</span>
                </div>
                <span>Better together ✦</span>
              </div>
            </div>
          </div>

          <p className="login-showcase-footer">
            © 2026 Watchly. Made for shared moments.
          </p>
        </section>

        {/* Right side: Login form */}
        <section className="login-form-section">
          <div className="login-form-card">
            <div className="login-mobile-brand">
              <span className="login-brand-icon">▶</span>
              <span>watchly</span>
              <span className="login-brand-dot">.</span>
            </div>

            <div className="login-heading">
              <span className="login-small-label">WELCOME BACK</span>
              <h2>Good to see you.</h2>
              <p>Sign in to continue your watch party.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-password-heading">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="login-forgot"
                    onClick={() =>
                      setError(
                        "Password reset is not available yet. Please contact support."
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="login-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-show-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-message login-error" role="alert">
                  <span>!</span> {error}
                </div>
              )}

              {success && (
                <div className="login-message login-success" role="status">
                  ✓ {success}
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to Watchly <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span></span>
              <p>YOUR NEXT WATCH PARTY AWAITS</p>
              <span></span>
            </div>

            <p className="login-register-link">
              New to Watchly? <Link to="/register">Create an account</Link>
            </p>

            <p className="login-security-note">
              <span>⌑</span> Your account is protected with secure authentication.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
