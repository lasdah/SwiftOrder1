import { Suspense } from "react";
import { PendingOrderClient } from "@/components/PendingOrderClient";

export default async function PendingOrderPage() {
  return (
    <Suspense fallback={null}>
      <PendingOrderClient />
    </Suspense>
  );
}
