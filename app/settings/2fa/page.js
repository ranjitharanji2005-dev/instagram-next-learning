
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TwoFactorSetup() {
  const [message, setMessage] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function setupTwoFactor() {
    setLoading(true);
    setMessage("");

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/2fa/setup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Setup failed");
      }

      setQrCodeUrl(data.qr_code_url);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyTwoFactor() {
    setLoading(true);
    setMessage("");

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/2fa/verify-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setMessage(data.message);
      setCode("");
      setQrCodeUrl("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="twofa-page">
      <div className="twofa-card">

        <div className="twofa-icon">
          ♧
        </div>

        <h1>Two-Factor Authentication</h1>

        <p className="twofa-description">
          Enable extra security for your account.
          Use Google Authenticator to protect your login.
        </p>

        {!qrCodeUrl && (
          <button
            className="twofa-button"
            onClick={setupTwoFactor}
            disabled={loading}
          >
            {loading ? "Loading..." : "Enable 2FA"}
          </button>
        )}

        {qrCodeUrl && (
          <>
            <div className="twofa-qr-section">
              <h2>Scan QR Code</h2>

              <p className="twofa-description">
                Open Google Authenticator and scan this QR code.
              </p>

              <div className="twofa-qr">
                <QRCodeSVG value={qrCodeUrl} size={190} />
              </div>
            </div>

            <label className="twofa-label">
              Enter 6-digit verification code
            </label>

            <input
              className="twofa-input"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              maxLength={6}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />

            <button
              className="twofa-button"
              style={{ marginTop: "18px" }}
              onClick={verifyTwoFactor}
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify and Enable 2FA"}
            </button>
          </>
        )}

        {message && (
          <div className="twofa-message">
            {message}
          </div>
        )}

        <p className="twofa-footer">
          Your security matters. Never share your verification code.
        </p>

      </div>
    </div>
  );
}
