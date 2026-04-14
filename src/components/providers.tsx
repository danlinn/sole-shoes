"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { DisabledAccountHandler } from "@/components/disabled-account-handler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <DisabledAccountHandler />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
