import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MenuItemBody = {
  name?: string;
  thumbnailUrl?: string | null;
  quantityAvailable?: number;
  price?: number;
  description?: string;
  isAvailable?: boolean;
};

function validateMenuBody(body: MenuItemBody) {
  const name = body.name?.trim();
  const description = body.description?.trim();
  const quantityAvailable = Number(body.quantityAvailable);
  const price = Number(body.price);

  if (!name || !description) {
    return { error: "Name and description are required" };
  }

  if (!Number.isInteger(quantityAvailable) || quantityAvailable < 0) {
    return { error: "Quantity must be a non-negative integer" };
  }

  if (!Number.isInteger(price) || price <= 0) {
    return { error: "Price must be greater than zero" };
  }

  return {
    data: {
      name,
      description,
      thumbnailUrl: body.thumbnailUrl?.trim() || null,
      quantityAvailable,
      price,
      isAvailable: body.isAvailable ?? true
    }
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as MenuItemBody;
  const validation = validateMenuBody(body);

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: validation.data
  });

  return NextResponse.json(menuItem);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: false }
  });

  return NextResponse.json(menuItem);
}
