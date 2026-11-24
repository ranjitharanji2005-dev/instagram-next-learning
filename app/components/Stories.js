
"use client";

import { useEffect, useState } from "react";

export default function Stories() {
    const [stories, setStories] = useState([]);
    const [message, setMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log("API URL:", apiUrl);
    async function fetchCurrentUser() {
        const token = sessionStorage.getItem("authToken");

        try {
            const response = await fetch(`${apiUrl}/profile`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                const currentProfile = data.profile ?? data;

                // setCurrentUserId(currentProfile.id ?? null);
                setCurrentUserId(
                    currentProfile.user?.id ?? currentProfile.id ?? null
                );
                setProfile(currentProfile);
            }
        } catch (error) {
            console.error("Unable to load current user:", error);
        }
    }

    async function fetchStories() {
        const token = sessionStorage.getItem("authToken");

        try {
            const response = await fetch(`${apiUrl}/stories`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load Stories.");
            }

            // setStories(data.stories ?? []);
            // console.log("Stories from Laravel:", data.stories);

            // NestJS returns a flat list of stories.
            const allStories = data.stories ?? [];

            // Group stories by user.
            const groupedStories = Object.values(
                allStories.reduce((groups, story) => {
                    const userId = story.user?.id;

                    if (!userId) return groups;

                    if (!groups[userId]) {
                        groups[userId] = {
                            user: story.user,
                            user_id: userId,
                            stories: [],
                        };
                    }

                    groups[userId].stories.push({
                        ...story,
                        media_path: story.image,
                        media_type: "image",
                        user_id: userId,
                    });

                    return groups;
                }, {})
            );

            setStories(groupedStories);

            console.log("Grouped stories:", groupedStories);
        } catch (error) {
            setMessage(error.message || "Unable to load Stories.");
        }
    }

    async function handleDeleteStory(storyId) {
        const token = sessionStorage.getItem("authToken");

        const confirmed = window.confirm(
            "Are you sure you want to delete this Story?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${apiUrl}/stories/${storyId}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete Story.");
            }

            setStories((previousStories) =>
                previousStories
                    .map((group) => ({
                        ...group,
                        stories: group.stories.filter(
                            (story) => Number(story.id) !== Number(storyId)
                        ),
                    }))
                    .filter((group) => group.stories.length > 0)
            );

            setSelectedStory(null);
            setSelectedStoryIndex(0);
            setMessage("Story deleted successfully.");
        } catch (error) {
            setMessage(error.message || "Unable to delete Story.");
        }
    }

    async function handleUploadStory(event) {
        event.preventDefault();

        if (!selectedFile) {
            setMessage("Please select an image or video.");
            return;
        }

        const token = sessionStorage.getItem("authToken");
        const formData = new FormData();
        //formData.append("media", selectedFile);
        formData.append("image", selectedFile);

        setUploading(true);
        setMessage("");

        try {
            const response = await fetch(`${apiUrl}/stories`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Story upload failed.");
            }

            setSelectedFile(null);
            setShowUploadForm(false);
            await fetchStories();
            setMessage("Story uploaded successfully!");
        } catch (error) {
            setMessage(error.message || "Story upload failed.");
        } finally {
            setUploading(false);
        }
    }
    
    
    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        fetchCurrentUser();
        fetchStories();
    }, []);

    // function getMediaUrl(path) {
    //     const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    //     return `${baseUrl}/storage/${path}`;
    // }
     
    function getMediaUrl(path) {
        const baseUrl = apiUrl.replace(/\/api\/?$/, "");
        return `${baseUrl}/uploads/stories/${path}`;
    }

    return (
        <section style={styles.container}>
            <div style={styles.storyList}>
                <button type="button" style={styles.story}
                    onClick={() => {
                        const ownStory = stories.find(
                            (group) =>
                                Number(group.user?.id) === Number(currentUserId)
                        );

                        if (ownStory) {
                            setSelectedStory(ownStory);
                            setSelectedStoryIndex(0);
                        } else {
                            setShowUploadForm(true);
                        }
                    }}
                >
                    
                    <div style={{ ...styles.storyRing, position: "relative" ,overflow: "visible",}}>
                        {(() => {
                            const ownStory = stories.find(
                                (group) =>
                                    currentUserId !== null &&
                                    Number(group.user_id) === Number(currentUserId)
                            )?.stories?.[0];

                            const baseUrl = apiUrl.replace(/\/api\/?$/, "");

                            if (ownStory?.media_type === "video") {
                                return (
                                    <video
                                        src={`${baseUrl}/storage/${ownStory.media_path}`}
                                        muted
                                        style={styles.storyThumbnail}
                                    />
                                );
                            }

                            // if (ownStory) {
                            //     return (
                            //         <img
                            //             // src={`${baseUrl}/storage/${ownStory.media_path}`}
                            //              src={`${baseUrl}/uploads/stories/${ownStory.image}`}
                            //             alt="Your story"
                            //             style={styles.storyThumbnail}
                            //         />
                            //     );
                            // }
                            

                            {(() => {
                                const baseUrl = apiUrl.replace(/\/api\/?$/, "");

                                if (profile?.profile_image) {
                                    return (
                                        <img
                                            src={`${baseUrl}/uploads/profiles/${profile.profile_image}`}
                                            alt="Your profile"
                                            style={styles.storyThumbnail}
                                        />
                                    );
                                }

                                return (
                                    <div
                                        style={{
                                            ...styles.storyThumbnail,
                                            background: "#eee",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#555",
                                            fontSize: "25px",
                                        }}
                                    >
                                        {profile?.user?.name?.charAt(0)?.toUpperCase() ?? "Y"}
                                    </div>
                                );
                            })()}


                            if (profile?.profile_image) {
                                return (
                                    <img
                                        // src={`${baseUrl}/storage/${profile.profile_image}`}
                                        src={`${baseUrl}/uploads/profiles/${profile.profile_image}`}
                                        alt="Your profile"
                                        style={styles.storyThumbnail}
                                    />
                                );
                            }

                            return (
                                <div
                                    style={{
                                        ...styles.storyThumbnail,
                                        background: "#eee",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#555",
                                        fontSize: "25px",
                                    }}
                                >
                                    {profile?.name?.charAt(0)?.toUpperCase() ?? "Y"}
                                </div>
                            );
                        })()}

                        {/* Always show the Add Story button */}
                        <span
                            onClick={(event) => {
                                event.stopPropagation();
                                setShowUploadForm(true);
                            }}
                            style={{
                                position: "absolute",
                                right: "-1px",
                                bottom: "-1px",
                                width: "23px",
                                height: "23px",
                                borderRadius: "50%",
                                background: "#0095f6",
                                color: "#fff",
                                border: "2px solid white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "19px",
                                lineHeight: 1,
                                cursor: "pointer",
                                zIndex: 2,
                            }}
                        >
                            +
                        </span>
                    </div>

                    <span style={styles.storyName}>Your story</span>
                </button>
                
                
        {stories
            .filter(
                (group) =>
                    Number(group.user?.id) !== Number(currentUserId)
            )
            .map((group) => {
                const firstStory = group.stories[0];

                return (
                    <button
                        type="button"
                        key={group.user.id}
                        style={styles.story}
                        onClick={() => {
                            setSelectedStory(group);
                            setSelectedStoryIndex(0);
                        }}
                    >
                        
                        <div style={styles.storyRing}>
                            {group.user?.profile_image_url || group.user?.profile_image ? (
                                <img
                                    src={
                                        group.user.profile_image_url ||
                                        // getMediaUrl(group.user.profile_image)
                                        `${apiUrl.replace(/\/api\/?$/, "")}/uploads/profiles/${group.user.profile_image}`
                                    }
                                    alt={`${group.user.name}'s profile`}
                                    style={styles.storyThumbnail}
                                />
                            ) : (
                                <div
                                    style={{
                                        ...styles.storyThumbnail,
                                        background: "#eee",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#555",
                                        fontSize: "25px",
                                    }}
                                >
                                    {(group.user?.name || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>


                        <span style={styles.storyName}>
                            {group.user.name}
                        </span>
                    </button>
                );
            })}

            {stories.filter(
                (group) => Number(group.user?.id) !== Number(currentUserId)
            ).length === 0 && !message && (
                <p>No other active Stories yet.</p>
            )}

            {message && (
                <div
                    role="status"
                    style={{
                        position: "fixed",
                        top: "25px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: message.includes("successfully")
                            ? "#198754"
                            : "#dc3545",
                        color: "#ffffff",
                        padding: "12px 22px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        zIndex: 2000,
                        fontSize: "14px",
                        textAlign: "center",
                        maxWidth: "90%",
                    }}
                >
                    {message}
                </div>
            )}

            {showUploadForm && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1100,
                    background: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <form
                        onSubmit={handleUploadStory}
                        style={{
                            background: "white",
                            padding: "24px",
                            borderRadius: "12px",
                            width: "min(90%, 360px)",
                        }}
                    >
                        <h3>Add to your story</h3>

                        <input
                            type="file"
                            accept="image/*,video/*"
                            required
                            onChange={(event) =>
                                setSelectedFile(event.target.files?.[0] ?? null)
                            }
                        />

                        <div style={{ marginTop: "18px" }}>
                            <button type="submit" disabled={uploading}>
                                {uploading ? "Uploading..." : "Share Story"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowUploadForm(false);
                                    setSelectedFile(null);
                                }}
                                style={{ marginLeft: "10px" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedStory && selectedStory.stories?.length > 0 && (
                    <div
                        style={styles.viewer}
                        onClick={() => setSelectedStory(null)}
                    >
                        {(() => {
                            const currentStory =
                                selectedStory.stories[selectedStoryIndex];

                            if (!currentStory) return null;

                            return (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close Story"
                                        style={styles.closeButton}
                                        onClick={() => {
                                            setSelectedStory(null);
                                            setSelectedStoryIndex(0);
                                        }}
                                    >
                                        ×
                                    </button>

                                    <p style={styles.viewerName}>
                                        {selectedStory.user?.name ?? "User"}
                                        {" · "}
                                        {selectedStoryIndex + 1} of{" "}
                                        {selectedStory.stories.length}
                                    </p>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "12px",
                                            width: "100%",
                                        }}
                                    >
                                        {selectedStoryIndex > 0 && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedStoryIndex((index) =>
                                                        Math.max(0, index - 1)
                                                    );
                                                }}
                                                style={styles.navButton}
                                            >
                                                ← Previous
                                            </button>
                                        )}

                                        {currentStory.media_type === "video" ? (
                                            <video
                                                key={currentStory.id}
                                                src={getMediaUrl(currentStory.media_path)}
                                                controls
                                                autoPlay
                                                style={styles.viewerMedia}
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            />
                                        ) : (
                                            <img
                                                key={currentStory.id}
                                                src={getMediaUrl(currentStory.media_path)}
                                                alt="Story"
                                                style={styles.viewerMedia}
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            />
                                        )}

                                       <button
                                            type="button"
                                            disabled={
                                                selectedStoryIndex >= selectedStory.stories.length - 1
                                            }
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedStoryIndex((index) =>
                                                    Math.min(
                                                        selectedStory.stories.length - 1,
                                                        index + 1
                                                    )
                                                );
                                            }}
                                            style={{
                                                ...styles.navButton,
                                                visibility:
                                                    selectedStoryIndex >= selectedStory.stories.length - 1
                                                        ? "hidden"
                                                        : "visible",
                                            }}
                                        >
                                            Next →
                                        </button>

                                       
                                    </div>

                                    {Number(currentStory.user_id) ===
                                        Number(currentUserId) && (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "10px",
                                                marginTop: "12px",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedStory(null);
                                                    setShowUploadForm(true);
                                                }}
                                                style={styles.navButton}
                                            >
                                                + Add Story
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDeleteStory(currentStory.id);
                                                }}
                                                style={{
                                                    ...styles.navButton,
                                                    background: "#ed4956",
                                                    color: "#fff",
                                                    border: "none",
                                                }}
                                            >
                                                Delete Story
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </section>
    );
}

const styles = {
    container: {
        maxWidth: "600px",
        margin: "25px auto",
        padding: "15px 20px",
        background: "#fff",
        border: "1px solid #dbdbdb",
        borderRadius: "10px",
    },
    storyList: {
        display: "flex",
        flexWrap: "nowrap",
        gap: "16px",
        overflowX: "auto",
        padding: "10px 0",
        alignItems: "flex-start",
    },
    story: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        width: "76px",
        minWidth: "76px",
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
    },
    storyRing: {
        width: "66px",
        height: "66px",
        borderRadius: "50%",
        padding: "3px",
        background:
            "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf)",
        boxSizing: "border-box",
        overflow: "hidden",
    },
    storyThumbnail: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid white",
        boxSizing: "border-box",
        display: "block",
    },
    storyName: {
        fontSize: "12px",
        textAlign: "center",
        maxWidth: "76px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color:"#141413",
    },
    viewer: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    viewerMedia: {
        maxWidth: "min(90vw, 450px)",
        maxHeight: "75vh",
        objectFit: "contain",
    },
    viewerName: {
        color: "white",
        fontSize: "16px",
    },
    closeButton: {
        position: "absolute",
        top: "20px",
        right: "25px",
        color: "white",
        background: "transparent",
        border: "none",
        fontSize: "36px",
        cursor: "pointer",
    },
    
    navButton: {
        padding: "10px 14px",
        background: "#ffffff",
        color: "#262626",
        border: "1px solid #dbdbdb",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },
};
