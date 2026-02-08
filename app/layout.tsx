import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { StoreProvider } from "@/components/store-provider";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Onboarding } from "@/components/onboarding";
import { UndoToast } from "@/components/undo-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjectFlow - Project Management",
  description: "A comprehensive project management application with tasks, calendar, and kanban boards",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <StoreProvider>
            <Sidebar />
            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background p-4 md:p-6">
              {children}
            </main>
            <CommandPalette />
            <KeyboardShortcuts />
            <Onboarding />
            <UndoToast />
          </StoreProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
