"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
  getUsers, getTestimonials, getTreatments, getAgendaConfig, getAppointments,
  addTestimonial, updateTestimonial, deleteTestimonial,
  addTreatment, updateTreatment, deleteTreatment,
  updateAppointment, deleteAppointment,
  updateUser, calculateAge, saveAgendaConfig,
  getAssignments, assignPatientToDoctor, removeAssignment,
  Testimonial, Treatment, AgendaConfig, User, Appointment, PatientAssignment
} from "@/lib/auth";
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare, ClipboardList,
  Settings, Search, Plus, Edit3, Trash2, Save, X, CheckCircle2, Clock,
  AlertCircle, Star, ToggleLeft, ToggleRight, Sun, Moon,
  Cake, Stethoscope, Pill, CalendarCheck, CalendarX, UserCheck, UserX
} from "lucide-react";

type Tab = "dashboard" | "agenda" | "citas" | "pacientes" | "testimonios" | "tratamientos" | "usuarios" | "doctores";

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
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agenda, setAgenda] = useState<AgendaConfig>({ enabled: true, enabledDates: [], closedReason: "", workHours: { start: "09:00", end: "18:00" } });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"" | "testimonial" | "treatment" | "patient" | "agenda" | "user">("");
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

const loadAllData = async () => {
  const [users, testimonialsData, treatmentsData, agendaData, appointmentsData, assignmentsData] = await Promise.all([
    getUsers(),
    getTestimonials(),
    getTreatments(),
    getAgendaConfig(),
    getAppointments(),
    getAssignments(),
  ]);
  setAllUsers(users);
  setPatients(users.filter((u) => u.role === "paciente"));
  setTestimonials(testimonialsData);
  setTreatments(treatmentsData);
  setAgenda(agendaData);
  setAppointments(appointmentsData);
  setAssignments(assignmentsData);
};

  const sidebarItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda" as Tab, label: "Agenda", icon: CalendarDays },
    { id: "citas" as Tab, label: "Citas", icon: CalendarCheck },
    { id: "pacientes" as Tab, label: "Pacientes", icon: Users },
    { id: "doctores" as Tab, label: "Doctores", icon: Stethoscope },
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

const handleSaveTestimonial = async (data: any) => {
  if (editingItem?.id) await updateTestimonial(editingItem.id, data);
  else await addTestimonial(data);
  setTestimonials(await getTestimonials());
  closeModal();
};

const handleDeleteTestimonial = async (id: string) => {
  if (confirm("¿Eliminar este testimonio?")) {
    await deleteTestimonial(id);
    setTestimonials(await getTestimonials());
  }
};

const handleSaveTreatment = async (data: any) => {
  if (editingItem?.id) await updateTreatment(editingItem.id, data);
  else await addTreatment(data);
  setTreatments(await getTreatments());
  closeModal();
};

const handleDeleteTreatment = async (id: string) => {
  if (confirm("¿Eliminar este tratamiento?")) {
    await deleteTreatment(id);
    setTreatments(await getTreatments());
  }
};

const handleSaveAgenda = async (config: AgendaConfig) => {
  await saveAgendaConfig(config);
  setAgenda(await getAgendaConfig());
  closeModal();
};

const handleSavePatient = async (rut: string, data: Partial<User>) => {
  await updateUser(rut, data);
  const users = await getUsers();
  setAllUsers(users);
  setPatients(users.filter((u) => u.role === "paciente"));
  closeModal();
};

const handleConfirmAppointment = async (id: string) => {
  await updateAppointment(id, { status: "Confirmada" });
  setAppointments(await getAppointments());
};

const handleCompleteAppointment = async (id: string) => {
  await updateAppointment(id, { status: "Completada" });
  setAppointments(await getAppointments());
};

const handleCancelAppointment = async (id: string) => {
  if (confirm("¿Cancelar esta cita?")) {
    await updateAppointment(id, { status: "Cancelada" });
    setAppointments(await getAppointments());
  }
};

