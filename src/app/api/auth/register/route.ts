import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log("📝 Intentando registrar:", { name, email });

    // Verificar si el usuario ya existe
    const existingUser = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Generar ID único
    const userId = crypto.randomUUID();
    
    // NOTA: Por ahora guardamos la contraseña sin hashear para probar
    // En producción usaremos bcrypt
    const passwordHash = password;

    // Crear usuario
    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, status, created_at) 
       VALUES (?, ?, ?, ?, 'active', datetime('now'))`,
      [userId, name, email, passwordHash]
    );

    console.log("✅ Usuario creado:", userId);

    return NextResponse.json(
      { message: "Usuario creado exitosamente", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: String(error) },
      { status: 500 }
    );
  }
}