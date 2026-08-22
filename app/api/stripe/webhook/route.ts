import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

type CartSnapshotItem = {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  itemNameSnapshot: string;
};

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook signature configuration is missing" }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const pendingCheckoutId = session.metadata?.pendingCheckoutId;
  if (!pendingCheckoutId) {
    return NextResponse.json({ error: "Missing pending checkout metadata" }, { status: 400 });
  }

  const pendingCheckout = await prisma.pendingCheckout.findUnique({
    where: { id: pendingCheckoutId }
  });

  if (!pendingCheckout) {
    return NextResponse.json({ received: true });
  }

  const existingOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id }
  });

  if (existingOrder) {
    return NextResponse.json({ received: true, orderId: existingOrder.id });
  }

  const cart = JSON.parse(pendingCheckout.cartSnapshot) as CartSnapshotItem[];
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const order = await prisma.$transaction(async (tx) => {
    const latestOrder = await tx.order.findFirst({
      where: { restaurantId: pendingCheckout.restaurantId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true }
    });
    const orderNumber = (latestOrder?.orderNumber ?? 1000) + 1;

    const createdOrder = await tx.order.create({
      data: {
        restaurantId: pendingCheckout.restaurantId,
        tableId: pendingCheckout.tableId,
        orderNumber,
        status: "RECEIVED",
        customerComment: pendingCheckout.customerComment,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        totalAmount: pendingCheckout.totalAmount,
        items: {
          create: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemNameSnapshot: item.itemNameSnapshot
          }))
        }
      }
    });

    for (const item of cart) {
      await tx.menuItem.updateMany({
        where: { id: item.menuItemId, quantityAvailable: { gte: item.quantity } },
        data: { quantityAvailable: { decrement: item.quantity } }
      });
    }

    await tx.pendingCheckout.update({
      where: { id: pendingCheckout.id },
      data: { completedOrderId: createdOrder.id }
    });

    return createdOrder;
  });

  return NextResponse.json({ received: true, orderId: order.id });
}
