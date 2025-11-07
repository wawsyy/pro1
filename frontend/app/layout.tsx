import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavigationBar } from "@/components/NavigationBar";

const metaTitle = "PollCipher Predictions";
const metaDescription =
  "Encrypted polling predictions powered by Zama FHEVM. Submit private votes, decrypt tallies on demand, and keep forecaster data confidential.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    siteName: "PollCipher",
    images: [{ url: "/pollcipher-mark.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50 text-slate-900 antialiased">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.15),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.12),transparent_40%)]" />
        <Providers>
          <main className="flex min-h-screen w-full justify-center px-4 pb-16 pt-10 md:px-0">
            <div className="flex w-full max-w-5xl flex-col gap-10">
              <NavigationBar />
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
