import { notFound } from "next/navigation";
import { OrderStatusClient } from "@/components/OrderStatusClient";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";

export default async function OrderPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { select: { id: true, tableNumber: true } },
      items: {
        select: {
          id: true,
          menuItemId: true,
          quantity: true,
          unitPrice: true,
          itemNameSnapshot: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return <OrderStatusClient initialOrder={serializeOrder(order)} />;
}
