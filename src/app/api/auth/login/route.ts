import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "secret"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("🔐 Intentando login:", email);

    // Buscar usuario
    const result = await db.execute(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado");
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const user = result.rows[0] as any;

    // Verificar contraseña (comparación directa porque la guardamos en texto plano)
    if (user.password_hash !== password) {
      console.log("❌ Contraseña incorrecta. DB:", user.password_hash, "Input:", password);
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    console.log("✅ Login exitoso:", user.email);

    const response = NextResponse.json(
      { 
        message: "Login exitoso", 
        user: { id: user.id, name: user.name, email: user.email } 
      },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}