import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

/**
 * Combina clases de Tailwind CSS de manera inteligente, 
 * resolviendo conflictos y fusionando clases correctamente.
 * Utilizado por todos los componentes de shadcn/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Genera un ID público único y seguro de 10 caracteres.
 * Ejemplo de salida: "X7K9MP2QLZ"
 * 
 * Se excluyen caracteres confusos como:
 * - 0 (cero) y O (letra o mayúscula)
 * - 1 (uno) e I (letra i mayúscula) o l (letra L minúscula)
 * Esto facilita la lectura manual y la escritura de URLs.
 */
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const generatePublicId = customAlphabet(alphabet, 10);