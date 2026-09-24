import { db } from "@/lib/db";

export default async function TestDB() {
  try {
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
    
    return (
      <div className="p-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-green-600">✅ Turso Conectado</h1>
        <p className="mb-4 text-gray-700">Tablas creadas en xpipet ({result.rows.length} tablas):</p>
        <div className="bg-white rounded-lg shadow p-4">
          <ul className="space-y-2">
            {result.rows.map((table: any, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{table.name}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-red-600">❌ Error de Conexión</h1>
        <pre className="bg-red-100 p-4 rounded text-red-800">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }
}