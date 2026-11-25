import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Elena Fit · Tu fuerza empieza aquí (Web, Demo 1)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** DEMO 1 · WEB: fondo ámbar, texto negro. */
export default function OpengraphImage() {
  const badge = readFileSync(join(process.cwd(), "public", "brand", "logo-badge-ink.png"));
  const src = `data:image/png;base64,${badge.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#faa307",
          color: "#000",
          padding: "64px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#000",
                color: "#faa307",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 5,
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              WEB · DEMO 1
            </div>
          </div>
          <div style={{ fontSize: 118, fontWeight: 900, lineHeight: 0.95, display: "flex", flexDirection: "column" }}>
            <span>TU FUERZA</span>
            <span>EMPIEZA AQUÍ</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, display: "flex" }}>Elena Fit · Entrenadora personal</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={300} height={300} alt="" />
      </div>
    ),
    size,
  );
}
