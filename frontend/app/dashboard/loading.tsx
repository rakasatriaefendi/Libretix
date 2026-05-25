import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((__, cardIndex) => <Skeleton key={cardIndex} className="h-[74px] rounded-xl" />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
