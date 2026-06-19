"use client";

import { useState, useEffect } from "react";
import PatientDashboardContent from "./PatientDashboardContent";

export default function PatientDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div suppressHydrationWarning />;
  }

  return <PatientDashboardContent />;
}
