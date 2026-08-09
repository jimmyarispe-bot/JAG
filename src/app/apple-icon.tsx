import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The JAG™ Apple touch icon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          color: "#F8FAFC",
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        J
      </div>
    ),
    { ...size }
  );
}
