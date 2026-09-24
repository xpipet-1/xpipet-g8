import { createClient } from "@libsql/client";

// Crear cliente de Turso
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Función auxiliar para ejecutar queries
export async function query(sql: string, params: any[] = []) {
  try {
    const result = await db.execute({ sql, args: params });
    return result;
  } catch (error) {
    console.error("Turso Database Error:", error);
    throw error;
  }
}

// Función para inicializar la BD (ejecutar schema)
export async function initializeDatabase() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar cada sentencia SQL del schema
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute({ sql: statement, args: [] });
      }
    }
    
    console.log('✅ Base de datos Turso inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}