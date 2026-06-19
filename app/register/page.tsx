"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Smile, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatRut, isValidRut, registerUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    rut: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    diseases: "",
    allergies: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    if (formatted.length <= 12) handleChange("rut", formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const cleanRut = form.rut.replace(/[^0-9kK]/g, "");
    if (!isValidRut(cleanRut)) newErrors.rut = "El RUT no es válido";
    if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!form.email.trim() || !form.email.includes("@")) newErrors.email = "Email inválido";
    if (!form.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    if (!form.birthDate) newErrors.birthDate = "La fecha de nacimiento es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      registerUser({
        rut: form.rut,
        password: form.password,
        role: "paciente",
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        diseases: form.diseases || "Ninguna",
        allergies: form.allergies || "Ninguna",
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrors({ general: err.message });
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
        <div className="w-full max-w-2xl px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smile className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Registro de Paciente</h1>
              <p className="text-gray-600 mt-2">Completa tus datos para crear una cuenta</p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700">¡Registro exitoso! Redirigiendo al login...</p>
              </div>
            )}

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RUT *</label>
                  <input type="text" value={form.rut} onChange={handleRutChange} placeholder="12.345.678-9"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.rut ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                  {errors.rut && <p className="mt-1 text-sm text-red-600">{errors.rut}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                  <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Juan Pérez"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="correo@email.com"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+56 9 1234 5678"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                  <input type="date" value={form.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.birthDate ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                  {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Mínimo 6 caracteres"
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"}`} />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div className="border-t pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enfermedades Preexistentes</label>
                    <textarea value={form.diseases} onChange={(e) => handleChange("diseases", e.target.value)} placeholder="Diabetes, hipertensión, etc. (dejar en blanco si no tiene)"
                      rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                    <textarea value={form.allergies} onChange={(e) => handleChange("allergies", e.target.value)} placeholder="Penicilina, látex, etc. (dejar en blanco si no tiene)"
                      rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || success}
                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors">
                {isSubmitting ? "Registrando..." : "Crear Cuenta"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Inicia sesión aquí</Link>
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
