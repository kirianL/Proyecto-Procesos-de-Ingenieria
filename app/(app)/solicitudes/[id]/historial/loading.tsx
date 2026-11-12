import {
  Cargando,
  Skeleton,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Cargando label="Cargando historial">
      <div className="space-y-6">
        <SkeletonPageHeader />
        <div className="card space-y-4 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-3 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Cargando>
  );
}
