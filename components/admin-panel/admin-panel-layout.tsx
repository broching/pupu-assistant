"use client";

import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { useUser } from "@/app/context/userContext";

export default function AdminPanelLayout({
  children,
  header,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  const { user } = useUser();
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;

  return (
    <>
      {user && (
        <>
          {/* Full width header at the very top */}
          <div className="w-full fixed top-0 left-0 z-50">{header}</div>

          <Sidebar />

          <main
            className={cn(
              "min-h-[calc(100vh_-_56px)] pt-16 transition-[margin-left] ease-in-out duration-300", // pt-16 to offset header height
              !settings.disabled &&
              (getOpenState()
                ? "ml-72 sm:ml-72" // sidebar expanded width
                : "ml-[70px] sm:ml-[90px]") // collapsed
            )}
          >
            {children}
          </main>

          <footer
            className={cn(
              "transition-[margin-left] ease-in-out duration-300",
              !settings.disabled &&
              (getOpenState()
                ? "ml-72 sm:ml-72"
                : "ml-[70px] sm:ml-[90px]")
            )}
          >

          </footer>
        </>
      )}

      {!user && (
        <>
          {/* For public/non-protected pages */}
          {header}
          {children}
        </>
      )}
    </>
  );
}
