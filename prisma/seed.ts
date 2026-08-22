import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "demo-restaurant" },
    update: {
      name: "SwiftOrder Demo Kitchen",
      platformFeePercent: 5,
      allowCustomerComments: true
    },
    create: {
      id: "demo-restaurant",
      name: "SwiftOrder Demo Kitchen",
      platformFeePercent: 5,
      allowCustomerComments: true
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const tableNumber of ["1", "2", "3", "4"]) {
    await prisma.restaurantTable.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber
        }
      },
      update: {
        qrCodeUrl: `${appUrl}/r/${restaurant.id}/table/${tableNumber}`
      },
      create: {
        restaurantId: restaurant.id,
        tableNumber,
        qrCodeUrl: `${appUrl}/r/${restaurant.id}/table/${tableNumber}`
      }
    });
  }

  const items = [
    {
      name: "Crispy Chili Wontons",
      description: "Pork wontons, sesame, scallion, and house chili oil.",
      price: 900,
      quantityAvailable: 30,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Market Greens Bowl",
      description: "Seasonal greens, roasted vegetables, grains, and ginger dressing.",
      price: 1250,
      quantityAvailable: 20,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Garlic Noodle Plate",
      description: "Egg noodles tossed with garlic butter, herbs, and parmesan.",
      price: 1400,
      quantityAvailable: 24,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Yuzu Lemonade",
      description: "Sparkling lemonade with yuzu and mint.",
      price: 550,
      quantityAvailable: 40,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80"
    }
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: item.name }
    });

    if (existing) {
      await prisma.menuItem.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          ...item
        }
      });
    }
  }

  console.log("Seeded demo restaurant:");
  console.log(`Customer table URL: ${appUrl}/r/${restaurant.id}/table/1`);
  console.log(`Staff dashboard: ${appUrl}/staff/${restaurant.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
