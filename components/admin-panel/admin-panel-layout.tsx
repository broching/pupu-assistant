"use client";

import { Footer } from "@/components/admin-panel/footer";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { useUser } from "@/app/context/userContext";

export default function AdminPanelLayout({
  children, header
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

          <Sidebar />
          <main
            className={cn(
              "min-h-[calc(100vh_-_56px)] transition-[margin-left] ease-in-out duration-300",
              !settings.disabled && (
                getOpenState()
                  ? "ml-72 sm:ml-72"          // sidebar expanded width
                  : "ml-[70px] sm:ml-[90px]"  // collapsed: mobile 70px, desktop 90px
              )
            )}
          >
            {header}
            {children}
          </main>

          <footer
            className={cn(
              "transition-[margin-left] ease-in-out duration-300",
              !settings.disabled && (
                getOpenState()
                  ? "ml-72 sm:ml-72"
                  : "ml-[70px] sm:ml-[90px]"
              )
            )}
          >
            <Footer />
          </footer>



        </>
      )}
      {!user && (
        <>
          {header}
          {children}
        </>

      )}
    </>
  );
}
