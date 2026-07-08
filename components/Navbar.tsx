"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Smile, Menu, X, LogOut, Shield, User, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isDoctor, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isActive = (path: string) => pathname === path;

  const publicLinks = [
    { href: "/", label: "Inicio" },
    { href: "/login", label: "Iniciar Sesión" },
  ];

  const patientLinks = [
    { href: "/", label: "Inicio" },
    { href: "/paciente/dashboard", label: "Mi Panel" },
  ];

  const doctorLinks = [
    { href: "/", label: "Inicio" },
    { href: "/doctor/dashboard", label: "Mi Panel" },
  ];

  const adminLinks = [
    { href: "/", label: "Inicio" },
    { href: "/admin", label: "Administración" },
  ];

  let navLinks = publicLinks;
  if (mounted && isAdmin) navLinks = adminLinks;
  else if (mounted && isDoctor) navLinks = doctorLinks;
  else if (mounted && isAuthenticated) navLinks = patientLinks;

  const roleLabel = isAdmin ? "Administrador" : isDoctor ? "Doctor" : "Paciente";
  const RoleIcon = isAdmin ? Shield : isDoctor ? Stethoscope : User;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Smile className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ByDraSolano</span>
            </Link>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href) ? "text-primary-600" : "text-gray-600 hover:text-primary-600"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {mounted && isAuthenticated && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <RoleIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600 hover:text-gray-900">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.href) ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-primary-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {mounted && isAuthenticated && (
              <>
                <div className="px-3 py-2 border-t mt-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RoleIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-red-600 font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}