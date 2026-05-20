import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { CartProvider } from "@/context/CartContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MesAchats241 | Le meilleur des magasins de Libreville à votre porte",
  description: "MesAchats241 est une plateforme e-commerce centralisant les magasins alimentaires et de nettoyage de Libreville, Gabon.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col pb-16 lg:pb-0`}>
        <ErrorBoundary>
          <CartProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <BottomTabBar />
          </CartProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
