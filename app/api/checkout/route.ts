import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

type CheckoutRequest = {
  restaurantId?: string;
  tableNumber?: string;
  customerComment?: string;
  items?: { menuItemId: string; quantity: number }[];
};

export async function POST(request: Request) {
  let body: CheckoutRequest;

  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const restaurantId = body.restaurantId;
  const tableNumber = body.tableNumber;
  const items = body.items ?? [];

  if (!restaurantId || !tableNumber || items.length === 0) {
    return NextResponse.json({ error: "Missing restaurant, table, or cart items" }, { status: 400 });
  }

  const quantityByMenuItemId = new Map<string, number>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.menuItemId || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Cart contains an invalid item" }, { status: 400 });
    }
    quantityByMenuItemId.set(item.menuItemId, (quantityByMenuItemId.get(item.menuItemId) ?? 0) + quantity);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: { where: { tableNumber } },
      menuItems: {
        where: {
          id: { in: Array.from(quantityByMenuItemId.keys()) },
          isAvailable: true
        }
      }
    }
  });

  const table = restaurant?.tables[0];
  if (!restaurant || !table) {
    return NextResponse.json({ error: "Restaurant table was not found" }, { status: 404 });
  }

  const menuById = new Map(restaurant.menuItems.map((item) => [item.id, item]));
  const normalizedCart = [];

  for (const [menuItemId, quantity] of quantityByMenuItemId) {
    const menuItem = menuById.get(menuItemId);

    if (!menuItem) {
      return NextResponse.json({ error: "Cart contains an unavailable item" }, { status: 400 });
    }

    if (quantity > menuItem.quantityAvailable) {
      return NextResponse.json({ error: `${menuItem.name} does not have enough quantity available` }, { status: 400 });
    }

    normalizedCart.push({
      menuItemId: menuItem.id,
      quantity,
      unitPrice: menuItem.price,
      itemNameSnapshot: menuItem.name
    });
  }

  const totalAmount = normalizedCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 });
  }

  const customerComment =
    restaurant.allowCustomerComments && body.customerComment
      ? body.customerComment.trim().slice(0, 500)
      : null;

  const pendingCheckout = await prisma.pendingCheckout.create({
    data: {
      restaurantId: restaurant.id,
      tableId: table.id,
      customerComment,
      cartSnapshot: JSON.stringify(normalizedCart),
      totalAmount
    }
  });

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const applicationFeeAmount =
      restaurant.stripeAccountId && restaurant.platformFeePercent > 0
        ? Math.round(totalAmount * (restaurant.platformFeePercent / 100))
        : undefined;
    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined =
      restaurant.stripeAccountId
        ? {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: restaurant.stripeAccountId
            }
          }
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/order/pending/${pendingCheckout.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/r/${restaurant.id}/table/${table.tableNumber}`,
      line_items: normalizedCart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPrice,
          product_data: {
            name: item.itemNameSnapshot
          }
        }
      })),
      metadata: {
        pendingCheckoutId: pendingCheckout.id,
        restaurantId: restaurant.id,
        tableId: table.id,
        tableNumber: table.tableNumber,
        platformFeePercent: String(restaurant.platformFeePercent)
      },
      payment_intent_data: paymentIntentData
    });

    await prisma.pendingCheckout.update({
      where: { id: pendingCheckout.id },
      data: { stripeCheckoutSessionId: session.id }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    await prisma.pendingCheckout.delete({ where: { id: pendingCheckout.id } }).catch(() => null);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Stripe Checkout session" },
      { status: 500 }
    );
  }
}
