"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Shield, Clock, Award, Star, Quote } from "lucide-react";
import { getTestimonials, Testimonial } from "@/lib/auth";

const features = [
  { icon: Shield, title: "Tecnología Avanzada", description: "Equipos de última generación para diagnósticos precisos y tratamientos eficaces." },
  { icon: Clock, title: "Horarios Flexibles", description: "Atención de lunes a sábado con horarios que se adaptan a tu rutina." },
  { icon: Award, title: "Especialistas Certificados", description: "Nuestro equipo cuenta con certificaciones internacionales en odontología." },
];

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTestimonials(getTestimonials());
  }, []);

  if (!mounted) {
    return <div suppressHydrationWarning />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Tu Sonrisa en las Mejores Manos</h1>
              <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
                En Clínica Dental combinamos tecnología de punta con un equipo humano excepcional para brindarte la mejor atención odontológica de Chile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors">
                  Agenda tu Cita <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="#testimonios" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                  Ver Testimonios
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Por qué elegirnos?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Nos diferenciamos por nuestra dedicación, profesionalismo y compromiso con la salud bucal de nuestros pacientes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-gray-50 hover:bg-primary-50 transition-colors">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <f.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonios" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros pacientes</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">La satisfacción de nuestros pacientes es nuestro mejor aval.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <Quote className="h-8 w-8 text-primary-200 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{t.text}</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para transformar tu sonrisa?</h2>
            <p className="text-lg text-primary-100 mb-8">Accede a tu cuenta para agendar citas, ver tu plan de tratamiento y mucho más.</p>
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors">
              Iniciar Sesión <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
