import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Card><CardHeader><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-60" /></CardHeader></Card>
      <Card><CardContent><Skeleton className="h-[360px] rounded-xl" /></CardContent></Card>
    </div>
  );
}
