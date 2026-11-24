"use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [imageErrors, setImageErrors] = useState({});

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    async function handleSearch(event) {
        event.preventDefault();

        const searchText = query.trim();

        if (!searchText) {
            setUsers([]);
            setMessage("Enter a name to search.");
            return;
        }

        const token = sessionStorage.getItem("authToken");

        if (!token) {
            setMessage("Please log in first.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${encodeURIComponent(searchText)}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Search failed.");
            }

            const results = Array.isArray(data)
                ? data
                : data.users ?? [];

            setUsers(results);

            if (results.length === 0) {
                setMessage("No users found.");
            }
        } catch (error) {
            setMessage(error.message || "Unable to search users.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={styles.container}>
            <h1 style={styles.heading}>Search Users</h1>

            <form onSubmit={handleSearch} style={styles.form}>
                <input
                    type="search"
                    placeholder="Search by name..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    style={styles.input}
                />

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {message && <p>{message}</p>}

            <div style={styles.results}>
                {users.map((user) => (
                    <Link
                        key={user.id}
                        href={`/users/${user.id}`}
                        style={{
                            ...styles.userCard,
                            textDecoration: "none",
                            color: "#262626",
                            cursor: "pointer",
                        }}
                    >
                        
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "12px",
                            }}
                        >
                            {/* <img src={
                                    user?.profile_image_url ||
                                    (user?.profile_image
                                        ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/storage/${user.profile_image}`
                                        : "/default-avatar.png")
                                }
                                alt={`${user?.name ?? "Instagram user"}'s profile`} */}

                            {user.profile_image && !imageErrors[user.id] ? (
                                        <img
                                            src={`${apiUrl}/uploads/profiles/${user.profile_image}`}
                                            alt={user.name}
                                            onError={() => {
                                                setImageErrors((previous) => ({
                                                    ...previous,
                                                    [user.id]: true,
                                                }));
                                            }}
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div style={styles.avatar}>
                                            {user.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                    )}
                            <h3 style={{ margin: 0 }}>
                                {user?.name ?? "Instagram user"}
                            </h3>

                        </div>


                    </Link>
                ))}
                
            </div>
        </main>
    );
}

const styles = {
    container: {
        maxWidth: "600px",
        margin: "30px auto",
        padding: "24px",
        background: "#fff",
        border: "1px solid #dbdbdb",
        borderRadius: "12px",
    },
    heading: {
        fontSize: "24px",
        marginBottom: "20px",
        color: "#262626",
    },
    form: {
        display: "flex",
        gap: "10px",
    },
    input: {
        flex: 1,
        minWidth: 0,
        padding: "12px",
        border: "1px solid #dbdbdb",
        borderRadius: "8px",
        fontSize: "15px",
    },
    button: {
        padding: "12px 18px",
        background: "#0095f6",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
    },
    results: {
        marginTop: "20px",
    },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 0",
        borderBottom: "1px solid #eee",
        color: "#262626",
    },
    avatar: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "#e8f3ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "18px",
    },
    email: {
        margin: "4px 0 0",
        color: "#777",
        fontSize: "13px",
    },
};
