
"use client";

import { useEffect, useState } from "react";
import Stories from "../components/Stories";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("Loading your profile...");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [likeMessages, setLikeMessages] = useState({});
  const [likingPosts, setLikingPosts] = useState({});

  const [commentInputs, setCommentInputs] = useState({});
  const [commentMessages, setCommentMessages] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Fetch the logged-in user's profile.
  useEffect(() => {
    async function fetchUser() {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.user) {
          sessionStorage.removeItem("authToken");
          window.location.href = "/login";
          return;
        }

        setUser(data.user);
        setMessage("");
      } catch (error) {
        console.error("Profile error:", error);
        setMessage("Unable to load your profile.");
      }
    }

    fetchUser();
  }, []);

  // Fetch posts from Laravel.
  useEffect(() => {
    async function fetchPosts() {
      try {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          console.error("Posts API error:", response.status, data);
          throw new Error(
            data?.message || `Failed to load posts (${response.status})`
          );
        }

        // setPosts(data.posts ?? []);
        const allPosts = Array.isArray(data)
            ? data
            : data.posts ?? [];

        setPosts(allPosts);
         console.table(
    allPosts.map((post) => ({
        id: post.id,
        likes_count: post.likes_count,
        is_liked: post.is_liked,
    }))
);
        setPostsError("");
      } catch (error) {
        console.error("Posts error:", error);
        setPostsError(error.message || "Unable to load posts.");
      } finally {
        setLoadingPosts(false);
      }
    }

    fetchPosts();
  }, []);

  // Create a post.
  async function handleCreatePost(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!image) {
      setUploadMessage("Please select an image.");
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
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create post.");
      }

      setUploadMessage("Post created successfully!");
      setCaption("");
      setImage(null);

      // Refresh the feed after creating the post.
      const postsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // setPosts(postsData.posts ?? []);

        const allPosts = Array.isArray(postsData)
          ? postsData
          : postsData.posts ?? [];

      setPosts(allPosts);

      }
    } catch (error) {
      console.error("Create post error:", error);
      setUploadMessage(error.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  // Like or unlike a post.
  async function handleLike(postId) {
    // Prevent repeated clicks while the request is running.
    if (likingPosts[postId]) {
      return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      alert("Please log in to like posts.");
      return;
    }

    setLikingPosts((current) => ({
      ...current,
      [postId]: true,
    }));

    setLikeMessages((current) => ({
      ...current,
      [postId]: "",
      
    }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`,
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
        throw new Error(data.message || "Could not update like.");
      }

      // Update only the post that was liked or unliked.
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (Number(post.id) !== Number(postId)) {
            return post;
          }

          // const wasLiked = Boolean(post.liked);
          // const isLiked = Boolean(data.liked);
          const wasLiked = Boolean(post.is_liked);
          const isLiked = Boolean(data.liked);

          let count = Number(post.likes_count ?? 0);

          // Change the count only if the like status actually changed.
          if (wasLiked !== isLiked) {
            count += isLiked ? 1 : -1;
          }

          return {
            ...post,
            // liked: isLiked,
            is_liked: isLiked,
            likes_count: Math.max(0, count),
          };
        })
      );

      setLikeMessages((current) => ({
        ...current,
        [postId]: data.message || "",
      }));
    } catch (error) {
      setLikeMessages((current) => ({
        ...current,
        [postId]: error.message || "Could not update like.",
      }));
    } finally {
      setLikingPosts((current) => ({
        ...current,
        [postId]: false,
      }));
    }
  }

  // Add a comment.
  async function handleAddComment(postId) {
    const commentText = (commentInputs[postId] ?? "").trim();

    if (!commentText) {
      setCommentMessages((current) => ({
        ...current,
        [postId]: "Please enter a comment.",
      }));
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        setCommentMessages((current) => ({
          ...current,
          [postId]: "Please log in to comment.",
        }));
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            comment: commentText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add comment.");
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          Number(post.id) === Number(postId)
            ? {
                ...post,
                comments: [
                  ...(post.comments ?? []),
                  data.comment,
                ],
              }
            : post
        )
      );

      setCommentInputs((current) => ({
        ...current,
        [postId]: "",
      }));

      setCommentMessages((current) => ({
        ...current,
        [postId]: "Comment added successfully.",
      }));
    } catch (error) {
      setCommentMessages((current) => ({
        ...current,
        [postId]: error.message,
      }));
    }
  }

  // Delete a comment.
  async function handleDeleteComment(commentId, postId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`,
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
        console.error(
          "Delete comment API error:",
          response.status,
          data
        );

        throw new Error(
          data.message ||
            `Failed to delete comment (${response.status})`
        );
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          Number(post.id) === Number(postId)
            ? {
                ...post,
                comments: (post.comments ?? []).filter(
                  (comment) =>
                    Number(comment.id) !== Number(commentId)
                ),
              }
            : post
        )
      );

      setCommentMessages((current) => ({
        ...current,
        [postId]: "Comment deleted successfully.",
      }));
    } catch (error) {
      setCommentMessages((current) => ({
        ...current,
        [postId]: error.message,
      }));
    }
  }

  // Update a comment.
  async function handleUpdateComment(commentId, postId) {
    const updatedText = editCommentText.trim();

    if (!updatedText) {
      setCommentMessages((current) => ({
        ...current,
        [postId]: "Comment cannot be empty.",
      }));
      return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: updatedText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update comment.");
      }

      // Update the comment in the displayed feed.
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          Number(post.id) === Number(postId)
            ? {
                ...post,
                comments: (post.comments ?? []).map((comment) =>
                  Number(comment.id) === Number(commentId)
                    ? data.comment
                    : comment
                ),
              }
            : post
        )
      );

      setEditingCommentId(null);
      setEditCommentText("");

      setCommentMessages((current) => ({
        ...current,
        [postId]: "Comment updated successfully!",
      }));
    } catch (error) {
      setCommentMessages((current) => ({
        ...current,
        [postId]: error.message,
      }));
    }
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Instagram</h1>
      </header>

      <Stories />

      {/* Instagram posts feed */}
      <section style={styles.feed}>
        <h2>Posts Feed</h2>

        {loadingPosts && <p>Loading posts...</p>}

        {postsError && <p>{postsError}</p>}

        {!loadingPosts && !postsError && posts.length === 0 && (
          <p>No posts yet. Check back later!</p>
        )}

        {posts.map((post) => (
          <article key={post.id} style={styles.post}>
            {/* User information */}
            <div style={styles.userHeader}>
             <a href={`/users/${post.user.id}`}>
             {post.user?.profile_image ? (
              <img
                // src={
                //   post.user?.profile_image_url ||
                //   (post.user?.profile_image
                //     ? `${process.env.NEXT_PUBLIC_API_URL.replace(
                //         /\/api\/?$/,
                //         ""
                //       )}/storage/${post.user.profile_image}`
                //     : "/default-avatar.png")
                // }
                 src={
                    post.user.profile_image
                        ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/uploads/profiles/${post.user.profile_image}`
                        : "/default-avatar.png"
                }
                alt=""
                style={styles.avatar}
              />
              ) : (
                                <div style={styles.avatarFallback}>
                        {(post.user?.name || "?").charAt(0).toUpperCase()}
                    </div>
                )}
              </a>
              <a href={`/users/${post.user.id}`}>
              <h3 style={{ margin: 0 }}>
                {post.user?.name ?? "Instagram user"}
              </h3>
              </a>
            </div>  

            {/* Post image */}
            {post.image && (
              // <img
              //   src={`${process.env.NEXT_PUBLIC_API_URL.replace(
              //     /\/api\/?$/,
              //     ""
              //   )}/storage/${post.image}`}
              //   alt={post.caption || "Instagram post"}
              //   style={styles.postImage}
              // />
              <img
                  src={
                      post.image?.startsWith("http")
                          ? post.image
                          : `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/uploads/posts/${post.image}`
                  }
                  alt={post.caption || "Instagram post"}
                  style={styles.postImage}
              />
            )}

            {/* Post caption */}
            <p>{post.caption}</p>

            {/* Like button and count */}
            <button
              type="button"
              disabled={Boolean(likingPosts[post.id])}
              onClick={() => handleLike(post.id)}
              // aria-label={
              //   post.liked
              //     ? `Unlike post. ${post.likes_count ?? 0} likes`
              //     : `Like post. ${post.likes_count ?? 0} likes`
              // }
              aria-label={
                post.is_liked
                  ? `Unlike post. ${post.likes_count ?? 0} likes`
                  : `Like post. ${post.likes_count ?? 0} likes`
              }
              style={{
                ...styles.likeButton,
                cursor: likingPosts[post.id] ? "wait" : "pointer",
                opacity: likingPosts[post.id] ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  // color: post.is_liked ? "#ed4956" : "#555",
                   color: post.is_liked ? "#ed4956" : "#555",fontSize: "24px",lineHeight: 1,
                }}
              >
                {/* {post.is_liked ? "♥" : "♡"} */}
                {post.is_liked ? "♥" : "♡"}
              </span>
              {" "}
              {/* {post.likes_count ?? 0}{" "}
              {(post.likes_count ?? 0) === 1 ? "Like" : "Likes"} */}
              <span>
                {post.likes_count ?? 0}{" "}
                {(post.likes_count ?? 0) === 1 ? "Like" : "Likes"}
            </span>
            </button>

            {likeMessages[post.id] && (
              <p style={styles.statusMessage}>
                {likeMessages[post.id]}
              </p>
            )}

            {/* Comments */}
            <div style={{ marginTop: "12px" }}>
              <h4>
                Comments ({(post.comments ?? []).length})
              </h4>

              {(post.comments ?? []).map((comment) => (
                <div key={comment.id} style={styles.commentRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>
                      {comment.user?.name ?? "User"}:
                    </strong>{" "}

                    {editingCommentId === comment.id ? (
                      <div style={{ marginTop: "6px" }}>
                        <textarea
                          value={editCommentText}
                          onChange={(event) =>
                            setEditCommentText(event.target.value)
                          }
                          maxLength={2000}
                          rows={3}
                          style={styles.textarea}
                        />

                        <small>
                          {editCommentText.length}/2000
                        </small>

                        <div style={styles.commentActions}>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateComment(comment.id, post.id)
                            }
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentText("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ overflowWrap: "anywhere" }}>
                        {comment.comment}
                      </span>
                    )}
                  </div>

                  {Number(comment.user_id) === Number(user?.id) &&
                    editingCommentId !== comment.id && (
                      <div style={styles.commentActions}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.comment);
                            setCommentMessages((current) => ({
                              ...current,
                              [post.id]: "",
                            }));
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteComment(comment.id, post.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                </div>
              ))}

              {/* Add a comment */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAddComment(post.id);
                }}
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInputs[post.id] ?? ""}
                  onChange={(event) =>
                    setCommentInputs((current) => ({
                      ...current,
                      [post.id]: event.target.value,
                    }))
                  }
                  maxLength={2000}
                  style={styles.commentInput}
                />

                <small style={styles.characterCount}>
                  {(commentInputs[post.id] ?? "").length}/2000
                </small>

                <button type="submit">Comment</button>
              </form>

              {commentMessages[post.id] && (
                <p style={styles.statusMessage}>
                  {commentMessages[post.id]}
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#fafafa",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "#fff",
    borderBottom: "1px solid #dbdbdb",
  },
  logo: {
    fontSize: "28px",
    margin: 0,
  },
  feed: {
    maxWidth: "600px",
    margin: "30px auto",
    padding: "0 15px 30px",
  },
  post: {
    marginTop: "20px",
    padding: "16px",
    background: "#fff",
    border: "1px solid #dbdbdb",
    borderRadius: "8px",
  },
  userHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#eee",
  },
  postImage: {
    display: "block",
    width: "100%",
    maxHeight: "450px",
    objectFit: "cover",
    borderRadius: "6px",
  },
  likeButton: {
    border: "none",
    background: "transparent",
    fontSize: "16px",
    padding: "4px 0",
    color: "#262626",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
  },
  statusMessage: {
    fontSize: "13px",
    color: "#666",
    overflowWrap: "anywhere",
  },
  commentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "12px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
  },
  commentActions: {
    display: "flex",
    gap: "6px",
    marginTop: "6px",
  },
  commentInput: {
    width: "65%",
    padding: "10px",
    marginRight: "8px",
    boxSizing: "border-box",
  },
  characterCount: {
    color: "#777",
    marginRight: "8px",
  },
  avatarFallback: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    border: "2px solid white",
    boxSizing: "border-box",
  },
};
