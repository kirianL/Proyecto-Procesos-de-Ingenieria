import type { ReactNode } from "react";
import MobileHeader from "@/components/MobileHeader";
import { SesionSync } from "@/components/mantenimiento/SesionSync";
import Sidebar from "@/components/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-canvas flex min-h-screen w-full text-grayscale-12">
      <SesionSync>
        <Sidebar />
        <MobileHeader />

        <main className="flex min-h-screen w-full flex-1 flex-col pt-[4.5rem] md:pt-0 xl:pl-64 2xl:pl-72">
          <div className="mx-auto flex w-full max-w-[84rem] flex-1 flex-col px-4 pb-8 pt-4 md:px-8 md:pb-10 md:pt-8 xl:px-10 xl:py-10 2xl:px-12 2xl:py-12">
            {children}
          </div>
        </main>
      </SesionSync>
    </div>
  );
}
