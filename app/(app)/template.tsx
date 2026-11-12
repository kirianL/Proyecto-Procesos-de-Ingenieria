import type { ReactNode } from "react";

/**
 * Se remonta en cada navegación dentro del grupo `(app)`, por lo que la
 * animación de entrada corre solo en el contenido y nunca en el sidebar.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}
