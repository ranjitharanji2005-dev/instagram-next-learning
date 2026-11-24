"use client";

import { useState, useEffect } from "react";

export default function TestStoryPage() {
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState("");
    const [stories, setStories] = useState([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(null);

    async function uploadStory(event) {
        event.preventDefault();

        if (!image) {
            setMessage("Please select an image.");
            return;
        }

        const token = sessionStorage.getItem("authToken");

        const formData = new FormData();
        formData.append("image", image);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stories`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Upload failed.");
            }

            setMessage("Story uploaded successfully!");
            console.log(data);
        } catch (error) {
            setMessage(error.message);
        }
    }

    async function fetchStories() {
        const token = sessionStorage.getItem("authToken");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stories`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load stories.");
            }

            setStories(data.stories ?? []);
        } catch (error) {
            setMessage(error.message);
        }
    }
     
    function nextStory() {
    if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
        setCurrentStoryIndex(null);
    }
}

function previousStory() {
    if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
    }
}
    useEffect(() => {
    fetchStories();
}, []);

    return (
        <div>
            <h1>Test Story Upload</h1>

            <form onSubmit={uploadStory}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                        setImage(event.target.files[0])
                    }
                />

                <button type="submit">
                    Upload Story
                </button>
            </form>
            <h2>Active Stories</h2>

{stories.length === 0 ? (
    <p>No active Stories yet.</p>
) : (
    stories.map((story, index) => (
        <button
            key={story.id}
            onClick={() => setCurrentStoryIndex(index)}
        >
            <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/stories/${story.image}`}
                alt="Story"
                width="100"
            />
            {currentStoryIndex !== null && stories[currentStoryIndex] && (
    <div
        style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "black",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
        }}
    >
        <button
            onClick={() => setCurrentStoryIndex(null)}
            style={{ position: "absolute", top: 20, right: 20 }}
        >
            Close
        </button>

        <button onClick={previousStory}>
            Previous
        </button>

        <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/stories/${stories[currentStoryIndex].image}`}
            alt="Story"
            style={{
                maxHeight: "85vh",
                maxWidth: "70vw",
                objectFit: "contain",
            }}
        />

        <button onClick={nextStory}>
            Next
        </button>
    </div>
)}
            <p>{story.user?.name}</p>
        </button>
    ))
)}

            <p>{message}</p>
        </div>
    );
}
