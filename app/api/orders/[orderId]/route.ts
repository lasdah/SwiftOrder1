import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
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
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(serializeOrder(order));
}
