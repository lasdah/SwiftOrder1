import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;
  const orders = await prisma.order.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 75,
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

  return NextResponse.json(orders.map(serializeOrder));
}
