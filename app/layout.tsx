import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalHeader from 'components/GlobalHeader';
import "./styles/globals.css";
import { ActiveAccountProvider } from './contexts/ActiveAccountContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ramp API Command Center",
  description: "Manage Ramp API integrations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ActiveAccountProvider>
          <GlobalHeader />
          <main className="min-h-screen">
            {children}
          </main>
        </ActiveAccountProvider>
      </body>
    </html>
  );
}