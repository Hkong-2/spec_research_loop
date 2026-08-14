import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SpecResearch Loop",
  description: "Turn a vague research idea into a verified research specification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.45,
          background: "#fafafa",
          color: "#111",
        }}
      >
        <header
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #ddd",
            background: "#fff",
          }}
        >
          <a href="/">Home</a>
          <a href="/login">Login</a>
          <a href="/register">Register</a>
          <a href="/demo">SSE demo</a>
        </header>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </body>
    </html>
  );
}
