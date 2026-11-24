
"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
           // password_confirmation: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : data.message || "Registration failed.";

        setMessage(errors);
        return;
      }

      setMessage("Registration successful! Welcome, " + data.user.name + ".");
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(
        "Could not connect to NestJS. Check that your backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleRegister} style={styles.form}>
        <h1 style={styles.title}>Instagram</h1>
        <p style={styles.subtitle}>Create your account to get started.</p>

        <input style={styles.input} type="text" placeholder="Full name"
          value={name} onChange={(event) => setName(event.target.value)} required />

        <input style={styles.input} type="email" placeholder="Email address"
          value={email} onChange={(event) => setEmail(event.target.value)} required />

        <input style={styles.input} type="password" placeholder="Password (minimum 8 characters)"
          value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required/>

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>

        {message && <p role="status" style={styles.message}>{message}</p>}
        <p style={styles.loginText}>
          Already have an account?{" "}
          <a href="/login" style={styles.loginLink}>
            Log in
          </a>
        </p>
      
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fafafa",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    width: "100%",
    maxWidth: "350px",
    padding: "35px 28px",
    background: "#ffffff",
    border: "1px solid #dbdbdb",
    textAlign: "center",
  },
  title: {
    fontFamily: "cursive",
    fontSize: "38px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#737373",
    fontSize: "14px",
    marginBottom: "25px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #dbdbdb",
    borderRadius: "4px",
    background: "#fafafa",
  },
  button: {
    width: "100%",
    padding: "11px",
    marginTop: "5px",
    background: "#0095f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    marginTop: "18px",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  loginText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#737373",
  },
  loginLink: {
    color: "#0095f6",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
