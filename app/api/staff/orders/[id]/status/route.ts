import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder, type OrderStatus } from "@/lib/orders";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { status?: OrderStatus };

  if (body.status !== "PREPARING" && body.status !== "COMPLETE") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed =
    (currentOrder.status === "RECEIVED" && body.status === "PREPARING") ||
    (currentOrder.status === "PREPARING" && body.status === "COMPLETE") ||
    currentOrder.status === body.status;

  if (!allowed) {
    return NextResponse.json({ error: "Status transition is not allowed" }, { status: 409 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: body.status },
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

  return NextResponse.json(serializeOrder(order));
}
