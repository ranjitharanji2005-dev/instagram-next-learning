
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavbarWrapper() {
    const pathname = usePathname();

    if (pathname === "/login"|| pathname === "/") {
        return null;
    }

    return (
        <nav>
            <Link href="/home">Home</Link>
            {" | "}
            <Link href="/profile">Profile</Link>
            {" | "}
            <Link href="/search">Search</Link>
            {" | "}
            <Link href="/chats">Chats</Link>
        </nav>
    );
}
