import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Negara Emas — Zaman Batu",
  description: "Satu kampung zaman batu bersama, prasejarah Nusantara. Gacha warga, tonton mereka mengumpulkan batu, kayu, emas, besi, dan pangan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={pixel.variable}>
      <body>{children}</body>
    </html>
  );
}
