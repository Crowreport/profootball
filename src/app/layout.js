// src/app/layout.js
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Pro Football Report",
  description: "The one page location for all NFL related news",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
