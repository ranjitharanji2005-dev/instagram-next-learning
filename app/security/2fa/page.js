
"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function TwoFactorPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000/api";

    async function startSetup() {
        setLoading(true);
        setMessage("");

        try {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                setMessage("Please log in first.");
                return;
            }

            const response = await fetch(`${apiUrl}/2fa/setup`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not start 2FA setup.");
            }

            setQrCodeUrl(data.qr_code_url);
            setMessage("Scan this QR code using your authenticator app.");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function verifyCode(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                setMessage("Please log in first.");
                return;
            }

            const response = await fetch(`${apiUrl}/2fa/verify-setup`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Code verification failed.");
            }

            setEnabled(true);
            setQrCodeUrl("");
            setCode("");
            setMessage("Two-factor authentication enabled successfully!");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={styles.page}>
            <section style={styles.card}>
                <h1 style={styles.heading}>Two-Factor Authentication</h1>

                <p style={styles.description}>
                    Protect your account by requiring a code from your
                    authenticator app when logging in.
                </p>

                {enabled ? (
                    <p style={styles.success}>
                        Two-factor authentication is enabled.
                    </p>
                ) : (
                    <>
                        {!qrCodeUrl && (
                            <button
                                onClick={startSetup}
                                disabled={loading}
                                style={styles.button}
                            >
                                {loading ? "Please wait..." : "Set up 2FA"}
                            </button>
                        )}

                        {qrCodeUrl && (
                            <>
                                <p>1. Open Google Authenticator on your phone.</p>
                                <p>2. Add an account and scan this QR code.</p>

                                <div style={styles.qr}>
                                    <QRCodeCanvas
                                        value={qrCodeUrl}
                                        size={220}
                                        level="M"
                                    />
                                                                    </div>

                                <p>3. Enter the six-digit code shown in the app.</p>

                                <form onSubmit={verifyCode}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        required
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                )
                                            )
                                        }
                                        placeholder="Enter 6-digit code"
                                        style={styles.input}
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || code.length !== 6}
                                        style={styles.button}
                                    >
                                        {loading ? "Verifying..." : "Verify and enable"}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                )}

                {message && (
                    <p role="status" style={styles.message}>
                        {message}
                    </p>
                )}
            </section>
        </main>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "#fafafa",
    },
    card: {
        width: "100%",
        maxWidth: "460px",
        padding: "30px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "12px",
        textAlign: "center",
    },
    heading: {
        fontSize: "24px",
        marginBottom: "12px",
    },
    description: {
        color: "#666",
        lineHeight: 1.6,
        marginBottom: "24px",
    },
    qr: {
        display: "flex",
        justifyContent: "center",
        margin: "24px 0",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        margin: "12px 0",
        border: "1px solid #ccc",
        borderRadius: "6px",
        fontSize: "18px",
        textAlign: "center",
        letterSpacing: "4px",
    },
    button: {
        width: "100%",
        padding: "12px",
        marginTop: "12px",
        background: "#0095f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "15px",
    },
    message: {
        marginTop: "18px",
        overflowWrap: "anywhere",
    },
    success: {
        color: "green",
        fontWeight: "bold",
    },
};
