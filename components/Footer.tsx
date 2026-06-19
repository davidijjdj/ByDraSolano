import Link from "next/link";
import { Smile, Phone, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary-400" />
            <span className="font-semibold">ByDraSolano</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Agustinas 853 Santiago, Chile</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> +569 76178090</span>
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> contacto@clinicadental.cl</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/" className="hover:text-primary-400 transition-colors">Inicio</Link>
            <Link href="/login" className="hover:text-primary-400 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-primary-400 transition-colors">Registro</Link>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-4 pt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} ByDraSolano. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
