// app/layout.tsx
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { UserProvider } from "./context/userContext";
import { BotProvider } from "./context/botContext";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UserProvider>
          <BotProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster position="top-center" richColors />
            </ThemeProvider>
          </BotProvider>
        </UserProvider>
      </body>
    </html>
  );
}
