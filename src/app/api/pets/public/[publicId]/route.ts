import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Obtener perfil público de una mascota por public_id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const resolvedParams = await params;
    const publicId = resolvedParams.publicId;

    // Buscar mascota (sin datos sensibles del dueño)
    const result = await db.execute(
      `SELECT 
        p.id, p.public_id, p.name, p.species, p.breed, p.color, p.sex, 
        p.status, p.microchip, p.gps_enabled, 
        p.last_known_location_lat, p.last_known_location_lng, 
        p.last_location_updated_at, p.lost_report, p.created_at,
        u.name as owner_name
       FROM pets p
       JOIN users u ON p.owner_id = u.id
       WHERE p.public_id = ? AND p.deleted_at IS NULL`,
      [publicId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Mascota no encontrada" },
        { status: 404 }
      );
    }

    const pet = result.rows[0] as any;

    return NextResponse.json({
      pet: {
        id: pet.id,
        publicId: pet.public_id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        color: pet.color,
        sex: pet.sex,
        status: pet.status,
        microchip: pet.microchip,
        gpsEnabled: pet.gps_enabled === 1,
        lastLocation: pet.last_known_location_lat ? {
          lat: pet.last_known_location_lat,
          lng: pet.last_known_location_lng,
          updatedAt: pet.last_location_updated_at,
        } : null,
        lostReport: pet.lost_report,
        createdAt: pet.created_at,
        ownerName: pet.owner_name,
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil público:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  }
}