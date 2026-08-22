import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const pendingCheckout = await prisma.pendingCheckout.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    select: { completedOrderId: true }
  });

  if (!pendingCheckout?.completedOrderId) {
    return NextResponse.json({ orderId: null }, { status: 202 });
  }

  return NextResponse.json({ orderId: pendingCheckout.completedOrderId });
}
