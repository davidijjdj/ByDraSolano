"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { getTreatments, getAgendaConfig, getAppointments, addAppointment, updateAppointment, updateUser, calculateAge, Treatment, AgendaConfig, Appointment } from "@/lib/auth";
import {
  User, Calendar, ClipboardList, CreditCard, CheckCircle2, Clock, AlertCircle,
  Edit3, Save, X, Stethoscope, Pill, Info, Cake,
  CalendarPlus, CalendarCheck, CalendarX
} from "lucide-react";

const DENTISTS = ["Dr. Andrés Pérez", "Dra. Camila Rojas", "Dr. Felipe Martínez", "Dra. Valentina López"];
const TREATMENT_TYPES = ["Revisión General", "Limpieza Dental", "Obturación", "Endodoncia", "Extracción", "Blanqueamiento", "Ortodoncia", "Prótesis Dental", "Otro"];

function generateTimeSlots(start: string, end: string, bookedTimes: string[]): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  while (current < endTotal) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    if (!bookedTimes.includes(timeStr)) slots.push(timeStr);
    current += 30;
  }
  return slots;
}

export default function PatientDashboardContent() {
  return (
    <ProtectedRoute>
      <PatientDashboardInner />
    </ProtectedRoute>
  );
}

function PatientDashboardInner() {
  const { user, refreshUser } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [agenda, setAgenda] = useState<AgendaConfig | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    birthDate: user?.birthDate || "",
    diseases: user?.diseases || "",
    allergies: user?.allergies || "",
    phone: user?.phone || "",
  });
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    dentist: DENTISTS[0],
    treatment: TREATMENT_TYPES[0],
    notes: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
  if (!user) return;
  (async () => {
    setTreatments(await getTreatments(user.rut));
    setAgenda(await getAgendaConfig());
    setAppointments(await getAppointments(user.rut));
    setProfileForm({
      birthDate: user.birthDate || "",
      diseases: user.diseases || "",
      allergies: user.allergies || "",
      phone: user.phone || "",
    });
  })();
}, [user]);

const handleSaveProfile = async () => {
  if (!user) return;
  await updateUser(user.rut, {
    birthDate: profileForm.birthDate,
    diseases: profileForm.diseases,
    allergies: profileForm.allergies,
    phone: profileForm.phone,
  });
  await refreshUser();
  setEditingProfile(false);
};

const handleBookAppointment = async () => {
  if (!user || !agenda) return;
  setBookingError("");
  setBookingSuccess(false);

  if (!bookingForm.date) { setBookingError("Selecciona una fecha"); return; }
  if (!bookingForm.time) { setBookingError("Selecciona una hora"); return; }
  if (agenda.disabledDates.includes(bookingForm.date)) { setBookingError("Esta fecha no está disponible"); return; }

  const allAppts = await getAppointments();
  const isBooked = allAppts.some(a => a.date === bookingForm.date && a.time === bookingForm.time && a.dentist === bookingForm.dentist && a.status !== "Cancelada");
  if (isBooked) { setBookingError("Este horario ya está reservado con este dentista"); return; }

  await addAppointment({
    patientRut: user.rut,
    patientName: user.name,
    date: bookingForm.date,
    time: bookingForm.time,
    dentist: bookingForm.dentist,
    treatment: bookingForm.treatment,
    notes: bookingForm.notes,
    status: "Pendiente",
  });

  setAppointments(await getAppointments(user.rut));
  setBookingSuccess(true);
  setBookingForm({ date: "", time: "", dentist: DENTISTS[0], treatment: TREATMENT_TYPES[0], notes: "" });
  setTimeout(() => setBookingSuccess(false), 3000);
};

