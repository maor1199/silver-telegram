import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "SellerMentor — Expert Product Analysis for Amazon Sellers"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,153,0,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,153,0,0.12)",
            border: "1px solid rgba(255,153,0,0.3)",
            borderRadius: "100px",
            padding: "8px 18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#FF9900",
              display: "flex",
            }}
          />
          <span style={{ color: "#FF9900", fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em" }}>
            SELLERMENTOR
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: "62px",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: "800px",
            marginBottom: "28px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          Know if your product will make money — before you order.
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.55)",
            maxWidth: "680px",
            lineHeight: 1.5,
            marginBottom: "48px",
            display: "flex",
          }}
        >
          GO / NO-GO verdict with real economics, competition signals & PPC analysis.
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["GO / NO-GO Verdict", "Profit Math", "PPC Pressure", "Review Moat", "Keepa Data"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 20px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "100px",
                color: "rgba(255,255,255,0.75)",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "80px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "18px",
            fontWeight: 500,
            display: "flex",
          }}
        >
          sellermentor.ai
        </div>
      </div>
    ),
    { ...size }
  )
}
