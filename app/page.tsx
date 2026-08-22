import Link from "next/link";
import { ArrowRight, ClipboardList, QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: "demo-restaurant" },
    include: { tables: { orderBy: { tableNumber: "asc" }, take: 1 } }
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-10">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-mint">
          Restaurant QR ordering MVP
        </p>
        <h1 className="text-4xl font-bold text-ink sm:text-5xl">SwiftOrder</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          Demo flow for table ordering, Stripe Checkout, staff preparation, and customer order status polling.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {restaurant?.tables[0] ? (
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white"
            href={`/r/${restaurant.id}/table/${restaurant.tables[0].tableNumber}`}
          >
            <QrCode size={18} />
            Open demo table
            <ArrowRight size={18} />
          </Link>
        ) : null}
        {restaurant ? (
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink"
            href={`/staff/${restaurant.id}`}
          >
            <ClipboardList size={18} />
            Open staff dashboard
          </Link>
        ) : (
          <p className="rounded-md border border-tomato/25 bg-tomato/10 px-4 py-3 text-sm text-tomato">
            Run the seed command to create the demo restaurant.
          </p>
        )}
      </div>
    </main>
  );
}