const handleCancelAppointment = async (id: string) => {
  if (confirm("¿Cancelar esta cita?")) {
    await updateAppointment(id, { status: "Cancelada" });
    setAppointments(await getAppointments(user?.rut));
  }
};

  const completed = treatments.filter((t) => t.status === "Completado").length;
  const total = treatments.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const age = user?.birthDate ? calculateAge(user.birthDate) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completado": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "En Progreso": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "Pendiente": return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completado": return "bg-green-50 text-green-700 border-green-200";
      case "En Progreso": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Pendiente": return "bg-gray-50 text-gray-600 border-gray-200";
      default: return "";
    }
  };

  const getApptStatusStyle = (status: string) => {
    switch (status) {
      case "Confirmada": return "bg-green-50 text-green-700 border-green-200";
      case "Pendiente": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Cancelada": return "bg-red-50 text-red-700 border-red-200";
      case "Completada": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const bookedTimesForDate = appointments
    .filter(a => a.date === bookingForm.date && a.status !== "Cancelada")
    .map(a => a.time);
  const availableSlots = agenda ? generateTimeSlots(agenda.workHours.start, agenda.workHours.end, bookedTimesForDate) : [];

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Panel de Paciente</h1>
            <p className="text-gray-600">Bienvenido de vuelta, {user.name}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" /> Mis Datos Personales
              </h2>
              <button onClick={() => editingProfile ? setEditingProfile(false) : setEditingProfile(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                {editingProfile ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {editingProfile ? "Cancelar" : "Editar"}
              </button>
            </div>
            {editingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={user.name} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">RUT</label><input type="text" value={user.rut} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label><input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Enfermedades</label><textarea value={profileForm.diseases} onChange={(e) => setProfileForm({ ...profileForm, diseases: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Pill className="h-4 w-4" /> Alergias</label><textarea value={profileForm.allergies} onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                <div className="md:col-span-2"><button onClick={handleSaveProfile} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"><Save className="h-4 w-4" /> Guardar Cambios</button></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase tracking-wide">Nombre</p><p className="font-medium text-gray-900">{user.name}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase tracking-wide">RUT</p><p className="font-medium text-gray-900">{user.rut}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Cake className="h-3 w-3" /> Nacimiento</p><p className="font-medium text-gray-900">{user.birthDate || "No especificado"}</p>{age !== null && <p className="text-sm text-primary-600">{age} años</p>}</div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p><p className="font-medium text-gray-900">{user.phone || "No especificado"}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2"><p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Enfermedades</p><p className="font-medium text-gray-900">{user.diseases || "Ninguna registrada"}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2"><p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Pill className="h-3 w-3" /> Alergias</p><p className="font-medium text-gray-900">{user.allergies || "Ninguna registrada"}</p></div>
              </div>
            )}
          </div>

          <div className={`rounded-xl p-4 mb-8 flex items-center gap-3 ${agenda?.enabled ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <Info className={`h-5 w-5 ${agenda?.enabled ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className={`font-medium ${agenda?.enabled ? "text-green-800" : "text-red-800"}`}>
                {agenda?.enabled ? "La clínica está recibiendo citas" : "La clínica no está recibiendo citas en este momento"}
              </p>
              {agenda?.disabledReason && <p className="text-sm text-red-600 mt-0.5">{agenda.disabledReason}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary-600" /> Mis Citas</h2>
              {agenda?.enabled && (
                <button onClick={() => setShowBookingForm(!showBookingForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <CalendarPlus className="h-4 w-4" /> {showBookingForm ? "Cerrar" : "Agendar Cita"}
                </button>
              )}
            </div>

            {showBookingForm && agenda?.enabled && (
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Cita</h3>
                {bookingError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{bookingError}</div>}
                {bookingSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> ¡Cita agendada exitosamente!</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input type="date" min={today} value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value, time: "" })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {bookingForm.date && agenda.disabledDates.includes(bookingForm.date) && <p className="text-xs text-red-600 mt-1">Fecha no disponible</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <select value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={!bookingForm.date || agenda.disabledDates.includes(bookingForm.date)}>
                      <option value="">Seleccionar hora</option>
                      {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {bookingForm.date && availableSlots.length === 0 && !agenda.disabledDates.includes(bookingForm.date) && <p className="text-xs text-red-600 mt-1">No hay horarios disponibles</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dentista</label>
                    <select value={bookingForm.dentist} onChange={(e) => setBookingForm({ ...bookingForm, dentist: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {DENTISTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                    <select value={bookingForm.treatment} onChange={(e) => setBookingForm({ ...bookingForm, treatment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                    <textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Alguna observación para el dentista..."
                      rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                  </div>
                </div>
                <div className="mt-4">
                  <button onClick={handleBookAppointment}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    <CalendarPlus className="h-4 w-4" /> Confirmar Cita
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha / Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dentista</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No tienes citas agendadas. {agenda?.enabled && "¡Agenda tu primera cita!"}</td></tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{appt.date}</div>
                          <div className="text-sm text-gray-500">{appt.time} hrs</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{appt.dentist}</td>
                        <td className="px-6 py-4 text-gray-600">{appt.treatment}</td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{appt.notes || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getApptStatusStyle(appt.status)}`}>
                            {appt.status === "Confirmada" ? <CheckCircle2 className="h-3 w-3" /> : appt.status === "Pendiente" ? <Clock className="h-3 w-3" /> : appt.status === "Cancelada" ? <CalendarX className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {appt.status !== "Cancelada" && appt.status !== "Completada" && (
                            <button onClick={() => handleCancelAppointment(appt.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium">Cancelar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"><User className="h-6 w-6 text-primary-600" /></div>
                <div><p className="text-sm text-gray-500">Paciente</p><p className="font-semibold text-gray-900">{user.name}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Calendar className="h-6 w-6 text-green-600" /></div>
                <div><p className="text-sm text-gray-500">Próxima Cita</p><p className="font-semibold text-gray-900">
                  {appointments.filter(a => a.status === "Pendiente" || a.status === "Confirmada").length > 0
                    ? appointments.filter(a => a.status === "Pendiente" || a.status === "Confirmada")[0].date + " " + appointments.filter(a => a.status === "Pendiente" || a.status === "Confirmada")[0].time
                    : (agenda?.enabled ? "Sin citas" : "Agenda cerrada")}
                </p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><ClipboardList className="h-6 w-6 text-yellow-600" /></div>
                <div><p className="text-sm text-gray-500">Progreso</p><p className="font-semibold text-gray-900">{completed} de {total} fases</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><CreditCard className="h-6 w-6 text-purple-600" /></div>
                <div><p className="text-sm text-gray-500">Saldo Pendiente</p><p className="font-semibold text-gray-900">
                  ${treatments.filter(t => t.status !== "Completado").reduce((acc, t) => acc + parseInt(t.cost.replace(/[^0-9]/g, "")), 0).toLocaleString("es-CL")}
                </p></div>
              </div>
            </div>
          </div>

          {total > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Progreso del Plan de Tratamiento</h3>
                <span className="text-sm font-medium text-primary-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-primary-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-gray-500 mt-2">Has completado {completed} de {total} fases</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Plan de Tratamiento</h2>
              <p className="text-sm text-gray-500 mt-1">Detalle de cada fase de tu tratamiento dental</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fase</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Procedimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dentista</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Costo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {treatments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No tienes tratamientos asignados. Contacta a tu dentista.</td></tr>
                  ) : (
                    treatments.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.phase}</td>
                        <td className="px-6 py-4 text-gray-600">{item.procedure}</td>
                        <td className="px-6 py-4 text-gray-600">{item.dentist}</td>
                        <td className="px-6 py-4 text-gray-600">{item.date}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.cost}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                            {getStatusIcon(item.status)} {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}