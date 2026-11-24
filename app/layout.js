
import "./globals.css";
import NavbarWrapper from "./NavbarWrapper";

export const metadata = {
    title: "My Instagram App",
    description: "Learning Next.js step by step",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <NavbarWrapper />
                {children}
            </body>
        </html>
    );
}
