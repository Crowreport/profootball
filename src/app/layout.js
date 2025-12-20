// src/app/layout.js
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Pro Football Report",
  description: "The one page location for all NFL related news",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
