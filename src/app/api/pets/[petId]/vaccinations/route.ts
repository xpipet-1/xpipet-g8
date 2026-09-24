import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

// GET: Obtener vacunas de una mascota
export async function GET(
  request: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const resolvedParams = await params;
    const petId = resolvedParams.petId;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    // Verificar que la mascota pertenece al usuario
    const petCheck = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (petCheck.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    // Obtener vacunas
    const result = await db.execute(
      `SELECT id, vaccine_name, date_administered, next_due, lot_number, vet_name, document_key, created_at
       FROM vaccinations
       WHERE pet_id = ?
       ORDER BY date_administered DESC`,
      [petId]
    );

    return NextResponse.json({
      vaccinations: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error al obtener vacunas:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// POST: Registrar nueva vacuna
export async function POST(
  request: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const resolvedParams = await params;
    const petId = resolvedParams.petId;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    const body = await request.json();
    const { vaccine_name, date_administered, next_due, lot_number, vet_name, document_key } = body;

    if (!vaccine_name || !date_administered) {
      return NextResponse.json(
        { message: "Nombre de vacuna y fecha son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la mascota pertenece al usuario
    const petCheck = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (petCheck.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    // Guardar vacuna
    const vaccinationId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO vaccinations (id, pet_id, vaccine_name, date_administered, next_due, lot_number, vet_name, document_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [vaccinationId, petId, vaccine_name, date_administered, next_due || null, lot_number || null, vet_name || null, document_key || null]
    );

    return NextResponse.json(
      { message: "Vacuna registrada", vaccinationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar vacuna:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// DELETE: Eliminar vacuna
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const resolvedParams = await params;
    const vaccinationId = resolvedParams.petId;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    // Verificar que la vacuna pertenece a una mascota del usuario
    const check = await db.execute(
      `SELECT v.id FROM vaccinations v
       JOIN pets p ON v.pet_id = p.id
       WHERE v.id = ? AND p.owner_id = ?`,
      [vaccinationId, userId]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ message: "Vacuna no encontrada" }, { status: 404 });
    }

    await db.execute("DELETE FROM vaccinations WHERE id = ?", [vaccinationId]);

    return NextResponse.json({ message: "Vacuna eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar vacuna:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}