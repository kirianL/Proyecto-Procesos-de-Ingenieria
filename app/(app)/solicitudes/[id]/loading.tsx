import {
  Cargando,
  Skeleton,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Cargando label="Cargando ficha de la solicitud">
      <div className="space-y-6">
        <SkeletonPageHeader />
        <div className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="card space-y-3 p-5">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </Cargando>
  );
}
