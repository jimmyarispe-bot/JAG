"use client";

/**
 * Sprint 210 — root layout failure boundary.
 * Must define its own html/body because the root layout may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#fafafa",
          color: "#171717",
        }}
      >
        <main
          style={{
            maxWidth: 512,
            margin: "0 auto",
            padding: "4rem 1.5rem",
          }}
        >
          <p style={{ fontSize: 14, color: "#737373", margin: 0 }}>
            Critical error
          </p>
          <h1 style={{ fontSize: 24, margin: "0.5rem 0 0" }}>
            Application unavailable
          </h1>
          <p style={{ fontSize: 14, color: "#525252", lineHeight: 1.5 }}>
            The application failed to load. Refresh the page or contact your
            administrator. Reference:{" "}
            {error.digest ?? "unavailable"}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "8px 12px",
              border: "1px solid #171717",
              borderRadius: 4,
              background: "#171717",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
