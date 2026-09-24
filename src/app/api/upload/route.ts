import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "La imagen no debe superar 5MB" },
        { status: 400 }
      );
    }

    // Convertir imagen a base64 para almacenarla temporalmente
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // En producción, aquí subirías a un servicio como AWS S3, Cloudinary, etc.
    // Por ahora, devolvemos el base64 directamente para que se incluya en el mensaje
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      { message: "Error interno al subir imagen" },
      { status: 500 }
    );
  }
}