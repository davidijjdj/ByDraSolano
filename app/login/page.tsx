"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Smile, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { formatRut, isValidRut } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rutError, setRutError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    if (formatted.length <= 12) {
      setRut(formatted);
      setRutError("");
      setLoginError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const cleanRut = rut.replace(/[^0-9kK]/g, "");
    if (!isValidRut(cleanRut)) {
      setRutError("El RUT ingresado no es válido");
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await login(rut, password);
      if (session.user.role === "admin") {
        router.push("/admin");
      } else if (session.user.role === "doctor") {
        router.push("/doctor/dashboard");
      } else {
        router.push("/paciente/dashboard");
      }
    } catch (err: any) {
      setLoginError(err.message || "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return <div suppressHydrationWarning />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smile className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
              <p className="text-gray-600 mt-2">Accede a tu cuenta</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">RUT</label>
                <input
                  type="text" id="rut" value={rut} onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                    rutError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"
                  }`}
                  required
                />
                {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
                <p className="mt-1 text-xs text-gray-500">Ingresa tu RUT con dígito verificador</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} id="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-1 text-right">
                  <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">Regístrate aquí</Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}