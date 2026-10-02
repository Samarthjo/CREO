import { ImageResponse } from "next/og";

/** The social preview card: what a shared link looks like in a chat or a feed. Text only, set in the page's own words. */
export function ogCard() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "linear-gradient(135deg, #fbfbf7 0%, #f0f5df 100%)", color: "#11140c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill="#b5cf4f" />
            <path d="M43 22.5A15 15 0 1 0 43 41.5" fill="none" stroke="#11140c" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 44, letterSpacing: -1 }}>CREO</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 92, lineHeight: 1.02, letterSpacing: -3 }}>
            <span style={{ marginRight: 22 }}>The Intelligence Layer for</span>
            <span style={{ color: "#4b6a0e" }}>Creators.</span>
          </div>
          <div style={{ marginTop: 28, maxWidth: 940, fontSize: 31, lineHeight: 1.35, color: "#4d5540" }}>
            Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#3f5a0c" }}>
          <div style={{ display: "flex", padding: "8px 20px", borderRadius: 999, background: "#e3ecc5" }}>Founding cohort</div>
          <div style={{ display: "flex" }}>₹499 for 30 days. 10 to 15 creators.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
