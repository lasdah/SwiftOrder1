"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, CookingPot } from "lucide-react";
import type { OrderPayload } from "@/lib/orders";
import { formatMoney } from "@/lib/money";

const statusCopy = {
  RECEIVED: {
    title: "Order received",
    detail: "The kitchen has your paid order.",
    icon: Clock
  },
  PREPARING: {
    title: "Preparing",
    detail: "Staff have started preparing your order.",
    icon: CookingPot
  },
  COMPLETE: {
    title: "Complete",
    detail: "Your order is ready or has been served.",
    icon: CheckCircle2
  }
};

export function OrderStatusClient({ initialOrder }: { initialOrder: OrderPayload }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${initialOrder.id}`, { cache: "no-store" });
      if (response.ok) {
        const nextOrder = (await response.json()) as OrderPayload;
        setOrder(nextOrder);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [initialOrder.id]);

  const copy = statusCopy[order.status];
  const Icon = copy.icon;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-mint">Order #{order.orderNumber}</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">Table {order.table.tableNumber}</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-mint/10 text-mint">
            <Icon size={26} />
          </div>
        </div>

        <div
          className={`mt-5 rounded-md p-4 ${
            order.status === "COMPLETE" ? "bg-mint/10 text-mint" : "bg-slate-50 text-slate-700"
          }`}
          role={order.status === "COMPLETE" ? "alert" : "status"}
        >
          <p className="font-bold">{copy.title}</p>
          <p className="mt-1 text-sm">{copy.detail}</p>
        </div>

        <div className="mt-6 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="font-medium text-ink">{item.itemNameSnapshot}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} x {formatMoney(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-ink">{formatMoney(item.quantity * item.unitPrice)}</p>
            </div>
          ))}
        </div>

        {order.customerComment ? (
          <div className="mt-5 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Comment</p>
            <p className="mt-1 text-sm text-slate-700">{order.customerComment}</p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatMoney(order.totalAmount)}</span>
        </div>
      </div>
    </main>
  );
}
