import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

// PUT: Activar/Desactivar GPS
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const petId = resolvedParams.id;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    const body = await request.json();
    const { enabled } = body;

    await db.execute(
      "UPDATE pets SET gps_enabled = ? WHERE id = ? AND owner_id = ?",
      [enabled ? 1 : 0, petId, userId]
    );

    return NextResponse.json(
      { message: `GPS ${enabled ? "activado" : "desactivado"}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cambiar GPS:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}