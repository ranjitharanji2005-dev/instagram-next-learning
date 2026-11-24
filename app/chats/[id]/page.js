
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ChatPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const getHeaders = useCallback(() => {
        const token = sessionStorage.getItem("authToken");

        return {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        };
    }, []);

    const loadChat = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = sessionStorage.getItem("authToken");

            if (!token) {
                router.push("/login");
                return;
            }
            
            // Get the currently logged-in user.
            const meResponse = await fetch(`${apiUrl}/me`, {
                headers: getHeaders(),
            });

            const meData = await meResponse.json();

            if (!meResponse.ok) {
                throw new Error(
                    meData.message || "Unable to identify logged-in user."
                );
            }

            // Support either { user: { id: 1 } } or { id: 1 }.
            const loggedInUserId = meData.user?.id ?? meData.id;

            if (loggedInUserId == null) {
                throw new Error("Logged-in user ID was not returned by the API.");
            }

            setCurrentUserId(Number(loggedInUserId));

            // Load the conversation list for the left sidebar.
            const conversationsResponse = await fetch(
                `${apiUrl}/conversations`,
                { headers: getHeaders() }
            );
            
            
            const conversationsData = await conversationsResponse.json();

            if (!conversationsResponse.ok) {
                throw new Error(
                    conversationsData.message ||
                    "Unable to load conversations."
                );
            }

            const chatList = Array.isArray(
                conversationsData.conversations
            )
                ? conversationsData.conversations
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

            // Find the selected user.
            const selectedUser = chatList.find(
                (item) => String(item.id) === String(id)
            );

            if (!selectedUser) {
                throw new Error(
                    "This user is not in your conversations list."
                );
            }

            setUser(selectedUser);

            // Load messages for the selected conversation.
            const messagesResponse = await fetch(
                `${apiUrl}/users/${id}/messages`,
                { headers: getHeaders() }
            );

            const messagesData = await messagesResponse.json();

            if (!messagesResponse.ok) {
                throw new Error(
                    messagesData.message || "Unable to load messages."
                );
            }

            setMessages(messagesData.messages || []);

            // Mark incoming messages as read when opening this chat.
            const readResponse = await fetch(
                `${apiUrl}/users/${id}/messages/read`,
                {
                    method: "PATCH",
                    headers: getHeaders(),
                }
            );

            if (!readResponse.ok) {
                const errorDetails = await readResponse.text();

                console.error("Mark-as-read failed:",
                    readResponse.status,
                    errorDetails
                );
            } else {
                setConversations((previous) =>
                    previous.map((chat) =>
                        String(chat.id) === String(id)
                            ? { ...chat, unread_count: 0 }
                            : chat
                    )
                );
            }
            
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, getHeaders, id, router]);

    useEffect(() => {
        loadChat();
    }, [loadChat]);

    async function sendMessage(event) {
        event.preventDefault();

        const text = newMessage.trim();

        if (!text || sending) {
            return;
        }

        try {
            setSending(true);
            setError("");

            const response = await fetch(
                `${apiUrl}/users/${id}/messages`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ message: text }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to send message."
                );
            }

            const sentMessage = data.message;

            setMessages((previous) => [
                ...previous,
                sentMessage,
            ]);

            setNewMessage("");

            // Update the selected chat preview and move it to the top.
            setConversations((previous) => {
                const updated = previous.map((chat) =>
                    String(chat.id) === String(id)
                        ? {
                              ...chat,
                              latest_message:
                                  sentMessage.message || text,
                              latest_message_at:
                                  sentMessage.created_at ||
                                  new Date().toISOString(),
                          }
                        : chat
                );

                return updated.sort((a, b) => {
                    const dateA = a.latest_message_at
                        ? new Date(a.latest_message_at).getTime()
                        : 0;

                    const dateB = b.latest_message_at
                        ? new Date(b.latest_message_at).getTime()
                        : 0;

                    return dateB - dateA;
                });
            });
        } catch (err) {
            setError(err.message || "Unable to send message.");
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return <p style={{ padding: 20 }}>Loading chats...</p>;
    }

    if (error && !user) {
        return (
            <div style={{ padding: 20 }}>
                <p style={{ color: "red" }}>{error}</p>
                <button onClick={() => router.push("/chats")}>
                    Back to Chats
                </button>
            </div>
        );
    }

    return (
        <main style={styles.page}>
            {/* LEFT: Conversation list */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2 style={{ margin: 0 }}>Chats</h2>
                </div>

                <div style={styles.chatList}>
                    {conversations.length === 0 ? (
                        <p style={styles.emptySidebar}>
                            No conversations yet.
                        </p>
                    ) : (
                        conversations.map((chat) => {
                            const active =
                                String(chat.id) === String(id);

                            return (
                                <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() =>
                                        router.push(`/chats/${chat.id}`)
                                    }
                                    style={{
                                        ...styles.chatItem,
                                        background: active
                                            ? "#efefef"
                                            : "#fff",
                                    }}
                                >
                                    <div style={styles.avatar}>
                                        {chat.profile_image_url ? (
                                            <img
                                                src={chat.profile_image_url}
                                                alt={`${chat.name || "User"}'s profile`}
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                }}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            (chat.name || "?").charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    <div style={styles.chatDetails}>
                                        <strong style={styles.chatName}>
                                            {chat.name}
                                        </strong>

                                        <p style={styles.preview}>
                                            {chat.latest_message ||
                                                "Start a conversation"}
                                        </p>
                                    </div>

                                    {Number(chat.unread_count) > 0 && (
                                        <span style={styles.badge}>
                                            {chat.unread_count}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* RIGHT: Selected conversation */}
            <section style={styles.conversation}>
                <header style={styles.header}>
                    <button
                        type="button"
                        onClick={() => router.push("/chats")}
                        style={styles.backButton}
                    >
                        ←
                    </button>

                    <div style={styles.avatar}>
                        {user?.profile_image_url ? (
                            <img
                                src={user.profile_image_url}
                                alt={`${user.name || "User"}'s profile`}
                                onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            (user?.name || "?").charAt(0).toUpperCase()
                        )}
                    </div>

                    <h2 style={styles.headerName}>
                        {user?.name || "Chat"}
                    </h2>
                </header>

                <section style={styles.messages}>
                    {messages.length === 0 ? (
                        <p style={styles.empty}>
                            No messages yet. Say hello!
                        </p>
                    ) : (
                        messages.map((message) => {
                            const isMine =
                                Number(message.sender_id) === Number(currentUserId);

                            return (
                                <div
                                    key={message.id}
                                    style={{
                                        ...styles.messageRow,
                                        justifyContent: isMine ? "flex-end" : "flex-start",
                                    }}
                                >
                                    <div
                                        style={{
                                            ...styles.bubble,
                                            background: isMine ? "#3797f0" : "#e4e6eb",
                                            color: isMine ? "#fff" : "#262626",
                                        }}
                                    >
                                        {message.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>

                {error && (
                    <p style={styles.error}>{error}</p>
                )}

                <form onSubmit={sendMessage} style={styles.form}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(event) =>
                            setNewMessage(event.target.value)
                        }
                        placeholder="Write a message..."
                        maxLength={5000}
                        style={styles.input}
                    />

                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        style={{
                            ...styles.sendButton,
                            opacity:
                                sending || !newMessage.trim()
                                    ? 0.6
                                    : 1,
                        }}
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </form>
            </section>
        </main>
    );
}

const styles = {
    page: {
        display: "flex",
        width: "calc(100% - 32px)",
        maxWidth: "1100px",
        height: "80vh",
        minHeight: "450px",
        margin: "25px auto",
        border: "1px solid #dbdbdb",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#fff",
        color: "#262626",
        fontFamily: "Arial, sans-serif",
    },
    sidebar: {
        width: "320px",
        minWidth: "240px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #dbdbdb",
    },
    sidebarHeader: {
        padding: "22px 18px",
        borderBottom: "1px solid #eee",
    },
    chatList: {
        flex: 1,
        overflowY: "auto",
    },
    chatItem: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 12px",
        border: "none",
        borderBottom: "1px solid #f5f5f5",
        textAlign: "left",
        cursor: "pointer",
    },
    avatar: {
        width: "42px",
        height: "42px",
        minWidth: "42px",
        borderRadius: "50%",
        background: "#e4e4e4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#555",
    },
    chatDetails: {
        flex: 1,
        minWidth: 0,
    },
    chatName: {
        display: "block",
        fontSize: "14px",
        marginBottom: "5px",
    },
    preview: {
        margin: 0,
        fontSize: "12px",
        color: "#777",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    },
    badge: {
        minWidth: "22px",
        height: "22px",
        padding: "0 5px",
        borderRadius: "50%",
        background: "#0095f6",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
    },
    emptySidebar: {
        padding: "18px",
        color: "#777",
        fontSize: "14px",
    },
    conversation: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 18px",
        borderBottom: "1px solid #eee",
    },
    backButton: {
        border: "none",
        background: "transparent",
        fontSize: "23px",
        cursor: "pointer",
    },
    headerName: {
        margin: 0,
        fontSize: "17px",
    },
    messages: {
        flex: 1,
        overflowY: "auto",
        padding: "20px",
    },
    messageRow: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "12px",
    },
    bubble: {
        background: "#3797f0",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "18px",
        maxWidth: "75%",
        overflowWrap: "anywhere",
    },
    empty: {
        textAlign: "center",
        color: "#777",
        marginTop: "40px",
    },
    error: {
        color: "red",
        fontSize: "13px",
        padding: "0 15px",
    },
    form: {
        display: "flex",
        gap: "10px",
        borderTop: "1px solid #eee",
        padding: "15px",
    },
    input: {
        flex: 1,
        minWidth: 0,
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "22px",
        outline: "none",
    },
    sendButton: {
        background: "#0095f6",
        color: "#fff",
        border: "none",
        borderRadius: "22px",
        padding: "10px 20px",
        cursor: "pointer",
    },
    avatar: {
        width: "48px",
        height: "48px",
        minWidth: "48px",
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    messageRow: {
        display: "flex",
        width: "100%",
        marginBottom: "12px",
    },

    bubble: {
        background: "#3797f0",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "18px",
        maxWidth: "75%",
        overflowWrap: "anywhere",
    },
};