const handleDeleteAppointment = async (id: string) => {
  if (confirm("¿Eliminar esta cita permanentemente?")) {
    await deleteAppointment(id);
    setAppointments(await getAppointments());
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
        {/* Sidebar — solo visible en md+ */}
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

        {/* Navegación inferior mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-1 py-1 shadow-lg">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors flex-1 ${
                activeTab === item.id ? "text-primary-600 bg-primary-50" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Gestiona pacientes, testimonios, tratamientos y operaciones de la clínica</p>
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
                  {agenda.closedReason && <p className="mt-2 text-sm text-red-600">{agenda.closedReason}</p>}
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
                  {agenda.closedReason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Motivo de cierre:</p>
                      <p className="text-red-700 mt-1">{agenda.closedReason}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">Fechas Habilitadas</p>
                    {agenda.enabledDates.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay fechas habilitadas. Los pacientes no podrán agendar hasta que habilites al menos una fecha.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {agenda.enabledDates.map((d, i) => (
                          <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "citas" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary-600" /> Citas Agendadas</h2>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Buscar cita..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                {/* Vista móvil: tarjetas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredAppointments.map((a) => (
                    <div key={a.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{a.patientName}</p>
                          <p className="text-xs text-gray-500">{a.patientRut}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                          a.status === "Confirmada" ? "bg-green-50 text-green-700 border-green-200" :
                          a.status === "Pendiente" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          a.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>{a.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-1">
                        <span><span className="font-medium">Fecha:</span> {a.date}</span>
                        <span><span className="font-medium">Hora:</span> {a.time} hrs</span>
                        <span><span className="font-medium">Dentista:</span> {a.dentist}</span>
                        <span><span className="font-medium">Motivo:</span> {a.treatment}</span>
                      </div>
                      {a.notes && <p className="text-xs text-gray-500 truncate">Notas: {a.notes}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        {a.status === "Pendiente" && (
                          <button onClick={() => handleConfirmAppointment(a.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-50 rounded-lg border border-green-200"><CheckCircle2 className="h-3 w-3" /> Confirmar</button>
                        )}
                        {(a.status === "Pendiente" || a.status === "Confirmada") && (
                          <button onClick={() => handleCompleteAppointment(a.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded-lg border border-blue-200"><CheckCircle2 className="h-3 w-3" /> Completar</button>
                        )}
                        {(a.status === "Pendiente" || a.status === "Confirmada") && (
                          <button onClick={() => handleCancelAppointment(a.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200"><CalendarX className="h-3 w-3" /> Cancelar</button>
                        )}
                        <button onClick={() => handleDeleteAppointment(a.id)} className="ml-auto p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista escritorio: tabla */}
                <div className="hidden md:block overflow-x-auto">
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
                {/* Vista móvil: tarjetas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredPatients.map((p) => (
                    <div key={p.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.rut}</p>
                        </div>
                        <button onClick={() => openModal("patient", p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex-shrink-0"><Edit3 className="h-4 w-4" /></button>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-1">
                        <span><span className="font-medium">Teléfono:</span> {p.phone || "-"}</span>
                        <span><span className="font-medium">Edad:</span> {p.birthDate ? `${calculateAge(p.birthDate)} años` : "-"}</span>
                        <span className="col-span-2 truncate"><span className="font-medium">Email:</span> {p.email}</span>
                        <span className="col-span-2 truncate"><span className="font-medium">Enfermedades:</span> {p.diseases || "Ninguna"}</span>
                        <span className="col-span-2 truncate"><span className="font-medium">Alergias:</span> {p.allergies || "Ninguna"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista escritorio: tabla */}
                <div className="hidden md:block overflow-x-auto">
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

            {activeTab === "doctores" && (
              <div className="space-y-6">
                <DoctorAssignmentPanel
                  patients={patients}
                  doctors={allUsers.filter(u => u.role === "doctor")}
                  assignments={assignments}
                  onAssign={async (patientRut, doctorRut) => {
                    await assignPatientToDoctor(patientRut, doctorRut);
                    setAssignments(await getAssignments());
                  }}
                  onRemove={async (patientRut) => {
                    await removeAssignment(patientRut);
                    setAssignments(await getAssignments());
                  }}
                />
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
                {/* Vista móvil: tarjetas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredTestimonials.map((t) => (
                    <div key={t.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.role}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openModal("testimonial", t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteTestimonial(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{t.text}</p>
                    </div>
                  ))}
                </div>

                {/* Vista escritorio: tabla */}
                <div className="hidden md:block overflow-x-auto">
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
                {/* Vista móvil: tarjetas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredTreatments.map((t) => (
                    <div key={t.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{t.procedure}</p>
                          <p className="text-xs text-gray-500">{t.patientRut}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                          t.status === "Completado" ? "bg-green-50 text-green-700 border-green-200" :
                          t.status === "En Progreso" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>{t.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-1">
                        <span><span className="font-medium">Fase:</span> {t.phase}</span>
                        <span><span className="font-medium">Fecha:</span> {t.date}</span>
                        <span><span className="font-medium">Dentista:</span> {t.dentist}</span>
                        <span><span className="font-medium">Costo:</span> {t.cost}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => openModal("treatment", t)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg border border-blue-200"><Edit3 className="h-3 w-3" /> Editar</button>
                        <button onClick={() => handleDeleteTreatment(t.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200"><Trash2 className="h-3 w-3" /> Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista escritorio: tabla */}
                <div className="hidden md:block overflow-x-auto">
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
                {/* Vista móvil: tarjetas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.rut}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>{u.role === "admin" ? "Admin" : "Paciente"}</span>
                          <button onClick={() => openModal("user", u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-gray-400">Registrado: {new Date(u.createdAt).toLocaleDateString("es-CL")}</p>
                    </div>
                  ))}
                </div>

                {/* Vista escritorio: tabla */}
                <div className="hidden md:block overflow-x-auto">
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
        <UserRoleModal
          user={editingItem}
          onClose={closeModal}
          onSave={async (rut, role) => {
            await updateUser(rut, { role });
            const users = await getUsers();
            setAllUsers(users);
            setPatients(users.filter((u) => u.role === "paciente"));
            closeModal();
          }}
        />
      )}

      {/* Barra de navegación inferior — solo visible en móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              activeTab === item.id ? "text-primary-600" : "text-gray-500"
            }`}
          >
            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-primary-600" : "text-gray-400"}`} />
            <span className="truncate w-full text-center px-0.5" style={{ fontSize: "9px" }}>{item.label}</span>
          </button>
        ))}
      </nav>
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
    enabledDates: config?.enabledDates ? [...config.enabledDates] : [],
    closedReason: config?.closedReason || "",
    workHours: { start: config?.workHours?.start || "09:00", end: config?.workHours?.end || "18:00" },
  });
  const [newDate, setNewDate] = useState("");

  const addDate = () => {
    if (newDate && !form.enabledDates.includes(newDate)) {
      setForm({ ...form, enabledDates: [...form.enabledDates, newDate].sort() });
      setNewDate("");
    }
  };

  const removeDate = (d: string) => {
    setForm({ ...form, enabledDates: form.enabledDates.filter((x) => x !== d) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Configurar Agenda</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">

          {/* Toggle global de agenda */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Agenda Abierta</p>
              <p className="text-sm text-gray-500">Activa para que los pacientes puedan agendar</p>
            </div>
            <button onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.enabled ? "bg-primary-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Motivo de cierre (solo si está cerrada) */}
          {!form.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cierre (opcional)</label>
              <textarea value={form.closedReason} onChange={(e) => setForm({ ...form, closedReason: e.target.value })} rows={2}
                placeholder="Ej: Cierre por feriado, vacaciones..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          )}

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora apertura</label>
              <input type="time" value={form.workHours.start} onChange={(e) => setForm({ ...form, workHours: { ...form.workHours, start: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora cierre</label>
              <input type="time" value={form.workHours.end} onChange={(e) => setForm({ ...form, workHours: { ...form.workHours, end: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Fechas habilitadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fechas habilitadas para citas</label>
            <p className="text-xs text-gray-400 mb-3">Solo los días que agregues aquí estarán disponibles para los pacientes.</p>
            <div className="flex gap-2 mb-3">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={addDate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {form.enabledDates.length === 0
                ? <p className="text-sm text-gray-400">Ninguna fecha habilitada — los pacientes no podrán agendar.</p>
                : form.enabledDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {d}
                    <button onClick={() => removeDate(d)} className="hover:text-green-900 ml-0.5"><X className="h-3 w-3" /></button>
                  </span>
                ))
              }
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

function UserRoleModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (rut: string, role: "admin" | "paciente" | "doctor") => void }) {
  const [role, setRole] = useState<"admin" | "paciente" | "doctor">(user.role);
  
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
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "paciente" | "doctor")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="paciente">Paciente — solo puede ver su panel</option>
              <option value="doctor">Doctor — gestiona pacientes asignados y tratamientos</option>
              <option value="admin">Administrador — acceso total al panel de admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {role === "admin"
                ? "Este usuario podrá gestionar pacientes, testimonios, tratamientos y la agenda."
                : role === "doctor"
                ? "Este usuario verá sus pacientes asignados y podrá crear y editar sus tratamientos."
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

function DoctorAssignmentPanel({
  patients, doctors, assignments, onAssign, onRemove
}: {
  patients: User[];
  doctors: User[];
  assignments: PatientAssignment[];
  onAssign: (patientRut: string, doctorRut: string) => void;
  onRemove: (patientRut: string) => void;
}) {
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.rut ?? "");
  const [saving, setSaving] = useState<string | null>(null);

  const getAssignedDoctor = (patientRut: string) =>
    assignments.find(a => a.patientRut === patientRut);

  const handleAssign = async (patientRut: string, doctorRut: string) => {
    setSaving(patientRut);
    await onAssign(patientRut, doctorRut);
    setSaving(null);
  };

  const handleRemove = async (patientRut: string) => {
    setSaving(patientRut);
    await onRemove(patientRut);
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de doctores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.length === 0 ? (
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <Stethoscope className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="font-medium text-yellow-800">No hay doctores registrados</p>
            <p className="text-sm text-yellow-600 mt-1">Pide al doctor que se registre en /register y luego cambia su rol a "doctor" desde la pestaña Usuarios.</p>
          </div>
        ) : doctors.map(doc => {
          const docPatients = assignments.filter(a => a.doctorRut === doc.rut);
          return (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {doc.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.rut}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-primary-600">{docPatients.length}</span> paciente{docPatients.length !== 1 ? "s" : ""} asignado{docPatients.length !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabla de asignaciones */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-gray-900">Asignar pacientes a doctores</h2>
          <p className="text-sm text-gray-400 mt-0.5">Cada paciente puede tener un doctor principal asignado.</p>
        </div>

        {patients.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No hay pacientes registrados.</div>
        ) : doctors.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Primero registra al menos un doctor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Doctor asignado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Asignar / Cambiar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map(p => {
                  const assignment = getAssignedDoctor(p.rut);
                  const assignedDoc = assignment ? doctors.find(d => d.rut === assignment.doctorRut) : null;
                  const isSaving = saving === p.rut;
                  return (
                    <tr key={p.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.rut}</div>
                      </td>
                      <td className="px-6 py-4">
                        {assignedDoc ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200">
                            <UserCheck className="h-3.5 w-3.5" /> {assignedDoc.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-sm border border-gray-200">
                            <UserX className="h-3.5 w-3.5" /> Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          defaultValue={assignment?.doctorRut ?? ""}
                          onChange={e => e.target.value && handleAssign(p.rut, e.target.value)}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          <option value="">Seleccionar doctor...</option>
                          {doctors.map(d => <option key={d.rut} value={d.rut}>{d.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {assignment && (
                          <button
                            onClick={() => handleRemove(p.rut)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? "..." : <><UserX className="h-3.5 w-3.5" /> Quitar</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}