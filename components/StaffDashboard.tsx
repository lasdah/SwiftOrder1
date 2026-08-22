"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  CookingPot,
  Pencil,
  Plus,
  QrCode,
  Save,
  Trash2,
  X
} from "lucide-react";
import type { OrderPayload } from "@/lib/orders";
import { dollarsToCents, formatMoney } from "@/lib/money";

type Restaurant = {
  id: string;
  name: string;
  platformFeePercent: number;
  allowCustomerComments: boolean;
};

type TablePayload = {
  id: string;
  tableNumber: string;
  qrCodeUrl: string;
};

type MenuItemPayload = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  quantityAvailable: number;
  price: number;
  description: string;
  isAvailable: boolean;
};

type MenuForm = {
  name: string;
  thumbnailUrl: string;
  quantityAvailable: string;
  price: string;
  description: string;
  isAvailable: boolean;
};

const emptyMenuForm: MenuForm = {
  name: "",
  thumbnailUrl: "",
  quantityAvailable: "10",
  price: "9.99",
  description: "",
  isAvailable: true
};

const statuses = [
  { id: "RECEIVED", title: "Received" },
  { id: "PREPARING", title: "Preparing" },
  { id: "COMPLETE", title: "Complete" }
] as const;

export function StaffDashboard({
  restaurant,
  tables,
  initialMenuItems,
  initialOrders
}: {
  restaurant: Restaurant;
  tables: TablePayload[];
  initialMenuItems: MenuItemPayload[];
  initialOrders: OrderPayload[];
}) {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [orders, setOrders] = useState(initialOrders);
  const [createForm, setCreateForm] = useState(emptyMenuForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MenuForm>(emptyMenuForm);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/staff/restaurants/${restaurant.id}/orders`, { cache: "no-store" });
      if (response.ok) {
        setOrders((await response.json()) as OrderPayload[]);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [restaurant.id]);

  const ordersByStatus = useMemo(
    () =>
      statuses.reduce<Record<string, OrderPayload[]>>((result, status) => {
        result[status.id] = orders.filter((order) => order.status === status.id);
        return result;
      }, {}),
    [orders]
  );

  function formFromItem(item: MenuItemPayload): MenuForm {
    return {
      name: item.name,
      thumbnailUrl: item.thumbnailUrl ?? "",
      quantityAvailable: String(item.quantityAvailable),
      price: String((item.price / 100).toFixed(2)),
      description: item.description,
      isAvailable: item.isAvailable
    };
  }

  function apiPayload(form: MenuForm) {
    return {
      name: form.name,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      quantityAvailable: Number(form.quantityAvailable),
      price: dollarsToCents(form.price),
      description: form.description,
      isAvailable: form.isAvailable
    };
  }

  async function createMenuItem(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/staff/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id, ...apiPayload(createForm) })
    });
    const data = await response.json();

    if (response.ok) {
      setMenuItems((current) => [data, ...current]);
      setCreateForm(emptyMenuForm);
      setNotice("Menu item created.");
    } else {
      setNotice(data.error || "Unable to create menu item.");
    }
  }

  async function saveMenuItem(event: FormEvent) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    const response = await fetch(`/api/staff/menu/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiPayload(editForm))
    });
    const data = await response.json();

    if (response.ok) {
      setMenuItems((current) => current.map((item) => (item.id === editingId ? data : item)));
      setEditingId(null);
      setNotice("Menu item saved.");
    } else {
      setNotice(data.error || "Unable to save menu item.");
    }
  }

  async function disableMenuItem(itemId: string) {
    const response = await fetch(`/api/staff/menu/${itemId}`, { method: "DELETE" });
    const data = await response.json();

    if (response.ok) {
      setMenuItems((current) => current.map((item) => (item.id === itemId ? data : item)));
      setNotice("Menu item disabled.");
    } else {
      setNotice(data.error || "Unable to disable menu item.");
    }
  }

  async function updateOrderStatus(orderId: string, status: "PREPARING" | "COMPLETE") {
    const response = await fetch(`/api/staff/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      const updatedOrder = (await response.json()) as OrderPayload;
      setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Staff dashboard</p>
            <h1 className="text-2xl font-bold text-ink">{restaurant.name}</h1>
          </div>
          <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Platform fee {restaurant.platformFeePercent}%
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {notice ? <p className="mb-4 rounded-md bg-mint/10 p-3 text-sm font-medium text-mint">{notice}</p> : null}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <QrCode size={18} className="text-mint" />
            <h2 className="text-xl font-bold text-ink">Tables</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tables.map((table) => (
              <article key={table.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-ink">Table {table.tableNumber}</p>
                  <img
                    src={`/api/qr?data=${encodeURIComponent(table.qrCodeUrl)}`}
                    alt={`QR code for table ${table.tableNumber}`}
                    className="h-16 w-16"
                  />
                </div>
                <p className="mt-2 break-all text-xs leading-5 text-slate-600">{table.qrCodeUrl}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Orders</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            {statuses.map((status) => (
              <div key={status.id} className="min-h-64 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-ink">{status.title}</h3>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500">
                    {ordersByStatus[status.id]?.length ?? 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {(ordersByStatus[status.id] ?? []).map((order) => (
                    <article key={order.id} className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">Order #{order.orderNumber}</p>
                          <p className="text-sm text-slate-500">Table {order.table.tableNumber}</p>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-3 text-sm">
                            <span>{item.quantity} x {item.itemNameSnapshot}</span>
                            <span className="font-medium">{formatMoney(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      {order.customerComment ? (
                        <p className="mt-3 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                          {order.customerComment}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="font-bold text-ink">{formatMoney(order.totalAmount)}</p>
                        {order.status === "RECEIVED" ? (
                          <button
                            className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white"
                            onClick={() => updateOrderStatus(order.id, "PREPARING")}
                          >
                            <CookingPot size={16} />
                            Start
                          </button>
                        ) : null}
                        {order.status === "PREPARING" ? (
                          <button
                            className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-mint px-3 text-sm font-semibold text-white"
                            onClick={() => updateOrderStatus(order.id, "COMPLETE")}
                          >
                            <CheckCircle2 size={16} />
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Menu</h2>
          <form onSubmit={createMenuItem} className="mt-3 grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-6">
            <MenuFields form={createForm} onChange={setCreateForm} compact />
            <button className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white lg:self-end">
              <Plus size={16} />
              Create
            </button>
          </form>

          <div className="mt-4 grid gap-3">
            {menuItems.map((item) =>
              editingId === item.id ? (
                <form
                  key={item.id}
                  onSubmit={saveMenuItem}
                  className="grid gap-3 rounded-md border border-mint/30 bg-white p-4 lg:grid-cols-6"
                >
                  <MenuFields form={editForm} onChange={setEditForm} compact />
                  <div className="flex gap-2 lg:self-end">
                    <button className="focus-ring flex h-10 w-10 items-center justify-center rounded-md bg-mint text-white" aria-label="Save">
                      <Save size={17} />
                    </button>
                    <button
                      type="button"
                      className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-300"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </form>
              ) : (
                <article key={item.id} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[72px_1fr_auto]">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-slate-100" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ink">{item.name}</h3>
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${item.isAvailable ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-500"}`}>
                        {item.isAvailable ? "Available" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {formatMoney(item.price)} · {item.quantityAvailable} left
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <button
                      className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-300"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditForm(formFromItem(item));
                      }}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-tomato"
                      onClick={() => disableMenuItem(item.id)}
                      aria-label={`Disable ${item.name}`}
                    >
                      {item.isAvailable ? <Ban size={17} /> : <Trash2 size={17} />}
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function MenuFields({
  form,
  onChange,
  compact = false
}: {
  form: MenuForm;
  onChange: (form: MenuForm) => void;
  compact?: boolean;
}) {
  const inputClass = "focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm";

  return (
    <>
      <label className={compact ? "grid gap-1" : "grid gap-1 lg:col-span-2"}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Name</span>
        <input className={inputClass} required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
      </label>
      <label className={compact ? "grid gap-1" : "grid gap-1 lg:col-span-2"}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Price</span>
        <input className={inputClass} required inputMode="decimal" value={form.price} onChange={(event) => onChange({ ...form, price: event.target.value })} />
      </label>
      <label className={compact ? "grid gap-1" : "grid gap-1"}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Quantity</span>
        <input className={inputClass} required type="number" min="0" value={form.quantityAvailable} onChange={(event) => onChange({ ...form, quantityAvailable: event.target.value })} />
      </label>
      <label className={compact ? "grid gap-1" : "grid gap-1 lg:col-span-3"}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Thumbnail URL</span>
        <input className={inputClass} value={form.thumbnailUrl} onChange={(event) => onChange({ ...form, thumbnailUrl: event.target.value })} />
      </label>
      <label className={compact ? "grid gap-1 lg:col-span-2" : "grid gap-1 lg:col-span-5"}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</span>
        <input className={inputClass} required value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} />
      </label>
      <label className="flex h-10 items-center gap-2 self-end text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(event) => onChange({ ...form, isAvailable: event.target.checked })}
        />
        Available
      </label>
    </>
  );
}
