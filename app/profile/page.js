"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profilePosts, setProfilePosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [bio, setBio] = useState("");
    const [savingBio, setSavingBio] = useState(false);
    const [bioMessage, setBioMessage] = useState("");
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [image, setImage] = useState(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
    const [profileImageMessage, setProfileImageMessage] = useState("");
    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostCaption, setEditPostCaption] = useState("");
    const [postMessages, setPostMessages] = useState({});
    const [savingPost, setSavingPost] = useState(false);

    // 1. Fetch profile, posts, followers and following
    const fetchProfile = useCallback(async () => {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            const response = await fetch(`${apiUrl}/profile`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            // if (!response.ok) {
            //     if (response.status === 401) {
            //         sessionStorage.removeItem("authToken");
            //         router.push("/login");
            //         return;
            //     }

            //     throw new Error(
            //         data.message || "Unable to load profile."
            //     );
            // }
            
            if (!response.ok) {
                throw new Error(
                    data.message || `Profile request failed: ${response.status}`
                );
            }

            setProfile(data.profile);
            setBio(data.profile.bio ?? "");

            const postsResponse = await fetch(`${apiUrl}/posts`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const postsData = await postsResponse.json();

            if (!postsResponse.ok) {
                throw new Error(
                    postsData.message || "Unable to load posts."
                );
            }
            const allPosts = Array.isArray(postsData)
                ? postsData
                : postsData.posts ?? [];

            const myPosts = allPosts.filter(
                (post) =>
                    Number(post.user?.id ?? post.user_id) ===
                    Number(data.profile.user.id)
            );

            setProfilePosts(myPosts);
            // const myPosts = (postsData.posts ?? []).filter(
            //     (post) =>
            //         // Number(post.user_id) === Number(data.profile.id)
            //         Number(post.user_id) === Number(data.profile.user.id)
            // );

            // setProfilePosts(myPosts);

            // const [followersResponse, followingResponse] =
            //     await Promise.all([
            //         fetch(
            //             `${apiUrl}/users/${data.profile.id}/followers`,
            //             {
            //                 headers: {
            //                     Accept: "application/json",
            //                     Authorization: `Bearer ${token}`,
            //                 },
            //             }
            //         ),
            //         fetch(
            //             `${apiUrl}/users/${data.profile.id}/following`,
            //             {
            //                 headers: {
            //                     Accept: "application/json",
            //                     Authorization: `Bearer ${token}`,
            //                 },
            //             }
            //         ),
            //     ]);

            // if (
            //     !followersResponse.ok ||
            //     !followingResponse.ok
            // ) {
            //     throw new Error(
            //         "Unable to load followers and following."
            //     );
            // }

            // const followersData = await followersResponse.json();
            // const followingData = await followingResponse.json();

            // setFollowers(followersData);
            // setFollowing(followingData);


            const userId = data.profile.user.id;

            const [followersResponse, followingResponse] =
                await Promise.all([
                    fetch(`${apiUrl}/users/${userId}/followers`, {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${apiUrl}/users/${userId}/following`, {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

            if (!followersResponse.ok || !followingResponse.ok) {
                throw new Error("Unable to load followers and following.");
            }

            const followersData = await followersResponse.json();
            const followingData = await followingResponse.json();
            
            setFollowers(followersData);
            setFollowing(followingData);

        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    // 2. Save bio
    async function handleSaveBio() {
        setSavingBio(true);
        setBioMessage("");

        try {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ bio }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update bio."
                );
            }

            setProfile(data.profile);
            setBio(data.profile.bio ?? "");
            setBioMessage("Bio updated successfully!");
        } catch (err) {
            setBioMessage(
                err.message || "Something went wrong."
            );
        } finally {
            setSavingBio(false);
        }
    }

    // 3. Create post
    async function handleCreatePost(event) {
        event.preventDefault();

        if (!image) {
            setUploadMessage("Please select an image.");
            return;
        }

        const token = sessionStorage.getItem("authToken");

        if (!token) {
            router.push("/login");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);
        formData.append("caption", caption);

        setUploading(true);
        setUploadMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/posts`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Post upload failed."
                );
            }

            setUploadMessage("Post uploaded successfully!");
            setImage(null);
            setCaption("");
            setShowCreatePost(false);

            // Refresh profile data after uploading
            await fetchProfile();
        } catch (err) {
            setUploadMessage(
                err.message || "Something went wrong."
            );
        } finally {
            setUploading(false);
        }
    }
    
    // Update post caption — owner only
    async function handleUpdatePost(postId) {
    const updatedCaption = editPostCaption.trim();

    if (!updatedCaption) {
        setPostMessages((current) => ({
        ...current,
        [postId]: "Caption cannot be empty.",
        }));
        return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    setSavingPost(true);

    try {
        const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`,
        {
            method: "PUT",
            headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            caption: updatedCaption,
            }),
        }
        );

        const data = await response.json();

        if (!response.ok) {
        throw new Error(data.message || "Failed to update post.");
        }

        setProfilePosts((currentPosts) =>
            currentPosts.map((post) =>
                post.id === postId
                    ? { ...post, caption: data.post.caption }
                    : post
            )
        );

        setEditingPostId(null);
        setEditPostCaption("");

        setPostMessages((current) => ({
        ...current,
        [postId]: "Post updated successfully!",
        }));
    } catch (error) {
        setPostMessages((current) => ({
        ...current,
        [postId]: error.message,
        }));
    } finally {
        setSavingPost(false);
    }
    }

    // Delete post — owner only
    async function handleDeletePost(postId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`,
        {
            method: "DELETE",
            headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            },
        }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
        throw new Error(data.message || "Failed to delete post.");
        }

        setProfilePosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId)
        );

        setPostMessages((current) => ({
        ...current,
        [postId]: "",
        }));
    } catch (error) {
        setPostMessages((current) => ({
        ...current,
        [postId]: error.message,
        }));
    }
    }
    
    async function handleProfileImageUpload(event) {
        const selectedFile = event.target.files?.[0];

        // Allow the user to cancel the file picker.
        if (!selectedFile) return;

        // Validate the selected file.
        if (!selectedFile.type.startsWith("image/")) {
            setProfileImageMessage("Please select an image file.");
            event.target.value = "";
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setProfileImageMessage("Image size must be 2 MB or less.");
            event.target.value = "";
            return;
        }

        const token = sessionStorage.getItem("authToken");

        if (!token) {
            router.push("/login");
            return;
        }

        const formData = new FormData();
        formData.append("profile_image", selectedFile);

        setUploadingProfileImage(true);
        setProfileImageMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/profile/image`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Profile image upload failed."
                );
            }

            // setProfile((previousProfile) => ({
            //     ...previousProfile,
            //     profile_image: data.profile_image,
            //     profile_image_url: data.profile_image_url,
            // }));
            setProfile(data.profile);

            setProfileImageMessage("Profile photo updated successfully!");
             setTimeout(() => {
                setProfileImageMessage("");
            }, 3000);
        } catch (err){
            setProfileImageMessage(
                err.message || "Something went wrong."
            );
            setTimeout(() => {
                setProfileImageMessage("");
            }, 3000);
        } finally {
            setUploadingProfileImage(false);
            event.target.value = "";
        }
    }

    // 4. Log out the user
    async function handleLogout() {
        const token = sessionStorage.getItem("authToken");

        try {
            if (token) {
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/logout`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }
        } catch (err) {
            console.error("Logout request failed:", err);
        } finally {
            sessionStorage.removeItem("authToken");
            router.push("/login");
        }
    }

    // 5. useEffect only triggers the initial fetch
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    if (loading) {
        return <p style={{ padding: "30px" }}>Loading profile...</p>;
    }

    if (error) {
        return (
            <p style={{ padding: "30px", color: "red" }}>
                {error}
            </p>
        );
    }

    if (!profile) {
        return <p style={{ padding: "30px" }}>Profile not found.</p>;
    }

    return (
    <main
        style={{
            maxWidth: "850px",
            margin: "35px auto",
            padding: "24px",
            fontFamily: "Arial, sans-serif",
            color: "#262626",
            backgroundColor: "#ffffff",
            minHeight: "100vh",
        }}
    >
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "30px",
            }}
        >
            <h1 style={{ fontSize: "28px", margin: 0 }}>
                My Profile
            </h1>

            <button
                type="button"
                onClick={() => router.push("/home")}
                style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#0095f6",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                }}
            >
                ← Back to Home
            </button>
        </div>

        <section
            style={{
                border: "1px solid #efefef",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
            }}
        >
            <div className="profile-columns">
               <div className="profile-left">
                <div style={{
                        width: "115px",
                        height: "115px",
                        flexShrink: 0,
                        borderRadius: "50%",
                        background:"linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf)",
                        padding: "4px",
                        boxSizing: "border-box",
                        cursor: uploadingProfileImage ? "wait" : "pointer",
                        position: "relative",
                    }}
                    onClick={() => {
                        if (!uploadingProfileImage) {
                            document.getElementById("profile-image-upload")?.click();
                        }
                    }}
                    title="Click to change profile photo"
                >
                    <div style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            border: "3px solid white",
                            boxSizing: "border-box",
                            backgroundColor: "#f4f4f4",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                            fontSize: "42px",
                            fontWeight: "bold",
                            color: "#555",
                        }}
                    >
                        {profile.profile_image_url || profile.profile_image ? (
                            <img
                                // src={
                                //     profile.profile_image_url ||
                                //     `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/storage/${profile.profile_image}`
                                // }
                                src={
                                    profile.profile_image_url ||
                                    `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/uploads/profiles/${profile.profile_image}`
                                }
                                alt="Profile photo"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                }}
                            />
                        ) : (
                            // profile.name?.charAt(0).toUpperCase()
                            profile.user.name?.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            bottom: "2px",
                            right: "2px",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#0095f6",
                            border: "3px solid white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "16px",
                        }}
                    >
                        📷
                    </div>
                </div>

                <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfileImageUpload}
                    disabled={uploadingProfileImage}
                    style={{ display: "none" }}
                />

                {uploadingProfileImage && (
                    <p style={{ fontSize: "12px" }}>Uploading photo...</p>
                )}

                {profileImageMessage && (
                    <p
                        role="status"
                        style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: profileImageMessage.includes("successfully")
                                ? "#e8f8ee"
                                : "#fdecec",
                            color: profileImageMessage.includes("successfully")
                                ? "#030e07"
                                : "#c62828",
                            fontSize: "13px",
                            fontWeight: "500",
                            textAlign: "center",
                            maxWidth: "240px",
                        }}
                    >
                        {profileImageMessage}
                    </p>
                )}

                <h2 style={{
                            fontSize: "24px",
                            fontWeight: "400",
                            margin: "0 0 20px",
                        }}>
                            {/* {profile.name} */}
                   {profile.user.name}
                </h2>

                <p style={{
                        fontSize: "14px",
                        color: "#555",
                        margin: "0 0 8px",
                    }}>
                    Profile ID: {profile.id}
                </p>
                
                {/* <div style={{ marginTop: "10px" }}>
                   <label
                        htmlFor="profile-image-upload"
                        style={{
                            display: "inline-block",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "#0095f6",
                            color: "white",
                            cursor: uploadingProfileImage ? "wait" : "pointer",
                            fontSize: "13px",
                            fontWeight: "bold",
                        }}
                    >
                        {uploadingProfileImage
                            ? "Uploading..."
                            : "Change Profile Photo"}
                    </label>

                    <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfileImageUpload}
                        disabled={uploadingProfileImage}
                        style={{ display: "none" }}
                    />

                    {profileImageMessage && (
                        <p role="status" style={{ fontSize: "12px" }}>
                            {profileImageMessage}
                        </p>
                    )}
                </div> */}
                 <section style={{ padding: "25px 0", borderBottom: "1px solid #efefef" }}>
                        <h3 style={{ marginTop: 0, fontSize: "17px" }}>
                            About me
                        </h3>

                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Write something about yourself..."
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "13px",
                                border: "1px solid #dbdbdb",
                                borderRadius: "10px",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "14px",
                                outlineColor: "#0095f6",
                                resize: "vertical",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginTop: "10px",
                            }}
                        >
                            <span style={{ fontSize: "12px", color: "#999" }}>
                                {bio.length}/500 characters
                            </span>

                            <button
                                type="button"
                                onClick={handleSaveBio}
                                disabled={savingBio}
                                style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    borderRadius: "8px",
                                    backgroundColor: "#0095f6",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    cursor: savingBio ? "not-allowed" : "pointer",
                                    opacity: savingBio ? 0.7 : 1,
                                }}
                            >
                                {savingBio ? "Saving..." : "Save Bio"}
                            </button>
                        </div>

                        {bioMessage && (
                            <p style={{ fontSize: "14px", marginBottom: 0 }}>
                                {bioMessage}
                            </p>
                        )}
                    </section>

              </div>
              <div className="profile-right">
                <div style={{ flex: 1, minWidth: "220px" }}>

                    
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            gap: "12px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Posts */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "5px",
                            }}
                        >
                            <strong style={{ fontSize: "20px" }}>
                                {profilePosts.length}
                            </strong>
                            <span style={{ fontSize: "14px", color: "#666" }}>
                                Posts
                            </span>
                        </div>

                        {/* Followers */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowFollowers(!showFollowers);
                                setShowFollowing(false);
                            }}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "5px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: "#262626",
                                padding: "0",
                            }}
                        >
                            <strong style={{ fontSize: "20px" }}>
                                {followers.length}
                            </strong>
                            <span style={{ fontSize: "14px", color: "#666" }}>
                                Followers
                            </span>
                        </button>

                        {/* Following */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowFollowing(!showFollowing);
                                setShowFollowers(false);
                            }}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "5px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: "#262626",
                                padding: "0",
                            }}
                        >
                            <strong style={{ fontSize: "20px" }}>
                                {following.length}
                            </strong>
                            <span style={{ fontSize: "14px", color: "#666" }}>
                                Following
                            </span>
                        </button>
                    </div>

                     {showFollowers && (
                        <section style={{ padding: "18px 0", borderBottom: "1px solid #efefef" }}>
                            <h3>Followers</h3>
                            {followers.length === 0 ? (
                                <p style={{ color: "#888" }}>No followers yet.</p>
                            ) : (
                                followers.map((user) => (
                                    <p key={user.id} style={{ margin: "8px 0" }}>
                                        {user.name}
                                    </p>
                                ))
                            )}
                        </section>
                    )}

                    {showFollowing && (
                        <section style={{ padding: "18px 0", borderBottom: "1px solid #efefef" }}>
                            <h3>Following</h3>
                            {following.length === 0 ? (
                                <p style={{ color: "#888" }}>You are not following anyone yet.</p>
                            ) : (
                                following.map((user) => (
                                    <p key={user.id} style={{ margin: "8px 0" }}>
                                        {user.name}
                                    </p>
                                ))
                            )}
                        </section>
                    )}


                    <div style={{ display: "flex", gap: "12px", width: "100%",flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => setShowCreatePost(true)}
                            style={{
                                padding: "9px 18px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor: "#0095f6",
                                color: "#fff",
                                fontWeight: "bold",
                                flex: 1,
                                textAlign: "center",
                                cursor: "pointer",
                            }}
                        >
                            + Create Post
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="logout-button"
                            style={{
                                padding: "9px 18px",
                                border: "1px solid #dfd7d7",
                                borderRadius: "8px",
                                backgroundColor: "#f0e4e4",
                                color: "#262626",
                                fontWeight: "bold",
                                flex: 1,
                                textAlign: "center",
                                cursor: "pointer",
                            }}
                        >
                            Log out
                        </button>
                    </div>
                </div>
            

            {showCreatePost && (
                <section
                    style={{
                        marginTop: "24px",
                        padding: "22px",
                        border: "1px solid #efefef",
                        borderRadius: "12px",
                        backgroundColor: "#fafafa",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Create a Post</h3>

                    <form onSubmit={handleCreatePost}>
                        <label htmlFor="post-image">Choose an image</label>

                        <input
                            id="post-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                                setImage(event.target.files?.[0] ?? null)
                            }
                            required
                            style={{
                                display: "block",
                                margin: "10px 0 18px",
                            }}
                        />

                        <label htmlFor="post-caption">Caption</label>

                        <textarea
                            id="post-caption"
                            value={caption}
                            onChange={(event) => setCaption(event.target.value)}
                            placeholder="Write a caption..."
                            maxLength={2200}
                            rows={3}
                            style={{
                                display: "block",
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px",
                                margin: "8px 0 16px",
                                border: "1px solid #dbdbdb",
                                borderRadius: "8px",
                                fontFamily: "Arial, sans-serif",
                            }}
                        />

                        <button
                            type="submit"
                            disabled={uploading}
                            style={{
                                padding: "10px 18px",
                                backgroundColor: "#0095f6",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "bold",
                                cursor: uploading ? "not-allowed" : "pointer",
                            }}
                        >
                            {uploading ? "Uploading..." : "Share Post"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowCreatePost(false);
                                setUploadMessage("");
                            }}
                            style={{
                                marginLeft: "10px",
                                padding: "10px 18px",
                                border: "1px solid #dbdbdb",
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>

                        {uploadMessage && (
                            <p role="status">{uploadMessage}</p>
                        )}
                    </form>
                    
                    
                </section>
            )}
            </div>
            </div>
            <section style={{ paddingTop: "25px" }}>
                <h3
                    style={{
                        textAlign: "center",
                        fontSize: "16px",
                        letterSpacing: "2px",
                        fontWeight: "600",
                        marginBottom: "22px",
                    }}
                >
                    MY POSTS 
                </h3>

                {profilePosts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 10px" }}>
                        <p style={{ fontSize: "17px", fontWeight: "bold" }}>
                            No posts yet
                        </p>
                        <p style={{ color: "#888", fontSize: "14px" }}>
                            Share your first photo to get started.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: "5px",
                        }}
                    >
                        {profilePosts.map((post) => (
                        <div
                            key={post.id}
                            style={{
                            overflow: "hidden",
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            }}
                        >
                            {/* Post image */}
                            <div
                            style={{
                                aspectRatio: "1 / 1",
                                backgroundColor: "#f2f2f2",
                                overflow: "hidden",
                            }}
                            >
                            <img
                                // src={`http://127.0.0.1:8000/storage/${post.image}`}
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/posts/${post.image}`}
                                alt={post.caption || "My post"}
                                style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                }}
                            />
                            </div>

                            {/* Post caption */}
                            <div
                            style={{
                                padding: "12px",
                                color: "#262626",
                                fontSize: "14px",
                                overflowWrap: "anywhere",
                                minHeight: "40px",
                            }}
                            >
                            {post.caption ? post.caption : "No caption added"}
                            </div>

                            
                            {/* Post caption and owner controls */}
                            <div
                                style={{
                                    padding: "12px",
                                    color: "#262626",
                                    fontSize: "14px",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {editingPostId === post.id ? (
                                    <>
                                        <textarea
                                            value={editPostCaption}
                                            onChange={(event) =>
                                                setEditPostCaption(event.target.value)
                                            }
                                            maxLength={2200}
                                            rows={3}
                                            placeholder="Edit your caption..."
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "8px",
                                                border: "1px solid #dbdbdb",
                                                borderRadius: "6px",
                                                resize: "vertical",
                                            }}
                                        />

                                        <small>{editPostCaption.length}/2200</small>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                marginTop: "10px",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleUpdatePost(post.id)}
                                                disabled={savingPost}
                                                style={{
                                                    padding: "7px 12px",
                                                    backgroundColor: "#0095f6",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {savingPost ? "Saving..." : "Save"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingPostId(null);
                                                    setEditPostCaption("");
                                                }}
                                                disabled={savingPost}
                                                style={{
                                                    padding: "7px 12px",
                                                    border: "1px solid #dbdbdb",
                                                    borderRadius: "6px",
                                                    backgroundColor: "#fff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ margin: "0 0 12px" }}>
                                            {post.caption || "No caption added"}
                                        </p>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingPostId(post.id);
                                                    setEditPostCaption(post.caption ?? "");
                                                    setPostMessages((current) => ({
                                                        ...current,
                                                        [post.id]: "",
                                                    }));
                                                }}
                                                style={{
                                                    padding: "7px 12px",
                                                    backgroundColor: "#0095f6",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeletePost(post.id)}
                                                style={{
                                                    padding: "7px 12px",
                                                    backgroundColor: "#ed4956",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}

                                {postMessages[post.id] && (
                                    <p role="status" style={{ marginTop: "8px" }}>
                                        {postMessages[post.id]}
                                    </p>
                                )}
                            </div>

                        </div>
                        ))}
                    </div>
                )}
            </section>
        </section>
    </main>
)};