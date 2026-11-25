import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { MotionProvider } from "@elena/ui";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--nf-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--nf-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const title = "Elena Fit · Entrenadora personal, presencial y online";
const description =
  "Entrenamiento y nutrición a tu medida, en el gym o desde casa, con una app que registra tu progreso. Reserva con Elena.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Elena Fit",
  openGraph: { title: `${title} · Demo 1`, description, type: "website", locale: "es_ES", siteName: "Elena Fit" },
  twitter: { card: "summary_large_image", title: `${title} · Demo 1`, description },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:font-semibold focus:text-black"
        >
          Saltar al contenido
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
