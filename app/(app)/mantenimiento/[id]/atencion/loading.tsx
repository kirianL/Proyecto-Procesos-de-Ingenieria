import {
  Cargando,
  Skeleton,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Cargando label="Cargando atención técnica">
      <div className="space-y-6">
        <SkeletonPageHeader />
        <Skeleton className="h-20 w-full" />
        <div className="card space-y-4 p-5">
          <Skeleton className="h-3 w-40" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </Cargando>
  );
}
