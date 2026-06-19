"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
  getUsers, getTestimonials, getTreatments, getAgendaConfig, getAppointments,
  saveTestimonials, saveTreatments, saveAgendaConfig,
  addTestimonial, updateTestimonial, deleteTestimonial,
  addTreatment, updateTreatment, deleteTreatment,
  updateUser, calculateAge, Testimonial, Treatment, AgendaConfig, User, Appointment
} from "@/lib/auth";
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare, ClipboardList,
  Settings, Search, Plus, Edit3, Trash2, Save, X, CheckCircle2, Clock,
  AlertCircle, Star, ToggleLeft, ToggleRight, Sun, Moon,
  Cake, Stethoscope, Pill, CalendarCheck, CalendarX
} from "lucide-react";

type Tab = "dashboard" | "agenda" | "citas" | "pacientes" | "testimonios" | "tratamientos" | "usuarios";

export default function AdminContent() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminInner />
    </ProtectedRoute>
  );
}

function AdminInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [patients, setPatients] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agenda, setAgenda] = useState<AgendaConfig>({ enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"" | "testimonial" | "treatment" | "patient" | "agenda" | "user">("");
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const users = getUsers();
    setAllUsers(users);
    setPatients(users.filter((u) => u.role === "paciente"));
    setTestimonials(getTestimonials());
    setTreatments(getTreatments());
    setAgenda(getAgendaConfig());
    setAppointments(getAppointments());
  };

  const sidebarItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda" as Tab, label: "Agenda", icon: CalendarDays },
    { id: "citas" as Tab, label: "Citas", icon: CalendarCheck },
    { id: "pacientes" as Tab, label: "Pacientes", icon: Users },
    { id: "testimonios" as Tab, label: "Testimonios", icon: MessageSquare },
    { id: "tratamientos" as Tab, label: "Tratamientos", icon: ClipboardList },
    { id: "usuarios" as Tab, label: "Usuarios", icon: Users },
  ];

  const stats = {
    totalUsers: allUsers.length,
    totalAppointments: appointments.length,
    totalPatients: patients.length,
    totalTestimonials: testimonials.length,
    totalTreatments: treatments.length,
    completedTreatments: treatments.filter((t) => t.status === "Completado").length,
    pendingTreatments: treatments.filter((t) => t.status === "Pendiente").length,
    inProgressTreatments: treatments.filter((t) => t.status === "En Progreso").length,
  };

  const openModal = (type: typeof modalType, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType("");
    setEditingItem(null);
  };

  const handleSaveTestimonial = (data: any) => {
    if (editingItem?.id) updateTestimonial(editingItem.id, data);
    else addTestimonial(data);
    setTestimonials(getTestimonials());
    closeModal();
  };

  const handleDeleteTestimonial = (id: string) => {
    if (confirm("¿Eliminar este testimonio?")) {
      deleteTestimonial(id);
      setTestimonials(getTestimonials());
    }
  };

  const handleSaveTreatment = (data: any) => {
    if (editingItem?.id) updateTreatment(editingItem.id, data);
    else addTreatment(data);
    setTreatments(getTreatments());
    closeModal();
  };

  const handleDeleteTreatment = (id: string) => {
    if (confirm("¿Eliminar este tratamiento?")) {
      deleteTreatment(id);
      setTreatments(getTreatments());
    }
  };

  const handleSaveAgenda = (config: AgendaConfig) => {
    saveAgendaConfig(config);
    setAgenda(getAgendaConfig());
    closeModal();
  };

  const handleSavePatient = (rut: string, data: Partial<User>) => {
    updateUser(rut, data);
    const users = getUsers();
    setAllUsers(users);
    setPatients(users.filter((u) => u.role === "paciente"));
    closeModal();
  };

  const handleConfirmAppointment = (id: string) => {
    const { updateAppointment } = require("@/lib/auth");
    updateAppointment(id, { status: "Confirmada" });
    setAppointments(getAppointments());
  };

  const handleCompleteAppointment = (id: string) => {
    const { updateAppointment } = require("@/lib/auth");
    updateAppointment(id, { status: "Completada" });
    setAppointments(getAppointments());
  };

  const handleCancelAppointment = (id: string) => {
    if (confirm("¿Cancelar esta cita?")) {
      const { updateAppointment } = require("@/lib/auth");
      updateAppointment(id, { status: "Cancelada" });
      setAppointments(getAppointments());
    }
  };

  const handleDeleteAppointment = (id: string) => {
    if (confirm("¿Eliminar esta cita permanentemente?")) {
      const { deleteAppointment } = require("@/lib/auth");
      deleteAppointment(id);
      setAppointments(getAppointments());
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut.includes(searchTerm)
  );

  const filteredTestimonials = testimonials.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTreatments = treatments.filter((t) =>
    t.patientRut.includes(searchTerm) ||
    t.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.procedure.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter((a) =>
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patientRut.includes(searchTerm) ||
    a.dentist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.treatment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rut.includes(searchTerm) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex">
        <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 hidden md:flex flex-col`}>
          <div className="p-4 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <LayoutDashboard className="h-5 w-5 text-gray-600" />
              {sidebarOpen && <span className="ml-2 font-semibold text-gray-900">Panel Admin</span>}
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="h-4 w-4 text-primary-600" />
              </div>
              {sidebarOpen && <div className="text-sm"><p className="font-medium text-gray-900">{user?.name}</p><p className="text-xs text-gray-500">Admin</p></div>}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Gestiona pacientes, testimonios, tratamientos y operaciones de la clínica</p>
            </div>

            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Usuarios" value={stats.totalUsers} color="blue" />
                  <StatCard label="Citas" value={stats.totalAppointments} color="green" />
                  <StatCard label="Pacientes" value={stats.totalPatients} color="purple" />
                  <StatCard label="Tratamientos" value={stats.totalTreatments} color="indigo" />
                  <StatCard label="Completados" value={stats.completedTreatments} color="green" />
                  <StatCard label="En Progreso" value={stats.inProgressTreatments} color="yellow" />
                  <StatCard label="Pendientes" value={stats.pendingTreatments} color="orange" />
                  <StatCard label="Testimonios" value={stats.totalTestimonials} color="pink" />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Agenda</h3>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${agenda.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {agenda.enabled ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">{agenda.enabled ? "Clínica abierta para citas" : "Clínica cerrada para citas"}</span>
                  </div>
                  {agenda.disabledReason && <p className="mt-2 text-sm text-red-600">{agenda.disabledReason}</p>}
                  <p className="mt-3 text-sm text-gray-500">Horario: {agenda.workHours.start} - {agenda.workHours.end}</p>
                </div>
              </>
            )}

            {activeTab === "agenda" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Configuración de Agenda</h2>
                  <button onClick={() => openModal("agenda", agenda)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Edit3 className="h-4 w-4" /> Editar Configuración
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium text-gray-900">Estado de la Agenda</p><p className="text-sm text-gray-500">Permite o bloquea la toma de citas</p></div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${agenda.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {agenda.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      <span className="font-medium">{agenda.enabled ? "Abierta" : "Cerrada"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 flex items-center gap-2"><Sun className="h-4 w-4" /> Hora de Apertura</p>
                      <p className="text-2xl font-bold text-primary-600 mt-1">{agenda.workHours.start}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 flex items-center gap-2"><Moon className="h-4 w-4" /> Hora de Cierre</p>
                      <p className="text-2xl font-bold text-primary-600 mt-1">{agenda.workHours.end}</p>
                    </div>
                  </div>
                  {agenda.disabledReason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Motivo de cierre:</p>
                      <p className="text-red-700 mt-1">{agenda.disabledReason}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">Fechas Deshabilitadas</p>
                    {agenda.disabledDates.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay fechas deshabilitadas</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {agenda.disabledDates.map((d, i) => (
                          <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "citas" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary-600" /> Citas Agendadas</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Buscar cita..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RUT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha / Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dentista</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notas</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAppointments.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{a.patientName}</td>
                          <td className="px-6 py-4 text-gray-600">{a.patientRut}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="font-medium">{a.date}</div>
                            <div className="text-sm text-gray-500">{a.time} hrs</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{a.dentist}</td>
                          <td className="px-6 py-4 text-gray-600">{a.treatment}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{a.notes || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              a.status === "Confirmada" ? "bg-green-50 text-green-700 border-green-200" :
                              a.status === "Pendiente" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              a.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {a.status === "Confirmada" ? <CheckCircle2 className="h-3 w-3" /> : a.status === "Pendiente" ? <Clock className="h-3 w-3" /> : a.status === "Cancelada" ? <CalendarX className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {a.status === "Pendiente" && (
                                <button onClick={() => handleConfirmAppointment(a.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Confirmar"><CheckCircle2 className="h-4 w-4" /></button>
                              )}
                              {(a.status === "Pendiente" || a.status === "Confirmada") && (
                                <button onClick={() => handleCompleteAppointment(a.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Completar"><CheckCircle2 className="h-4 w-4" /></button>
                              )}
                              {(a.status === "Pendiente" || a.status === "Confirmada") && (
                                <button onClick={() => handleCancelAppointment(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar"><CalendarX className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => handleDeleteAppointment(a.id)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAppointments.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron citas.</div>}
              </div>
            )}

            {activeTab === "pacientes" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Pacientes Registrados</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Buscar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RUT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nacimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enfermedades</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alergias</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPatients.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                          <td className="px-6 py-4 text-gray-600">{p.rut}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <div>{p.birthDate || "-"}</div>
                            {p.birthDate && <div className="text-sm text-primary-600">{calculateAge(p.birthDate)} años</div>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div>{p.phone || "-"}</div>
                            <div className="text-sm text-gray-400">{p.email}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{p.diseases || "Ninguna"}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{p.allergies || "Ninguna"}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => openModal("patient", p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver / Editar">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPatients.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron pacientes.</div>}
              </div>
            )}

            {activeTab === "testimonios" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Testimonios</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <button onClick={() => openModal("testimonial")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      <Plus className="h-4 w-4" /> Nuevo
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Texto</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTestimonials.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                          <td className="px-6 py-4 text-gray-600">{t.role}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-0.5">
                              {Array.from({ length: t.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-md truncate">{t.text}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openModal("testimonial", t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteTestimonial(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTestimonials.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron testimonios.</div>}
              </div>
            )}

            {activeTab === "tratamientos" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Tratamientos</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <button onClick={() => openModal("treatment")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      <Plus className="h-4 w-4" /> Nuevo
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente (RUT)</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fase</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Procedimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dentista</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Costo</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTreatments.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{t.patientRut}</td>
                          <td className="px-6 py-4 text-gray-600">{t.phase}</td>
                          <td className="px-6 py-4 text-gray-600">{t.procedure}</td>
                          <td className="px-6 py-4 text-gray-600">{t.dentist}</td>
                          <td className="px-6 py-4 text-gray-600">{t.date}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{t.cost}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              t.status === "Completado" ? "bg-green-50 text-green-700 border-green-200" :
                              t.status === "En Progreso" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                              {t.status === "Completado" ? <CheckCircle2 className="h-3 w-3" /> : t.status === "En Progreso" ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openModal("treatment", t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteTreatment(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTreatments.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron tratamientos.</div>}
              </div>
            )}

            {activeTab === "usuarios" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios y Permisos</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RUT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Registro</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 text-gray-600">{u.rut}</td>
                          <td className="px-6 py-4 text-gray-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {u.role === "admin" ? "Administrador" : "Paciente"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{new Date(u.createdAt).toLocaleDateString("es-CL")}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => openModal("user", u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar permisos">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron usuarios.</div>}
              </div>
            )}
          </div>
        </main>
      </div>

      {modalOpen && modalType === "testimonial" && (
        <TestimonialModal item={editingItem} onClose={closeModal} onSave={handleSaveTestimonial} />
      )}
      {modalOpen && modalType === "treatment" && (
        <TreatmentModal item={editingItem} patients={patients} onClose={closeModal} onSave={handleSaveTreatment} />
      )}
      {modalOpen && modalType === "agenda" && (
        <AgendaModal config={editingItem} onClose={closeModal} onSave={handleSaveAgenda} />
      )}
      {modalOpen && modalType === "patient" && (
        <PatientEditModal patient={editingItem} onClose={closeModal} onSave={handleSavePatient} />
      )}
      {modalOpen && modalType === "user" && (
        <UserRoleModal user={editingItem} onClose={closeModal} onSave={(rut, role) => { updateUser(rut, { role }); const users = getUsers(); setAllUsers(users); setPatients(users.filter((u) => u.role === "paciente")); closeModal(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700", purple: "bg-purple-50 text-purple-700",
    indigo: "bg-indigo-50 text-indigo-700", green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700", orange: "bg-orange-50 text-orange-700",
    pink: "bg-pink-50 text-pink-700",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color] || "bg-gray-50 text-gray-700"}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function TestimonialModal({ item, onClose, onSave }: { item: Testimonial | null; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ name: item?.name || "", role: item?.role || "", rating: item?.rating || 5, text: item?.text || "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{item ? "Editar Testimonio" : "Nuevo Testimonio"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rol / Relación</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrellas</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Texto</label><textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TreatmentModal({ item, patients, onClose, onSave }: { item: Treatment | null; patients: User[]; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    patientRut: item?.patientRut || (patients[0]?.rut ?? ""), phase: item?.phase || "", procedure: item?.procedure || "",
    status: item?.status || "Pendiente", date: item?.date || "", cost: item?.cost || "", dentist: item?.dentist || "",
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{item ? "Editar Tratamiento" : "Nuevo Tratamiento"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Paciente (RUT)</label>
            <select value={form.patientRut} onChange={(e) => setForm({ ...form, patientRut: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {patients.map(p => <option key={p.rut} value={p.rut}>{p.name} ({p.rut})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Fase</label><input value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento</label><input value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Dentista</label><input value={form.dentist} onChange={(e) => setForm({ ...form, dentist: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label><input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="DD/MM/AAAA" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo</label><input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="$150.000" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AgendaModal({ config, onClose, onSave }: { config: AgendaConfig; onClose: () => void; onSave: (c: AgendaConfig) => void }) {
  const [form, setForm] = useState<AgendaConfig>({
    enabled: config?.enabled ?? true,
    disabledDates: config?.disabledDates ? [...config.disabledDates] : [],
    disabledReason: config?.disabledReason || "",
    workHours: { start: config?.workHours?.start || "09:00", end: config?.workHours?.end || "18:00" },
  });
  const [newDate, setNewDate] = useState("");

  const addDate = () => {
    if (newDate && !form.disabledDates.includes(newDate)) {
      setForm({ ...form, disabledDates: [...form.disabledDates, newDate] });
      setNewDate("");
    }
  };

  const removeDate = (d: string) => {
    setForm({ ...form, disabledDates: form.disabledDates.filter((x) => x !== d) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Configurar Agenda</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div><p className="font-medium text-gray-900">Agenda Abierta</p><p className="text-sm text-gray-500">Permite que los pacientes vean citas disponibles</p></div>
            <button onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.enabled ? "bg-primary-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {!form.enabled && (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cierre</label>
              <textarea value={form.disabledReason} onChange={(e) => setForm({ ...form, disabledReason: e.target.value })} rows={2} placeholder="Ej: Cierre por feriado, mantenimiento..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Apertura</label><input type="time" value={form.workHours.start} onChange={(e) => setForm({ ...form, workHours: { ...form.workHours, start: e.target.value } })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Cierre</label><input type="time" value={form.workHours.end} onChange={(e) => setForm({ ...form, workHours: { ...form.workHours, end: e.target.value } })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fechas Deshabilitadas</label>
            <div className="flex gap-2 mb-3">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={addDate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.disabledDates.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  {d}
                  <button onClick={() => removeDate(d)} className="hover:text-red-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {form.disabledDates.length === 0 && <p className="text-sm text-gray-400">No hay fechas deshabilitadas</p>}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

function PatientEditModal({ patient, onClose, onSave }: { patient: User; onClose: () => void; onSave: (rut: string, data: Partial<User>) => void }) {
  const [form, setForm] = useState({
    name: patient.name || "",
    email: patient.email || "",
    phone: patient.phone || "",
    birthDate: patient.birthDate || "",
    diseases: patient.diseases || "",
    allergies: patient.allergies || "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Editar Paciente</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RUT</label><input value={patient.rut} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Cake className="h-4 w-4" /> Fecha de Nacimiento</label>
            <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            {form.birthDate && <p className="text-sm text-primary-600 mt-1">{calculateAge(form.birthDate)} años</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Enfermedades</label>
            <textarea value={form.diseases} onChange={(e) => setForm({ ...form, diseases: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Pill className="h-4 w-4" /> Alergias</label>
            <textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(patient.rut, form)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

function UserRoleModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (rut: string, role: "admin" | "paciente") => void }) {
  const [role, setRole] = useState<"admin" | "paciente">(user.role);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Editar Permisos de Usuario</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Usuario</p>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.rut}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol / Permisos</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "paciente")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="paciente">Paciente (solo puede ver su panel)</option>
              <option value="admin">Administrador (acceso total al panel de admin)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {role === "admin"
                ? "Este usuario podrá gestionar pacientes, testimonios, tratamientos y la agenda."
                : "Este usuario solo podrá ver su propio plan de tratamiento y editar sus datos personales."}
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(user.rut, role)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}
