"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Shield, Clock, Award, Star, Users, CalendarCheck, ThumbsUp } from "lucide-react";
import { getTestimonials, Testimonial } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

const features = [
  { icon: Shield, title: "Tecnología avanzada", description: "Equipos de última generación para diagnósticos precisos y tratamientos eficaces." },
  { icon: Clock, title: "Horarios flexibles", description: "Atención de lunes a sábado con horarios que se adaptan a tu rutina." },
  { icon: Award, title: "Especialistas certificados", description: "Nuestro equipo cuenta con certificaciones internacionales en odontología." },
];

const stats = [
  { icon: Users, value: "+2.400", label: "Pacientes atendidos" },
  { icon: CalendarCheck, value: "12 años", label: "De experiencia" },
  { icon: ThumbsUp, value: "4.9 ★", label: "Satisfacción promedio" },
];

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-yellow-100 text-yellow-700",
  "bg-pink-100 text-pink-700",
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isDoctor, isLoading } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getTestimonials().then(setTestimonials);
  }, []);

  // Decide a dónde va el botón "Agendar cita" según el estado de sesión
  const handleAgendarClick = () => {
    if (!mounted || isLoading) return;
    if (isAdmin) {
      router.push("/admin");
    } else if (isDoctor) {
      router.push("/doctor/dashboard");
    } else if (isAuthenticated) {
      router.push("/paciente/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (!mounted) return <div suppressHydrationWarning />;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-16 top-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Clínica abierta hoy · Agustinas 853, Santiago
            </div>

            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Tu sonrisa en las mejores manos
              </h1>
              <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
                En ByDraSolano combinamos tecnología de punta con un equipo excepcional para brindarte la mejor atención odontológica de Chile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAgendarClick}
                  className="inline-flex items-center justify-center px-8 py-4 bg-cta-500 hover:bg-cta-600 text-white font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {isAuthenticated ? "Ir a mi panel" : "Agenda tu cita"} <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <Link
                  href="#testimonios"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Ver testimonios
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
        </section>

        {/* ── STATS BAR ── */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 px-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <s.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="font-heading text-xl font-bold text-primary-600">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Por qué elegirnos?</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Nos diferenciamos por nuestra dedicación, profesionalismo y compromiso con la salud bucal de nuestros pacientes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
                    <f.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonios" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros pacientes</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">La satisfacción de nuestros pacientes es nuestro mejor aval.</p>
            </div>
            {testimonials.length === 0 ? (
              <p className="text-center text-gray-400 py-12">Aún no hay testimonios.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, idx) => (
                  <div key={t.id} className="bg-surface p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed italic flex-1 mb-6">"{t.text}"</p>
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                      {t.imageUrl ? (
                        <img src={t.imageUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                          {getInitials(t.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para transformar tu sonrisa?</h2>
            <p className="text-lg text-gray-400 mb-8">Accede a tu cuenta para agendar citas, ver tu plan de tratamiento y mucho más.</p>
            <button
              onClick={handleAgendarClick}
              className="inline-flex items-center justify-center px-8 py-4 bg-cta-500 hover:bg-cta-600 text-white font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {isAuthenticated ? "Ir a mi panel" : "Agendar mi cita"} <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
