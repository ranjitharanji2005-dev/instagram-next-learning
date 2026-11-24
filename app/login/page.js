"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Two-factor authentication state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");

  // Restore the challenge after Google redirects back to login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("two_factor") === "1") {
      const savedChallengeId = sessionStorage.getItem(
        "twoFactorChallengeId"
      );

      if (savedChallengeId) {
        setChallengeId(savedChallengeId);
        setTwoFactorRequired(true);
        setMessage(
          "Enter the six-digit code from your authenticator app."
        );
      } else {
        setMessage("Your login challenge is missing or expired. Please log in again.");
      }
    }

    const error = params.get("error");

    if (error === "google_email_not_verified") {
      setMessage("Please use a Google account with a verified email.");
    } else if (error === "google_login_failed") {
      setMessage("Google login failed. Please try again.");
    }
  }, []);

  // Step 1: Login with email and password
  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Check your details.");
        return;
      }

      // Require authenticator verification when 2FA is enabled
      if (data.two_factor_required) {
        if (!data.challenge_id) {
          setMessage("The server did not return a login challenge.");
          return;
        }

        setChallengeId(data.challenge_id);
        setTwoFactorRequired(true);
        setCode("");
        setMessage(
          "Enter the six-digit code from your authenticator app."
        );
        return;
      }

      if (!data.token) {
        setMessage("Login succeeded, but no token was returned.");
        return;
      }

      await completeLogin(data.token);
    } catch (error) {
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify the authenticator code
  async function handleVerifyTwoFactor(e) {
    e.preventDefault();
    setMessage("");

    if (!challengeId) {
      setMessage("Login challenge is missing. Please log in again.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter a valid six-digit authenticator code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/2fa/verify-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            challenge_id: challengeId,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Code verification failed.");
        return;
      }

      if (!data.token) {
        setMessage("Verification succeeded, but no token was returned.");
        return;
      }

      sessionStorage.removeItem("twoFactorChallengeId");
      await completeLogin(data.token);
    } catch (error) {
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Save token, load the profile, and redirect
  async function completeLogin(token) {
    sessionStorage.setItem("authToken", token);

    try {
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/me`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        sessionStorage.removeItem("authToken");
        setMessage("Logged in, but could not load your profile.");
        return;
      }

      sessionStorage.removeItem("twoFactorChallengeId");
      setMessage(`Welcome back, ${profileData.user.name}!`);
      router.push("/home");
    } catch (error) {
      sessionStorage.removeItem("authToken");
      setMessage("Could not load your profile. Please try again.");
    }
  }

  // Step 4: Return to email/password login
  function handleBackToLogin() {
    setTwoFactorRequired(false);
    setChallengeId("");
    setCode("");
    sessionStorage.removeItem("twoFactorChallengeId");
    setMessage("");
    router.replace("/login");
  }

  // Step 5: Start Google authentication through Laravel
  function handleGoogleLogin() {
    setMessage("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setMessage("API URL is missing. Check your .env.local file.");
      return;
    }

    // window.location.href = `${apiUrl}/auth/google/redirect`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  return (
    <main style={styles.container}>
      <form
        onSubmit={twoFactorRequired ? handleVerifyTwoFactor : handleLogin}
        style={styles.form}
      >
        <h1 style={styles.logo}>Instagram</h1>

        <p style={styles.subtitle}>
          {twoFactorRequired
            ? "Two-factor authentication"
            : "Log in to your account"}
        </p>

        {!twoFactorRequired ? (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait..." : "Log in"}
            </button>

            <div style={styles.divider}>OR</div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={styles.googleButton}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                width="18"
                height="18"
              />
              Continue with Google
            </button>
          </>
        ) : (
          <>
            <p style={styles.instruction}>
              Open your authenticator app and enter the current six-digit code.
            </p>

            <input
              type="text"
              placeholder="6-digit authenticator code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              autoFocus
              style={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait..." : "Verify code"}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={loading}
              style={styles.backButton}
            >
              Back to login
            </button>
          </>
        )}

        {message && (
          <p role="status" style={styles.message}>
            {message}
          </p>
        )}

        {!twoFactorRequired && (
          <p style={styles.footer}>
            Don&apos;t have an account?{" "}
            <a href="/" style={styles.link}>
              Sign up
            </a>
          </p>
        )}
      </form>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fafafa",
    padding: "20px",
  },
  form: {
    width: "100%",
    maxWidth: "350px",
    padding: "35px 25px",
    background: "#fff",
    border: "1px solid #dbdbdb",
    textAlign: "center",
  },
  logo: {
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#737373",
    marginBottom: "25px",
  },
  instruction: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#737373",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "10px",
    border: "1px solid #dbdbdb",
    borderRadius: "4px",
    background: "#fafafa",
  },
  button: {
    width: "100%",
    padding: "11px",
    marginTop: "8px",
    background: "#0095f6",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  divider: {
    margin: "20px 0",
    color: "#737373",
    fontSize: "13px",
    fontWeight: "bold",
  },
  googleButton: {
    width: "100%",
    padding: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background: "#fff",
    color: "#262626",
    border: "1px solid #dbdbdb",
    borderRadius: "7px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    fontSize: "14px",
    overflowWrap: "anywhere",
    marginTop: "15px",
  },
  backButton: {
    marginTop: "15px",
    padding: "8px 12px",
    background: "transparent",
    color: "#0095f6",
    border: "none",
    cursor: "pointer",
  },
  footer: {
    marginTop: "25px",
    fontSize: "14px",
  },
  link: {
    color: "#0095f6",
    fontWeight: "bold",
    textDecoration: "none",
  },
};
