"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChatsPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");


    async function loadConversations() {
            try {
                const token = sessionStorage.getItem("authToken");

                if (!token) {
                    setMessage("Please log in to view your chats.");
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/conversations`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load conversations."
                    );
                }

                const chatList = Array.isArray(data.conversations)
                    ? data.conversations
                    : [];

                chatList.sort((a, b) => {
                    const dateA = a.latest_message_at
                        ? new Date(a.latest_message_at).getTime()
                        : 0;

                    const dateB = b.latest_message_at
                        ? new Date(b.latest_message_at).getTime()
                        : 0;

                    return dateB - dateA;
                });

                setConversations(chatList);
            } catch (error) {
                setMessage(error.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        }
        
    useEffect(() => {

        loadConversations();
    }, []);

    return (
        <main className="chats-page">
            <h1>Chats</h1>

            {loading && <p>Loading chats...</p>}

            {!loading && message && (
                <p className="chats-error">{message}</p>
            )}

            {!loading && !message && conversations.length === 0 && (
                <p>No conversations found. Follow someone to start chatting.</p>
            )}

            {!loading &&
                !message &&
                conversations.map((chat) => (
                    <Link
                        key={chat.id}
                        href={`/chats/${chat.id}`}
                        className="chat-item"
                    >
                        <div className="chat-avatar">
                            {chat.profile_image_url ? (
                                <img
                                    src={chat.profile_image_url}
                                    alt={`${chat.name || "User"}'s profile`}
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.style.display = "none";
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                (chat.name || "?").charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="chat-details">
                            <strong className="chat-name">
                                {chat.name}
                            </strong>

                            <p className="chat-preview">
                                {chat.latest_message ||
                                    "Start a conversation"}
                            </p>
                        </div>

                        {Number(chat.unread_count) > 0 && (
                            <span className="chat-unread">
                                {chat.unread_count}
                            </span>
                        )}
                    </Link>
                ))}
        </main>
    );
}