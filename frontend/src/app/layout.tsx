import React from 'react';
import type { Viewport, Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/provider/ThemeProvider";
import HydrationGuard from "@/provider/HydrationGuard";
import { Toaster } from 'react-hot-toast';

// To be implemented later:
import StoreProvider from "@/provider/StoreProvider";
import GoogleAuthProvider from "@/provider/GoogleAuthProvider";
import I18nProvider from "@/provider/I18nProvider";
import { buildMetadata } from "@/utils/seoConfig";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <GoogleAuthProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'font-sans font-medium text-sm tracking-tight shadow-2xl rounded-xl border border-border',
                  duration: 5000,
                  style: {
                    padding: '16px 24px',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#059669', // Emerald Green
                      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#059669',
                    },
                  },
                  error: {
                    style: {
                      background: '#dc2626', // Coral Red
                      boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#dc2626',
                    },
                  },
                  loading: {
                    style: {
                      background: '#d97706', // Amber 600
                      boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.4)',
                    },
                  },
                }}
              />

              <I18nProvider>
                <HydrationGuard>
                  {children}
                </HydrationGuard>
              </I18nProvider>
            </GoogleAuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
