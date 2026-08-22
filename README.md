# SwiftOrder

MVP web app for in-store QR-code ordering. Customers scan a table URL, order from a menu, pay with Stripe Checkout, and staff move paid orders from Received to Preparing to Complete.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite for local development
- Stripe Checkout and Stripe webhooks

## Setup

This workspace did not have `node`/`npm` available when the app was generated. Install Node.js 20+ first, then run:

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open:

- Customer demo table: `http://localhost:3000/r/demo-restaurant/table/1`
- Staff dashboard: `http://localhost:3000/staff/demo-restaurant`

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

The demo seed creates one restaurant, four tables, QR URLs, and menu items.

## Stripe Local Testing

1. Add your Stripe test secret key to `.env`.
2. Start the app:

```bash
npm run dev
```

3. In another terminal, forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the `whsec_...` value printed by the Stripe CLI into `STRIPE_WEBHOOK_SECRET`.
5. Restart `npm run dev` after changing `.env`.
6. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP.

Orders are created only after Stripe sends `checkout.session.completed` with `payment_status=paid`.

## Full Flow

1. Visit `http://localhost:3000/r/demo-restaurant/table/1`.
2. Add menu items to the cart.
3. Click Checkout and pay in Stripe test mode.
4. After payment, the pending page waits for the webhook and redirects to `/order/[orderId]`.
5. Open `http://localhost:3000/staff/demo-restaurant`.
6. Confirm the order appears under Received.
7. Click Start to move it to Preparing.
8. Click Complete to mark it served.
9. The customer order status page polls every few seconds and shows the complete alert.

## Stripe Connect Platform Fee

`Restaurant.platformFeePercent` is modeled and used when `Restaurant.stripeAccountId` is present. In `app/api/checkout/route.ts`, Checkout sessions include:

- `payment_intent_data.application_fee_amount`
- `payment_intent_data.transfer_data.destination`

The seed leaves `stripeAccountId` empty because restaurant onboarding is intentionally out of scope for this MVP. Add Connect onboarding later by collecting and storing each restaurant's connected account ID.

## Notes

- Customers do not have accounts.
- Staff auth and complex permissions are intentionally skipped for the MVP.
- Menu deletion is implemented as disabling items, which preserves historical order references.
- QR codes are rendered by `/api/qr?data=...`.
