
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleEmailOtpPage() {
    const router = useRouter();

    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const challengeId = sessionStorage.getItem(
            "googleEmailOtpChallengeId"
        );

        const savedEmail = sessionStorage.getItem(
            "googleEmailOtpAddress"
        );

        if (!challengeId) {
            router.replace("/login");
            return;
        }

        setEmail(savedEmail || "");
    }, [router]);

    async function handleVerify(event) {
        event.preventDefault();

        if (loading) return;

        const challengeId = sessionStorage.getItem(
            "googleEmailOtpChallengeId"
        );

        if (!challengeId) {
            setMessage("Your session expired. Please sign in again.");
            return;
        }

        if (!/^[0-9]{6}$/.test(otp)) {
            setMessage("Enter a valid 6-digit verification code.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                // `${process.env.NEXT_PUBLIC_API_URL}/auth/google/verify-email-otp`,
                `${process.env.NEXT_PUBLIC_API_URL}/auth/google/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        challenge_id: challengeId,
                        otp: otp,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (response.status === 401 || response.status === 429) {
                    sessionStorage.removeItem(
                        "googleEmailOtpChallengeId"
                    );
                    sessionStorage.removeItem(
                        "googleEmailOtpAddress"
                    );
                }

                throw new Error(
                    data.message || "Verification failed."
                );
            }

            if (!data.token) {
                throw new Error("Login token was not received.");
            }

            sessionStorage.setItem("authToken", data.token);

            sessionStorage.removeItem(
                "googleEmailOtpChallengeId"
            );
            sessionStorage.removeItem("googleEmailOtpAddress");

            setMessage("Verification successful. Redirecting...");

            router.replace("/home");
        } catch (error) {
            setMessage(
                error.message || "Unable to verify the code."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleBackToLogin() {
        sessionStorage.removeItem("googleEmailOtpChallengeId");
        sessionStorage.removeItem("googleEmailOtpAddress");
        router.replace("/login");
    }

    return (
        <main
            style={{
                maxWidth: "400px",
                margin: "80px auto",
                padding: "30px",
                textAlign: "center",
                border: "1px solid #ddd",
                borderRadius: "12px",
            }}
        >
            <h1>Verify your email</h1>

            <p>
                Enter the 6-digit code sent to your Google account.
            </p>

            {email && (
                <p style={{ color: "#666" }}>
                    {email}
                </p>
            )}

            <form onSubmit={handleVerify}>
                <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => {
                        setOtp(
                            event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                        );
                    }}
                    placeholder="Enter 6-digit code"
                    aria-label="Email verification code"
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        margin: "16px 0",
                        fontSize: "20px",
                        textAlign: "center",
                        letterSpacing: "6px",
                    }}
                />

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#0095f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "wait" : "pointer",
                    }}
                >
                    {loading ? "Verifying..." : "Verify and Sign In"}
                </button>
            </form>

            {message && (
                <p role="status" style={{ marginTop: "16px" }}>
                    {message}
                </p>
            )}

            <button
                type="button"
                onClick={handleBackToLogin}
                disabled={loading}
                style={{
                    marginTop: "16px",
                    background: "none",
                    border: "none",
                    color: "#0095f6",
                    cursor: "pointer",
                }}
            >
                Back to Login
            </button>
        </main>
    );
}
