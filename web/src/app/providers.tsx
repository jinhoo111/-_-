"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <LanguageProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="rh_theme">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
