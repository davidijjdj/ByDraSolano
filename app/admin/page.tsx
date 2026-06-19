"use client";

import { useState, useEffect } from "react";
import AdminContent from "./AdminContent";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div suppressHydrationWarning />;
  }

  return <AdminContent />;
}
