import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ComputeBestSpecs — Find the Right PC for Your Workload";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0F17",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: "900",
                fontSize: "24px",
                boxShadow: "0 8px 16px rgba(59, 130, 246, 0.4)",
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
                ComputeBestSpecs
              </span>
              <span style={{ fontSize: "14px", color: "#94A3B8", fontWeight: "500" }}>
                Deterministic Hardware & Workload Engine
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "9999px",
              color: "#60A5FA",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            Zero Hallucinations • Pure Math
          </div>
        </div>

        {/* Center Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: "900",
              color: "#F8FAFC",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              maxWidth: "1000px",
            }}
          >
            Find the Right PC for Your Real-World Workload.
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#94A3B8",
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            Simulate multi-app concurrency, detect memory bottlenecks, size local LLM VRAM requirements, and compare specifications side-by-side.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1E293B", paddingTop: "32px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", color: "#64748B", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px" }}>
                Workloads
              </span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#F1F5F9" }}>
                Dev • 3D • Video • Local AI
              </span>
            </div>
            <div style={{ width: "1px", height: "40px", backgroundColor: "#334155" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", color: "#64748B", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px" }}>
                Privacy
              </span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#10B981" }}>
                100% In-Browser Web Worker OCR
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "16px",
              color: "#E2E8F0",
              fontWeight: "600",
            }}
          >
            computebestspecs.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
