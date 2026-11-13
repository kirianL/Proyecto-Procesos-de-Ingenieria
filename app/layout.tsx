import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";
import "slot-text/style.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SkulletSetup } from "@/components/SkulletSetup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Mantenimiento · Gestión de solicitudes internas",
    template: "%s · Mantenimiento",
  },
  description:
    "Sistema web de gestión y resolución de solicitudes de mantenimiento interno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="app-canvas min-h-full text-grayscale-12">
        <ThemeProvider>
          <SkulletSetup>
            <div className="root min-h-[240px]">{children}</div>
          </SkulletSetup>
        </ThemeProvider>
      </body>
    </html>
  );
}
