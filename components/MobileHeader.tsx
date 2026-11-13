"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ListIcon, WrenchIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { SidebarNavContent } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 border-b border-grayscale-3/70 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md xl:hidden dark:border-white/[0.09] dark:bg-[#131312]/95">
        <div className="pointer-events-auto relative mx-auto flex h-14 w-full items-center justify-between px-4">
          <Dialog.Trigger
            aria-label="Abrir navegación"
            title="Abrir navegación"
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-grayscale-3/80 bg-grayscale-1 text-grayscale-11 transition-[background-color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-grayscale-2 active:scale-[0.95] dark:border-white/[0.12] dark:bg-[#191917] dark:hover:bg-[#222220]"
          >
            <ListIcon size={18} weight="bold" />
          </Dialog.Trigger>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1">
              <WrenchIcon size={14} weight="fill" />
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
              Mantenimiento
            </span>
          </Link>
          <div className="flex items-center gap-2 text-grayscale-10">
            <ThemeToggle size={16} />
          </div>
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="drawer-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-xs xl:hidden" />
        <Dialog.Popup className="drawer-panel fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto overscroll-contain border-r border-grayscale-3 bg-grayscale-1 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl outline-none xl:hidden dark:border-white/[0.1] dark:bg-[#0e0e0d]">
          <div className="mb-4 flex items-center justify-between border-b border-grayscale-3/80 pb-3 dark:border-white/[0.08]">
            <Dialog.Title className="sr-only">Navegación</Dialog.Title>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1">
                <WrenchIcon size={14} weight="fill" />
              </span>
              <span className="text-[13px] font-semibold text-grayscale-12">
                Mantenimiento
              </span>
            </div>
            <Dialog.Close
              aria-label="Cerrar navegación"
              title="Cerrar navegación"
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-grayscale-3 bg-grayscale-1 text-grayscale-11 transition-[background-color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-grayscale-2 active:scale-[0.95] dark:bg-grayscale-3"
            >
              <XIcon size={15} weight="bold" />
            </Dialog.Close>
          </div>
          <SidebarNavContent onNavigate={() => setOpen(false)} ocultarMarca />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
