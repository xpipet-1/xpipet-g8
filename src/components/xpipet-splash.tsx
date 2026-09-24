"use client"

import Image from "next/image"

const buttons = [
  {
    title: "Explorar",
    href: "/login", // 🔥 CAMBIADO: Ahora lleva al login de XpiPet
    color: "#c084fc", // morado neón
    glow: "rgba(192,132,252,0.9)",
  },
  {
    title: "Centro Clínico",
    href: "/centro-clinico", // Pendiente para el futuro
    color: "#22d3ee", // cian neón
    glow: "rgba(34,211,238,0.9)",
  },
  {
    title: "Administrador",
    href: "/administrador", // Pendiente para el futuro
    color: "#4ade80", // verde neón
    glow: "rgba(74,222,128,0.9)",
  },
]

export function XpipetSplash() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Video de fondo */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/xpipet-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Capa oscura para legibilidad */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70"
        aria-hidden="true"
      />

      {/* Logo superior izquierdo */}
      <div className="absolute left-4 top-4 z-20 animate-float drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] sm:left-6 sm:top-6">
        <Image
          src="/xpipet-logo.png"
          alt="Logo de xpipet: cachorro sosteniendo el símbolo pi"
          width={120}
          height={120}
          priority
          className="h-auto w-16 select-none sm:w-20 md:w-24"
        />
      </div>

      {/* Contenido flotante */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
        {/* Texto central con colores dinámicos */}
        <h1 className="animate-rainbow bg-clip-text text-center text-5xl font-extrabold tracking-tight text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
          Bienvenidos
        </h1>
        <p className="-mt-4 text-center text-lg font-medium text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-xl">
          <span className="font-bold">XpiPet.</span> Memoria de vida para tu mascota
        </p>

        {/* Botones neón transparentes */}
        <nav className="mt-4 flex w-full max-w-xs flex-col gap-4">
          {buttons.map((btn) => (
            <a
              key={btn.title}
              href={btn.href}
              className="group relative rounded-full border-2 bg-white/5 px-8 py-4 text-center text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                borderColor: btn.color,
                boxShadow: `0 0 12px ${btn.glow}, inset 0 0 12px ${btn.glow}`,
                color: "#fff",
                textShadow: `0 0 8px ${btn.glow}`,
              }}
            >
              {btn.title}
            </a>
          ))}
        </nav>
      </div>
    </main>
  )
}