import { notFound } from "next/navigation";
import { StaffDashboard } from "@/components/StaffDashboard";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";

export default async function StaffPage({
  params
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: {
        orderBy: { tableNumber: "asc" },
        select: { id: true, tableNumber: true, qrCodeUrl: true }
      },
      menuItems: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          thumbnailUrl: true,
          quantityAvailable: true,
          price: true,
          description: true,
          isAvailable: true
        }
      },
      orders: {
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
      }
    }
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <StaffDashboard
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        platformFeePercent: restaurant.platformFeePercent,
        allowCustomerComments: restaurant.allowCustomerComments
      }}
      tables={restaurant.tables}
      initialMenuItems={restaurant.menuItems}
      initialOrders={restaurant.orders.map(serializeOrder)}
    />
  );
}
