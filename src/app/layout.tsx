import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import PWARegister from "@/components/layout/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Barber Elite | Barbearia Premium",
    template: "%s | Barber Elite",
  },
  description:
    "Agende seu horário na Barber Elite. Experiência premium em cuidados masculinos. Cortes, barba, hidratação e mais.",
  keywords: [
    "barbearia",
    "corte masculino",
    "barba",
    "agendamento",
    "barber shop",
    "premium",
  ],
  authors: [{ name: "Barber Elite" }],
  creator: "Barber Elite",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Barber Elite",
    title: "Barber Elite | Barbearia Premium",
    description:
      "Agende seu horário na Barber Elite. Experiência premium em cuidados masculinos.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Barber Elite" />
        <link rel="apple-touch-icon" href="/icons/icon-72.png" sizes="72x72" />
        <link rel="apple-touch-icon" href="/icons/icon-144.png" sizes="144x144" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" sizes="512x512" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          {children}
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}
