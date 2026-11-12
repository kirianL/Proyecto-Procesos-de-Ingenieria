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
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-14 xl:hidden">
        <div className="app-canvas pointer-events-auto relative mx-auto flex h-full w-full items-center justify-between border-b border-grayscale-3/70 p-2 px-4">
          <Dialog.Trigger
            aria-label="Abrir navegación"
            title="Abrir navegación"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/80 bg-grayscale-1 text-grayscale-11 transition-colors hover:bg-grayscale-2 dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
          >
            <ListIcon size={17} weight="bold" />
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
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-grayscale-1/70 backdrop-blur-xs xl:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[calc(100vw-2rem)] flex-col border-r border-grayscale-3 bg-grayscale-1 p-4 shadow-xl outline-none xl:hidden dark:border-grayscale-2 dark:bg-grayscale-2">
          <div className="mb-4 flex items-center justify-between border-b border-grayscale-3/80 pb-3 dark:border-grayscale-3/50">
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
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3 bg-grayscale-1 text-grayscale-11 transition-colors hover:bg-grayscale-2 dark:bg-grayscale-3"
            >
              <XIcon size={14} weight="bold" />
            </Dialog.Close>
          </div>
          <SidebarNavContent onNavigate={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
