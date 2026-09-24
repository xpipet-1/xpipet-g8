import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { generatePublicId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

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

    // Hashear contraseña
    const passwordHash = await hash(password, 12);

    // Crear usuario
    const userId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, name, email, passwordHash]
    );

    return NextResponse.json(
      { message: "Usuario creado exitosamente", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}