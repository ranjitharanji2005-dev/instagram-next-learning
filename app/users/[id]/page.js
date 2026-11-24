"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [followers, setFollowers] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [posts, setPosts] = useState([]);
    //const [isUnfollowing, setIsUnfollowing] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // const getPostImageUrl = (image) => {
    //     if (!image) return "";

    //     if (/^https?:\/\//i.test(image)) {
    //         return image;
    //     }

    //     const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    //     const imagePath = image
    //         .replace(/^\/?storage\//, "")
    //         .replace(/^\/+/, "");

    //     return `${baseUrl}/storage/${imagePath}`;
    // };


    const getPostImageUrl = (image) => {
        if (!image) return "";

        if (/^https?:\/\//i.test(image)) {
            return image;
        }

        const baseUrl = apiUrl.replace(/\/api\/?$/, "");
        const imagePath = image
            .replace(/^\/?storage\//, "")
            .replace(/^\/?uploads\/posts\//, "")
            .replace(/^\/+/, "");

        return `${baseUrl}/uploads/posts/${imagePath}`;
    };


    const loadProfile = useCallback(async () => {
        setLoading(true);
        setMessage("");

        try {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                router.push("/login");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            };

            // 1. Get the logged-in user's details
            const meResponse = await fetch(`${apiUrl}/me`, { headers });

            if (meResponse.ok) {
                const meData = await meResponse.json();
                setCurrentUserId(meData.user?.id ?? meData.id ?? null);
            }

            // 2. Get the selected user's profile
            const response = await fetch(
                `${apiUrl}/users/${id}/profile`,
                { headers }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load profile.");
            }

            const selectedProfile = data.profile;

            setProfile(selectedProfile);
            setFollowing(Boolean(selectedProfile.is_following));

            // 3. Get posts belonging to this profile owner
            const postsResponse = await fetch(
                `${apiUrl}/users/${id}/posts`,
                { headers }
            );

            const postsData = await postsResponse.json();

            if (!postsResponse.ok) {
                throw new Error(
                    postsData.message || "Unable to load this user's posts."
                );
            }

            setPosts(
                Array.isArray(postsData.posts) ? postsData.posts : []
            );

        } catch (error) {
            setMessage(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, id, router]);

    async function handleFollow() {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            setMessage("");
            const isUnfollowing = following;
            // const response = await fetch(`${apiUrl}/users/${id}/follow`,
            const response = await fetch(
            `${apiUrl}/users/${id}/${isUnfollowing ? "unfollow" : "follow"}`,
             {
                // method: "POST",
                // headers: {
                //     Authorization: `Bearer ${token}`,
                //     Accept: "application/json",
                // },

                method: isUnfollowing ? "DELETE" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update follow status."
                );
            }

    //         const isNowFollowing = Boolean(data.following);
    //         setFollowing(isNowFollowing);

    //         setProfile((previous) => ({
    //             ...previous,
    //             followers_count: Math.max(
    //                 0,
    //                 Number(previous.followers_count || 0) +
    //                     (isNowFollowing ? 1 : -1)
    //             ),
    //         }));

    //         setMessage("");
    //     } catch (error) {
    //         setMessage(error.message || "Something went wrong.");
    //     }
    // }

        
        setFollowing(!isUnfollowing);

            setProfile((previous) => ({
                ...previous,
                followers_count: Math.max(
                    0,
                    Number(previous.followers_count || 0) +
                        (isUnfollowing ? -1 : 1)
                ),
            }));

        } catch (error) {
            setMessage(error.message || "Something went wrong.");
        }
    }

    async function loadFollowers() {
        try {
            const token = sessionStorage.getItem("authToken");
            const response = await fetch(`${apiUrl}/users/${id}/followers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load followers.");
            }

            setFollowers(Array.isArray(data) ? data : data.followers ?? []);
            setShowFollowers(true);
            setShowFollowing(false);
        } catch (error) {
            setMessage(error.message || "Failed to load followers.");
        }
    }

    async function loadFollowing() {
        try {
            const token = sessionStorage.getItem("authToken");
            const response = await fetch(`${apiUrl}/users/${id}/following`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load following.");
            }

            setFollowingList(Array.isArray(data) ? data : data.following ?? []);
            setShowFollowing(true);
            setShowFollowers(false);
        } catch (error) {
            setMessage(error.message || "Failed to load following.");
        }
    }

    useEffect(() => {
        if (id) loadProfile();
    }, [id, loadProfile]);

    const openUser = (userId) => router.push(`/users/${userId}`);

    const listStyle = {
        padding: "13px 15px",
        border: "1px solid #efefef",
        borderRadius: "12px",
        marginBottom: "8px",
        background: "#fff",
    };

    const renderUserList = (title, list, onClose, emptyText) => (
        <section style={styles.listPanel}>
            <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>{title}</h3>
                <button onClick={onClose} style={styles.closeButton}>
                    ✕
                </button>
            </div>

            {list.length === 0 ? (
                <p style={styles.muted}>{emptyText}</p>
            ) : (
                list.map((user) => (
                    <div key={user.id} style={listStyle}>
                        <button
                            onClick={() => openUser(user.id)}
                            style={styles.userLink}
                        >
                            <span style={styles.smallAvatar}>
                                {(user.name || "?").charAt(0).toUpperCase()}
                            </span>
                            {user.name}
                        </button>
                    </div>
                ))
            )}
        </section>
    );

    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <button onClick={() => router.back()} style={styles.backButton}>
                    ← <span>Back</span>
                </button>
                <span style={styles.topLabel}>Profile</span>
                <span style={{ width: "60px" }} />
            </div>

            {loading && (
                <div style={styles.statusCard}>Loading profile...</div>
            )}

            {!loading && !profile && (
                <div style={styles.statusCard}>
                    <p>Unable to display this profile.</p>
                    <button onClick={loadProfile} style={styles.primaryButton}>
                        Try again
                    </button>
                </div>
            )}

            {profile && (
                <>
                    <section style={styles.profileCard}>
                        <div style={styles.profileHeader}>
                            <div style={styles.avatarRing}>
                                
                                <div style={styles.avatar}>
                                    {/* {profile.profile_image_url ? (
                                        <img
                                            src={profile.profile_image_url}
                                            alt={`${profile.user.name || "User"}'s profile`}
                                            // alt={`${profile.name || "User"}'s profile`}
                                            onError={(event) => {
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
                                        // (profile.name || "?").charAt(0).toUpperCase()
                                        (profile.user.name || "?").charAt(0).toUpperCase()
                                    )} */}
                                    {profile.profile_image ? (
                                        <img
                                            src={`${apiUrl}/uploads/profiles/${profile.profile_image}`}
                                            alt="Profile"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: "50%",
                                            }}
                                        />
                                    ) : (
                                        (profile.user.name || "?").charAt(0).toUpperCase()
                                    )}
                                </div>

                            </div>

                            <div style={styles.profileDetails}>
                                {/* <h1 style={styles.name}>{profile.name}</h1> */}
                                <h1 style={styles.name}>{profile.user.name}</h1>
                                <p style={styles.bio}>
                                    {profile.bio || "Beautiful Soul ✨"}
                                </p>
                            </div>
                        </div>

                        <div style={styles.stats}>
                            <div style={styles.stat}>
                                <strong style={styles.statNumber}>
                                    {profile.posts_count ?? 0}
                                </strong>
                                <span style={styles.statLabel}>Posts</span>
                            </div>

                            <button
                                onClick={loadFollowers}
                                style={styles.statButton}
                            >
                                <strong style={styles.statNumber}>
                                    {profile.followers_count ?? 0}
                                </strong>
                                <span style={styles.statLabel}>Followers</span>
                            </button>

                            <button
                                onClick={loadFollowing}
                                style={styles.statButton}
                            >
                                <strong style={styles.statNumber}>
                                    {profile.following_count ?? 0}
                                </strong>
                                <span style={styles.statLabel}>Following</span>
                            </button>
                        </div>

                        {currentUserId !== null &&
                            // Number(currentUserId) !== Number(profile.id) && (
                             Number(currentUserId) !== Number(profile.user.id) && (
                                <button
                                    onClick={handleFollow}
                                    style={
                                        following
                                            ? styles.unfollowButton
                                            : styles.primaryButton
                                    }
                                >
                                    {following ? "Unfollow" : "Follow"}
                                </button>
                            )}
                    </section>

                    {showFollowers &&
                        renderUserList(
                            "Followers",
                            followers,
                            () => setShowFollowers(false),
                            "No followers yet."
                        )}

                    {showFollowing &&
                        renderUserList(
                            "Following",
                            followingList,
                            () => setShowFollowing(false),
                            "Not following anyone yet."
                        )}

                    <section style={styles.postsSection}>
                        <div style={styles.postsHeading}>
                            <span>▦</span>
                            <h2>Posts</h2>
                        </div>

                        {posts.length === 0 ? (
                            <div style={styles.emptyPosts}>
                                <div style={styles.postsIcon}>▧</div>
                                <h3>No posts to show</h3>
                                <p>Posts shared by this user will appear here.</p>
                            </div>
                        ) : (
                            <div style={styles.postsGrid}>
                                {posts.map((post) => (
                                    <div key={post.id} style={styles.postCard}>
                                        <img
                                            src={getPostImageUrl(post.image)}
                                            alt={post.caption || "User post"}
                                            style={styles.postImage}
                                        />

                                        {post.caption && (
                                            <p style={styles.postCaption}>
                                                {post.caption}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {message && <p style={styles.error}>{message}</p>}
        </main>
    );
}

const styles = {
    page: {
        maxWidth: "760px",
        minHeight: "100vh",
        margin: "24px auto",
        padding: "0 22px 40px",
        color: "#262626",
        fontFamily: "Arial, sans-serif",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid #efefef",
        marginBottom: "28px",
    },
    backButton: {
        border: "none",
        background: "transparent",
        fontSize: "15px",
        cursor: "pointer",
        color: "#262626",
        padding: "8px 0",
        width: "60px",
        textAlign: "left",
    },
    topLabel: { fontWeight: "700", fontSize: "18px" },
    profileCard: {
        background: "#fff",
        border: "1px solid #efefef",
        borderRadius: "18px",
        padding: "28px",
        boxShadow: "0 5px 22px rgba(0,0,0,0.035)",
    },
    profileHeader: {
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
    },
    avatarRing: {
        width: "112px",
        height: "112px",
        borderRadius: "50%",
        padding: "4px",
        background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf)",
        flexShrink: 0,
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "#f2e8ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "42px",
        fontWeight: "700",
        color: "#8b5bb5",
        border: "3px solid white",
        boxSizing: "border-box",
    },
    profileDetails: { flex: 1, minWidth: "180px" },
    name: { fontSize: "27px", margin: "0 0 8px", fontWeight: "600" },
    bio: { fontSize: "15px", color: "#555", margin: 0, lineHeight: 1.6 },
    stats: {
        display: "flex",
        justifyContent: "space-around",
        gap: "8px",
        padding: "24px 0",
        marginTop: "20px",
        borderTop: "1px solid #f1f1f1",
        borderBottom: "1px solid #f1f1f1",
    },
    stat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" },
    statButton: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "#262626",
        fontFamily: "inherit",
    },
    statNumber: { fontSize: "20px", fontWeight: "700" },
    statLabel: { fontSize: "13px", color: "#777" },
    primaryButton: {
        width: "100%",
        marginTop: "20px",
        padding: "12px 18px",
        background: "#0095f6",
        color: "#fff",
        border: "none",
        borderRadius: "9px",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
    },
    unfollowButton: {
        width: "100%",
        marginTop: "20px",
        padding: "12px 18px",
        background: "#f5f5f5",
        color: "#262626",
        border: "1px solid #dbdbdb",
        borderRadius: "9px",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
    },
    postsSection: { marginTop: "32px" },
    postsHeading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        borderTop: "1px solid #dbdbdb",
        padding: "18px 0",
        fontSize: "14px",
        fontWeight: "700",
        letterSpacing: "1px",
    },
    emptyPosts: {
        textAlign: "center",
        border: "1px solid #efefef",
        borderRadius: "16px",
        padding: "38px 20px",
        background: "#fff",
        color: "#555",
    },
    postsIcon: {
        width: "54px",
        height: "54px",
        margin: "0 auto 12px",
        border: "2px solid #262626",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "26px",
    },
    listPanel: {
        marginTop: "20px",
        padding: "18px",
        border: "1px solid #efefef",
        borderRadius: "14px",
        background: "#fff",
    },
    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px",
    },
    listTitle: { margin: 0, fontSize: "18px" },
    closeButton: {
        border: "none",
        background: "#f5f5f5",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        cursor: "pointer",
    },
    userLink: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border: "none",
        background: "transparent",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        padding: 0,
        color: "#262626",
    },
    smallAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#f2e8ff",
        color: "#8b5bb5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
    },
    muted: { color: "#777", fontSize: "14px" },
    statusCard: {
        textAlign: "center",
        padding: "35px 20px",
        border: "1px solid #efefef",
        borderRadius: "16px",
    },
    error: {
        marginTop: "16px",
        padding: "12px",
        borderRadius: "8px",
        background: "#fff0f0",
        color: "#c62828",
    },

    postsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "4px",
        width: "100%",
    },

    postCard: {
        minWidth: 0,
        overflow: "hidden",
        background: "#fff",
    },

    postImage: {
        display: "block",
        width: "100%",
        aspectRatio: "1 / 1",
        height: "auto",
        objectFit: "cover",
    },
};