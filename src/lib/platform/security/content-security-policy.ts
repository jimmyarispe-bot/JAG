/**
 * Application Content-Security-Policy (applied via next.config headers).
 *
 * Learning Center / Overview Welcome videos play from short-lived Supabase
 * Storage signed URLs. Without an explicit media-src, browsers fall back to
 * default-src 'self' and block https://*.supabase.co media loads.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // <video>/<audio> use media-src (not connect-src).
  "media-src 'self' https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** Production Supabase project hosting private jag-learn-media signed URLs. */
export const JAG_SUPABASE_MEDIA_ORIGIN =
  "https://ybcpaffklggaloxhnqkl.supabase.co";

/**
 * True when CSP media-src permits the given absolute media URL origin
 * (e.g. a Supabase Storage signed playback URL).
 */
export function cspAllowsMediaUrl(mediaUrl: string): boolean {
  let origin: string;
  try {
    origin = new URL(mediaUrl).origin;
  } catch {
    return false;
  }

  const mediaSrc = CONTENT_SECURITY_POLICY.split("; ")
    .find((d) => d.startsWith("media-src "))
    ?.slice("media-src ".length);
  if (!mediaSrc) return false;

  const tokens = mediaSrc.split(/\s+/);
  if (tokens.includes(origin)) return true;
  if (tokens.includes("'self'") && origin === "null") return false;

  try {
    const host = new URL(origin).hostname;
    return tokens.some((token) => {
      if (!token.startsWith("https://*.") && !token.startsWith("http://*.")) {
        return false;
      }
      const suffix = token.replace(/^https?:\/\/\*\./, "");
      return host === suffix || host.endsWith(`.${suffix}`);
    });
  } catch {
    return false;
  }
}
