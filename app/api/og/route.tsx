import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Will Grannis";
  const subtitle = searchParams.get("subtitle") || "grannis.xyz";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#080b10",
          position: "relative",
        }}
      >
        {/* Ambient blobs */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "5%",
            width: "500px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(73, 166, 181, 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "400px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(212, 197, 169, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Glass card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 80px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 4px 40px -4px rgba(0,0,0,0.5)",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? 40 : 52,
              fontWeight: 500,
              color: "#d4c5a9",
              textAlign: "center",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontFamily: "Georgia, serif",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#8a99ab",
              letterSpacing: "0.05em",
              fontFamily: "monospace",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* WG mark bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "40px",
            display: "flex",
            gap: "4px",
            fontSize: 20,
            fontFamily: "Georgia, serif",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#d4c5a9" }}>W</span>
          <span style={{ color: "#49a6b5" }}>G</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
