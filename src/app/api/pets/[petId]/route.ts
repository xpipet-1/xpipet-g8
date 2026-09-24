import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

// PUT: Actualizar mascota completa
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
    const { name, species, breed, color, sex, microchip } = body;

    const existing = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    await db.execute(
      `UPDATE pets 
       SET name = ?, species = ?, breed = ?, color = ?, sex = ?, microchip = ?, updated_at = datetime('now')
       WHERE id = ? AND owner_id = ?`,
      [name, species, breed || null, color || null, sex || null, microchip || null, petId, userId]
    );

    return NextResponse.json({ message: "Mascota actualizada" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// PATCH: Actualizar estado (perdido/encontrado)
export async function PATCH(
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
    const { status, lost_report } = body;

    // Verificar que la mascota existe
    const existing = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    // Actualizar estado
    await db.execute(
      `UPDATE pets 
       SET status = ?, lost_report = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [status, lost_report || null, petId]
    );

    return NextResponse.json(
      { message: `Mascota marcada como ${status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// DELETE: Eliminar mascota
export async function DELETE(
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

    await db.execute(
      "UPDATE pets SET deleted_at = datetime('now') WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    return NextResponse.json({ message: "Mascota eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}