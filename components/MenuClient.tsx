"use client";

import { useMemo, useState } from "react";
import { CreditCard, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/money";

type MenuItem = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  quantityAvailable: number;
  price: number;
  description: string;
  isAvailable: boolean;
};

type Restaurant = {
  id: string;
  name: string;
  allowCustomerComments: boolean;
};

type CartLine = {
  menuItemId: string;
  quantity: number;
};

export function MenuClient({
  restaurant,
  tableNumber,
  items
}: {
  restaurant: Restaurant;
  tableNumber: string;
  items: MenuItem[];
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const total = cartItems.reduce((sum, line) => {
    const item = itemById.get(line.menuItemId);
    return sum + (item?.price ?? 0) * line.quantity;
  }, 0);
  const itemCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);

  function setQuantity(item: MenuItem, quantity: number) {
    setError("");
    const nextQuantity = Math.max(0, Math.min(quantity, item.quantityAvailable));
    setCart((current) => {
      const next = { ...current };
      if (nextQuantity === 0) {
        delete next[item.id];
      } else {
        next[item.id] = { menuItemId: item.id, quantity: nextQuantity };
      }
      return next;
    });
  }

  async function checkout() {
    setError("");
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber,
          items: cartItems,
          customerComment: comment
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Table {tableNumber}</p>
            <h1 className="text-2xl font-bold text-ink">{restaurant.name}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-mint/10 px-3 py-2 text-sm font-semibold text-mint">
            <ShoppingCart size={18} />
            {itemCount}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const cartLine = cart[item.id];
              const selectedQuantity = cartLine?.quantity ?? 0;
              const canAdd =
                item.isAvailable && item.quantityAvailable > 0 && selectedQuantity < item.quantityAvailable;

              return (
                <article key={item.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : null}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-ink">{item.name}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-ink">{formatMoney(item.price)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {item.isAvailable && item.quantityAvailable > 0
                          ? `${item.quantityAvailable} available`
                          : "Unavailable"}
                      </p>
                      {selectedQuantity > 0 ? (
                        <div className="flex h-10 items-center rounded-md border border-slate-300">
                          <button
                            className="focus-ring flex h-10 w-10 items-center justify-center text-slate-700"
                            onClick={() => setQuantity(item, selectedQuantity - 1)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{selectedQuantity}</span>
                          <button
                            className="focus-ring flex h-10 w-10 items-center justify-center text-slate-700 disabled:text-slate-300"
                            onClick={() => setQuantity(item, selectedQuantity + 1)}
                            disabled={!canAdd}
                            aria-label={`Add one ${item.name}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white disabled:bg-slate-300"
                          onClick={() => setQuantity(item, 1)}
                          disabled={!canAdd}
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Cart</h2>
            <p className="text-sm font-semibold text-slate-500">{itemCount} items</p>
          </div>

          <div className="mt-4 space-y-3">
            {cartItems.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Your cart is empty.</p>
            ) : (
              cartItems.map((line) => {
                const item = itemById.get(line.menuItemId);
                if (!item) {
                  return null;
                }

                return (
                  <div key={line.menuItemId} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {line.quantity} x {formatMoney(item.price)}
                      </p>
                    </div>
                    <button
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600"
                      onClick={() => setQuantity(item, 0)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {restaurant.allowCustomerComments ? (
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-ink">Comment</span>
              <textarea
                className="focus-ring mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={500}
                placeholder="Allergies, timing, or simple notes"
              />
            </label>
          ) : null}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-lg font-bold text-ink">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            {error ? <p className="mt-3 rounded-md bg-tomato/10 p-3 text-sm text-tomato">{error}</p> : null}
            <button
              className="focus-ring mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-mint px-4 text-sm font-bold text-white disabled:bg-slate-300"
              onClick={checkout}
              disabled={cartItems.length === 0 || isCheckingOut}
            >
              <CreditCard size={18} />
              {isCheckingOut ? "Opening Stripe..." : "Checkout"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
