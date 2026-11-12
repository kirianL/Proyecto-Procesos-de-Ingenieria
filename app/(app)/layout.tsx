import type { ReactNode } from "react";
import { AppLayout } from "@/components/mantenimiento/AppLayout";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
