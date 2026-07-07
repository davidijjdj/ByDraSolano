"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
  getDoctorPatients, getTreatments, getAppointments,
  addTreatment, updateTreatment, deleteTreatment,
  User, Treatment, Appointment,
  calculateAge
} from "@/lib/auth";
import {
  Users, ClipboardList, Plus, Edit3, Trash2, X, Save,
  CheckCircle2, Clock, AlertCircle, Search, Loader2,
  CalendarCheck, Stethoscope, ChevronRight
} from "lucide-react";

type Tab = "pacientes" | "tratamientos" | "citas";

const TREATMENT_STATUSES = ["Pendiente", "En Progreso", "Completado"] as const;

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default function DoctorDashboardContent() {
  return (
    <ProtectedRoute requireDoctor>
      <DoctorDashboardInner />
    </ProtectedRoute>
  );
}

function DoctorDashboardInner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pacientes");
  const [patients, setPatients] = useState<User[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const pts = await getDoctorPatients(user.rut);
    setPatients(pts);
    // Cargar todos los tratamientos y citas de todos los pacientes asignados
    const allTreatments: Treatment[] = [];
    const allAppointments: Appointment[] = [];
    for (const p of pts) {
      const t = await getTreatments(p.rut);
      const a = await getAppointments(p.rut);
      allTreatments.push(...t);
      allAppointments.push(...a);
    }
    setTreatments(allTreatments);
    setAppointments(allAppointments);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const openNewTreatment = (patient?: User) => {
    setEditingTreatment(null);
    setSelectedPatient(patient || null);
    setModalOpen(true);
  };

  const openEditTreatment = (t: Treatment) => {
    setEditingTreatment(t);
    setSelectedPatient(patients.find(p => p.rut === t.patientRut) || null);
    setModalOpen(true);
  };

  const handleSaveTreatment = async (data: any) => {
    if (editingTreatment) {
      await updateTreatment(editingTreatment.id, data);
    } else {
      await addTreatment(data);
    }
    setModalOpen(false);
    await loadData();
  };

  const handleDeleteTreatment = async (id: string) => {
    if (confirm("¿Eliminar este tratamiento?")) {
      await deleteTreatment(id);
      await loadData();
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut.includes(searchTerm)
  );

  const filteredTreatments = treatments.filter(t => {
    const patient = patients.find(p => p.rut === t.patientRut);
    return (
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientRut.includes(searchTerm) ||
      t.procedure.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "pacientes", label: "Mis Pacientes", icon: Users, count: patients.length },
    { id: "tratamientos", label: "Tratamientos", icon: ClipboardList, count: treatments.length },
    { id: "citas", label: "Citas", icon: CalendarCheck, count: appointments.length },
  ];

  const getStatusStyle = (status: string) => {
    if (status === "Completado") return "bg-green-50 text-green-700 border-green-200";
    if (status === "En Progreso") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm mb-1">Panel del Doctor</p>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">
                {user.name}
              </h1>
              <p className="text-primary-100 text-sm mt-1">
                {patients.length} paciente{patients.length !== 1 ? "s" : ""} asignado{patients.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-lg font-bold flex-shrink-0">
              <Stethoscope className="h-7 w-7" />
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{patients.length}</div>
              <div className="text-xs text-primary-100 mt-0.5">Pacientes</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{treatments.filter(t => t.status === "En Progreso").length}</div>
              <div className="text-xs text-primary-100 mt-0.5">Tratamientos activos</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{appointments.filter(a => a.status === "Pendiente").length}</div>
              <div className="text-xs text-primary-100 mt-0.5">Citas pendientes</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {/* ── PACIENTES ── */}
              {activeTab === "pacientes" && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-heading font-semibold text-gray-900">Mis pacientes asignados</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {filteredPatients.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tienes pacientes asignados todavía.</p>
                      <p className="text-sm text-gray-400 mt-1">El administrador te asignará pacientes desde su panel.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredPatients.map(p => {
                        const patientTreatments = treatments.filter(t => t.patientRut === p.rut);
                        const patientAppointments = appointments.filter(a => a.patientRut === p.rut);
                        return (
                          <div key={p.id} className="p-5 hover:bg-surface transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                  {getInitials(p.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{p.name}</p>
                                  <p className="text-xs text-gray-500">{p.rut} {p.birthDate ? `· ${calculateAge(p.birthDate)} años` : ""}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => openNewTreatment(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" /> Nuevo tratamiento
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                              <div><span className="font-medium text-gray-700">Teléfono:</span> {p.phone || "—"}</div>
                              <div><span className="font-medium text-gray-700">Email:</span> {p.email}</div>
                              <div><span className="font-medium text-gray-700">Alergias:</span> {p.allergies || "Ninguna"}</div>
                              <div><span className="font-medium text-gray-700">Enfermedades:</span> {p.diseases || "Ninguna"}</div>
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3.5 w-3.5" />
                                {patientTreatments.length} tratamiento{patientTreatments.length !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-3.5 w-3.5" />
                                {patientAppointments.length} cita{patientAppointments.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TRATAMIENTOS ── */}
              {activeTab === "tratamientos" && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-heading font-semibold text-gray-900">Tratamientos de mis pacientes</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <button
                        onClick={() => openNewTreatment()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Nuevo
                      </button>
                    </div>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {filteredTreatments.length === 0 ? (
                      <p className="px-6 py-10 text-center text-gray-400 text-sm">No hay tratamientos registrados.</p>
                    ) : filteredTreatments.map(t => {
                      const patient = patients.find(p => p.rut === t.patientRut);
                      return (
                        <div key={t.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{t.procedure}</p>
                              <p className="text-xs text-gray-500">{patient?.name || t.patientRut}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusStyle(t.status)}`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Fase: {t.phase} · {t.date} · {t.cost}</p>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => openEditTreatment(t)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg border border-blue-200"><Edit3 className="h-3 w-3" /> Editar</button>
                            <button onClick={() => handleDeleteTreatment(t.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200"><Trash2 className="h-3 w-3" /> Eliminar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Paciente</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Fase</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Procedimiento</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Costo</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Pagado</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTreatments.length === 0 ? (
                          <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">No hay tratamientos registrados.</td></tr>
                        ) : filteredTreatments.map(t => {
                          const patient = patients.find(p => p.rut === t.patientRut);
                          return (
                            <tr key={t.id} className="hover:bg-surface transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{patient?.name || t.patientRut}</div>
                                <div className="text-xs text-gray-400">{t.patientRut}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{t.phase}</td>
                              <td className="px-6 py-4 text-gray-600">{t.procedure}</td>
                              <td className="px-6 py-4 text-gray-600">{t.date}</td>
                              <td className="px-6 py-4 font-medium text-gray-900">{t.cost}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(t.status)}`}>
                                  {t.status === "Completado" ? <CheckCircle2 className="h-3 w-3" /> : t.status === "En Progreso" ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.paid ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                                  {t.paid ? "✓ Pagado" : "Pendiente"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openEditTreatment(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                                  <button onClick={() => handleDeleteTreatment(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── CITAS ── */}
              {activeTab === "citas" && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-gray-900">Citas de mis pacientes</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Paciente</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Fecha / Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Motivo</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appointments.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No hay citas registradas.</td></tr>
                        ) : appointments.map(a => {
                          const patient = patients.find(p => p.rut === a.patientRut);
                          return (
                            <tr key={a.id} className="hover:bg-surface transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">{patient?.name || a.patientRut}</td>
                              <td className="px-6 py-4">
                                <div className="text-gray-900">{a.date}</div>
                                <div className="text-sm text-gray-400">{a.time} hrs</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{a.treatment}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  a.status === "Confirmada" ? "bg-green-50 text-green-700 border-green-200" :
                                  a.status === "Pendiente" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                  a.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>{a.status}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{a.notes || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Modal de tratamiento */}
      {modalOpen && (
        <TreatmentModal
          treatment={editingTreatment}
          patients={patients}
          defaultPatient={selectedPatient}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTreatment}
        />
      )}
    </div>
  );
}

function TreatmentModal({
  treatment, patients, defaultPatient, onClose, onSave
}: {
  treatment: Treatment | null;
  patients: User[];
  defaultPatient: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    patientRut: treatment?.patientRut || defaultPatient?.rut || (patients[0]?.rut ?? ""),
    phase: treatment?.phase || "",
    procedure: treatment?.procedure || "",
    status: treatment?.status || "Pendiente" as const,
    date: treatment?.date || "",
    cost: treatment?.cost || "",
    dentist: treatment?.dentist || "",
    paid: treatment?.paid ?? false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.patientRut) { setError("Selecciona un paciente"); return; }
    setError("");
    setSaving(true);
    try { await onSave(form); }
    catch (err: any) { setError(err.message || "Error al guardar"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{treatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <select value={form.patientRut} onChange={e => setForm({ ...form, patientRut: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {patients.map(p => <option key={p.rut} value={p.rut}>{p.name} ({p.rut})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
            <input value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento</label>
            <input value={form.procedure} onChange={e => setForm({ ...form, procedure: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Dentista a cargo</label>
            <input value={form.dentist} onChange={e => setForm({ ...form, dentist: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
              <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="$150.000"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {TREATMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">¿El paciente ya pagó?</p>
              <p className="text-xs text-gray-500">Actualiza el saldo pendiente del paciente</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, paid: !form.paid })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${form.paid ? "bg-green-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.paid ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || patients.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" />Guardando...</> : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
