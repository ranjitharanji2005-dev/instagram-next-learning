
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
    const router = useRouter();
    const [message, setMessage] = useState(
        "Completing Google login..."
    );

    useEffect(() => {
        async function completeGoogleLogin() {
            try {
                const params = new URLSearchParams(
                    window.location.search
                );

                const challengeId = params.get("challenge_id");
                const email = params.get("email");

                if (!challengeId || !email) {
                    throw new Error(
                        "Google OTP challenge was not received."
                    );
                }

                // const response = await fetch(
                //     `${process.env.NEXT_PUBLIC_API_URL}/auth/google/exchange`,
                //     {
                //         method: "POST",
                //         headers: {
                //             "Content-Type": "application/json",
                //             Accept: "application/json",
                //         },
                //         body: JSON.stringify({ code }),
                //     }
                // );

                // const data = await response.json();

                // if (!response.ok || !data.success) {
                //     throw new Error(
                //         data.message || "Google login failed."
                //     );
                // }

                // if (!data.email_otp_required) {
                //     throw new Error(
                //         "Email verification is required."
                //     );
                // }

                // sessionStorage.setItem(
                //     "googleEmailOtpChallengeId",
                //     data.challenge_id
                // );

                // sessionStorage.setItem(
                //     "googleEmailOtpAddress",
                //     data.email
                // );

                sessionStorage.setItem(
                    "googleEmailOtpChallengeId",
                    challengeId
                );

                sessionStorage.setItem(
                    "googleEmailOtpAddress",
                    email
                );

                router.replace("/auth/google/verify");
            } catch (error) {
                setMessage(
                    error.message ||
                    "Unable to complete Google login."
                );
            }
        }

        completeGoogleLogin();
    }, [router]);

    return (
        <main style={{ padding: "40px", textAlign: "center" }}>
            <h1>Google Sign-In</h1>
            <p>{message}</p>
        </main>
    );
}
