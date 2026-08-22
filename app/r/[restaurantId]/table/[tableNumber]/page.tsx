import { notFound } from "next/navigation";
import { MenuClient } from "@/components/MenuClient";
import { prisma } from "@/lib/prisma";

export default async function CustomerMenuPage({
  params
}: {
  params: Promise<{ restaurantId: string; tableNumber: string }>;
}) {
  const { restaurantId, tableNumber } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: {
        where: { tableNumber },
        select: { id: true, tableNumber: true }
      },
      menuItems: {
        where: { isAvailable: true },
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
      }
    }
  });

  if (!restaurant || restaurant.tables.length === 0) {
    notFound();
  }

  return (
    <MenuClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        allowCustomerComments: restaurant.allowCustomerComments
      }}
      tableNumber={tableNumber}
      items={restaurant.menuItems}
    />
  );
}
