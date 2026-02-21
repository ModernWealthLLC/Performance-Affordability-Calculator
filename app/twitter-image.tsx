import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "The APEX Report™ — Are You Hitting the Financial Apex?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a3560 0%, #0f487f 40%, #1a5a9a 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            opacity: 0.06,
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 80,
            height: 2,
            background: "#cfcfcf",
            display: "flex",
          }}
        />

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 300,
              color: "#ffffff",
              letterSpacing: "4px",
            }}
          >
            The APEX
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 300,
              color: "#cfcfcf",
              letterSpacing: "4px",
            }}
          >
            Report™
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 100,
            height: 1,
            background: "#cfcfcf",
            marginTop: 32,
            marginBottom: 32,
            display: "flex",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#cfcfcf",
            fontStyle: "italic",
            letterSpacing: "1px",
            display: "flex",
          }}
        >
          Are You Hitting the Financial Apex?
        </div>

        {/* Pillars */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 40,
            marginTop: 40,
            fontSize: 16,
            letterSpacing: "3px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span style={{ display: "flex" }}>AFFORDABILITY</span>
          <span style={{ display: "flex", color: "rgba(207,207,207,0.4)" }}>|</span>
          <span style={{ display: "flex" }}>POSITIONING</span>
          <span style={{ display: "flex", color: "rgba(207,207,207,0.4)" }}>|</span>
          <span style={{ display: "flex" }}>EFFICIENCY</span>
          <span style={{ display: "flex", color: "rgba(207,207,207,0.4)" }}>|</span>
          <span style={{ display: "flex" }}>EXECUTION</span>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 60,
              height: 1,
              background: "rgba(207,207,207,0.3)",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "2px",
            }}
          >
            MODERN WEALTH
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
