import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");

  if (!data) {
    return NextResponse.json({ error: "Missing QR data" }, { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    type: "png",
    width: 220,
    margin: 1,
    color: {
      dark: "#18212f",
      light: "#ffffff"
    }
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
