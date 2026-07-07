"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDoctor?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requireDoctor }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isDoctor, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (requireAdmin && !isAdmin) { router.push("/"); return; }
    if (requireDoctor && !isDoctor && !isAdmin) { router.push("/"); return; }
  }, [isAuthenticated, isAdmin, isDoctor, isLoading, requireAdmin, requireDoctor, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireDoctor && !isDoctor && !isAdmin) return null;

  return <>{children}</>;
}
