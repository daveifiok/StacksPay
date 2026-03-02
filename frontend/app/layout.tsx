import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider"; // Restored
import { Toaster } from "@/components/ui/toaster";
import ChatBotClient from '@/components/shared/ChatBotClient'; // Updated to use client component
import ClientOnly from "@/components/providers/client-only";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "StacksPay Payment Gateway",
  description: "Secure sBTC payment processing for modern businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
              <ConditionalNavbar />
              {children}
              <ChatBotClient />
              <Toaster />
            </ClientOnly>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
