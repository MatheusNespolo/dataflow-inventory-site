import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Data Flow Inventory — Centro de distribuição automatizado",
  description:
    "Do clique no navegador à esteira em movimento: protótipo IoT de um centro de distribuição automatizado com Arduino, ESP32, MQTT e dashboard em tempo real. SENAI São Caetano do Sul.",
  openGraph: {
    title: "Data Flow Inventory",
    description:
      "Do clique no navegador à esteira em movimento. Protótipo IoT de intralogística — Arduino, ESP32, MQTT e dashboard em tempo real.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#050307",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}>
      <body className="grain">{children}</body>
    </html>
  );
}
