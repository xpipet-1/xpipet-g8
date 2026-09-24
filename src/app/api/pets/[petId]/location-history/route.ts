import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

// GET: Obtener historial de ubicaciones
export async function GET(
  request: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const resolvedParams = await params;
    const petId = resolvedParams.petId;

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token.value, JWT_SECRET);
      userId = payload.userId as string;
      
      // Validar que userId exista y sea string
      if (!userId || typeof userId !== 'string') {
        console.error("userId inválido:", userId);
        return NextResponse.json({ message: "Token inválido" }, { status: 401 });
      }
    } catch (err) {
      console.error("Error al verificar token:", err);
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    // Verificar que la mascota pertenece al usuario
    const petCheck = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (petCheck.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    // Obtener historial de ubicaciones (últimas 50)
    const result = await db.execute(
      `SELECT id, latitude, longitude, accuracy_meters, created_at
       FROM gps_locations
       WHERE pet_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [petId]
    );

    return NextResponse.json({
      locations: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// POST: Guardar nueva ubicación en historial
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

    let userId: string;
    try {
      const { payload } = await jwtVerify(token.value, JWT_SECRET);
      userId = payload.userId as string;
      
      if (!userId || typeof userId !== 'string') {
        console.error("userId inválido:", userId);
        return NextResponse.json({ message: "Token inválido" }, { status: 401 });
      }
    } catch (err) {
      console.error("Error al verificar token:", err);
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const { lat, lng, accuracy } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { message: "Latitud y longitud son requeridas" },
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

    // Guardar ubicación en historial
    const locationId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO gps_locations (id, pet_id, latitude, longitude, accuracy_meters, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [locationId, petId, lat, lng, accuracy || null]
    );

    return NextResponse.json(
      { message: "Ubicación guardada en historial", locationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al guardar ubicación:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}