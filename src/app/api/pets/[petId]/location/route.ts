import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

// GET: Obtener ubicación actual
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

    const result = await db.execute(
      "SELECT last_known_location_lat, last_known_location_lng, last_location_updated_at FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    const pet = result.rows[0] as any;
    
    if (!pet.last_known_location_lat || !pet.last_known_location_lng) {
      return NextResponse.json({ message: "Sin ubicación disponible" }, { status: 404 });
    }

    return NextResponse.json({
      lat: pet.last_known_location_lat,
      lng: pet.last_known_location_lng,
      updatedAt: pet.last_location_updated_at,
    });
  } catch (error) {
    console.error("Error al obtener ubicación:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// PUT: Actualizar ubicación
export async function PUT(
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
    const { lat, lng } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { message: "Latitud y longitud son requeridas" },
        { status: 400 }
      );
    }

    // Verificar que la mascota existe y pertenece al usuario
    const existing = await db.execute(
      "SELECT id FROM pets WHERE id = ? AND owner_id = ?",
      [petId, userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ message: "Mascota no encontrada" }, { status: 404 });
    }

    // Actualizar ubicación
    await db.execute(
      "UPDATE pets SET last_known_location_lat = ?, last_known_location_lng = ?, last_location_updated_at = datetime('now') WHERE id = ?",
      [lat, lng, petId]
    );

    // Guardar en historial
    try {
      const historyId = crypto.randomUUID();
      await db.execute(
        "INSERT INTO gps_locations (id, pet_id, latitude, longitude, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [historyId, petId, lat, lng]
      );
    } catch (err) {
      console.error("Error al guardar en historial:", err);
      // No fallar si el historial falla
    }

    return NextResponse.json({ message: "Ubicación actualizada", success: true });
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}