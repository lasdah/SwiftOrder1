"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function PendingOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    if (!sessionId) {
      setMessage("Missing Stripe session ID.");
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      const response = await fetch(`/api/orders/by-session/${sessionId}`, { cache: "no-store" });

      if (response.ok) {
        const data = (await response.json()) as { orderId?: string };
        if (data.orderId) {
          router.replace(`/order/${data.orderId}`);
          window.clearInterval(interval);
          return;
        }
      }

      if (attempts > 10) {
        setMessage("Payment succeeded. Waiting for the Stripe webhook to create your order.");
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [router, sessionId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <LoaderCircle className="animate-spin text-mint" size={38} />
      <h1 className="mt-4 text-2xl font-bold text-ink">{message}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This page will move to your order status as soon as the payment confirmation is received.
      </p>
    </main>
  );
}
