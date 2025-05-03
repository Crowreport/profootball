import "./globals.css";

export const metadata = {
  title: "Profoot Ball News Report",
  description: "The one page location for all NFL related news",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
