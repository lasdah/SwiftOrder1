export type OrderStatus = "RECEIVED" | "PREPARING" | "COMPLETE";

export type OrderPayload = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerComment: string | null;
  totalAmount: number;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  table: {
    id: string;
    tableNumber: string;
  };
  items: {
    id: string;
    menuItemId: string | null;
    quantity: number;
    unitPrice: number;
    itemNameSnapshot: string;
  }[];
};

type PrismaOrder = {
  id: string;
  orderNumber: number;
  status: string;
  customerComment: string | null;
  totalAmount: number;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  table: {
    id: string;
    tableNumber: string;
  };
  items: {
    id: string;
    menuItemId: string | null;
    quantity: number;
    unitPrice: number;
    itemNameSnapshot: string;
  }[];
};

export function serializeOrder(order: PrismaOrder): OrderPayload {
  return {
    ...order,
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}
