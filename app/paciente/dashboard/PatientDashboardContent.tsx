"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
  getTreatments, getAgendaConfig, getAppointments, addAppointment,
  updateAppointment, updateUser, calculateAge, getPatientDoctor,
  Treatment, AgendaConfig, Appointment, User as UserType
} from "@/lib/auth";
import {
  User, Calendar, ClipboardList, CreditCard, CheckCircle2, Clock, AlertCircle,
  Edit3, Save, X, Stethoscope, Pill, Info, Cake,
  CalendarPlus, CalendarCheck, CalendarX, Loader2
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

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
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
  const [assignedDoctor, setAssignedDoctor] = useState<UserType | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [profileForm, setProfileForm] = useState({
    birthDate: user?.birthDate || "",
    diseases: user?.diseases || "",
    allergies: user?.allergies || "",
    phone: user?.phone || "",
  });
  const [bookingForm, setBookingForm] = useState({
    date: "", time: "", dentist: DENTISTS[0], treatment: TREATMENT_TYPES[0], notes: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setTreatments(await getTreatments(user.rut));
      setAgenda(await getAgendaConfig());
      setAppointments(await getAppointments(user.rut));
      const doctor = await getPatientDoctor(user.rut);
      setAssignedDoctor(doctor);
      if (doctor) {
        setBookingForm(prev => ({ ...prev, dentist: doctor.name }));
      }
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
    setSavingProfile(true);
    await updateUser(user.rut, {
      birthDate: profileForm.birthDate,
      diseases: profileForm.diseases,
      allergies: profileForm.allergies,
      phone: profileForm.phone,
    });
    await refreshUser();
    setSavingProfile(false);
    setEditingProfile(false);
  };

  const handleBookAppointment = async () => {
    if (!user || !agenda) return;
    setBookingError("");
    setBookingSuccess(false);
    if (!bookingForm.date) { setBookingError("Selecciona una fecha"); return; }
    if (!bookingForm.time) { setBookingError("Selecciona una hora"); return; }
    if (!agenda.enabledDates.includes(bookingForm.date)) { setBookingError("Esta fecha no está habilitada por la clínica"); return; }
    const allAppts = await getAppointments();
    const isBooked = allAppts.some(
      a => a.date === bookingForm.date && a.time === bookingForm.time &&
        a.dentist === bookingForm.dentist && a.status !== "Cancelada"
    );
    if (isBooked) { setBookingError("Este horario ya está reservado con este dentista"); return; }
    setSavingBooking(true);
    await addAppointment({
      patientRut: user.rut, patientName: user.name,
      date: bookingForm.date, time: bookingForm.time,
      dentist: bookingForm.dentist, treatment: bookingForm.treatment,
      notes: bookingForm.notes, status: "Pendiente",
    });
    setAppointments(await getAppointments(user.rut));
    setSavingBooking(false);
    setBookingSuccess(true);
    setBookingForm({ date: "", time: "", dentist: assignedDoctor?.name || "", treatment: TREATMENT_TYPES[0], notes: "" });
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
  const today = new Date().toISOString().split("T")[0];
  const bookedTimesForDate = appointments
    .filter(a => a.date === bookingForm.date && a.status !== "Cancelada")
    .map(a => a.time);
  const availableSlots = agenda
    ? generateTimeSlots(agenda.workHours.start, agenda.workHours.end, bookedTimesForDate)
    : [];
  const upcomingAppts = appointments.filter(
    a => a.status === "Pendiente" || a.status === "Confirmada"
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completado": return "bg-green-50 text-green-700 border-green-200";
      case "En Progreso": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* ── HEADER PERSONALIZADO ── */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-primary-200 text-sm mb-1">Bienvenido de vuelta</p>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">¡Hola, {user.name.split(" ")[0]}! 👋</h1>
              <p className="text-primary-100 text-sm mt-1">RUT: {user.rut}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-lg font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* ── RESUMEN EN TARJETAS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Paciente</p>
              <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Próxima cita</p>
              <p className="font-semibold text-gray-900 text-sm">
                {upcomingAppts.length > 0
                  ? `${upcomingAppts[0].date} · ${upcomingAppts[0].time}`
                  : agenda?.enabled ? "Sin citas" : "Agenda cerrada"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
                <ClipboardList className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Progreso</p>
              <p className="font-semibold text-gray-900 text-sm">{completed} de {total} fases</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo pendiente</p>
              <p className="font-semibold text-gray-900 text-sm">
                ${treatments.filter(t => t.status !== "Completado")
                  .reduce((acc, t) => acc + parseInt(t.cost.replace(/[^0-9]/g, "") || "0"), 0)
                  .toLocaleString("es-CL")}
              </p>
            </div>
          </div>

          {/* ── BARRA DE PROGRESO ── */}
          {total > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-gray-900">Progreso del plan de tratamiento</h3>
                <span className="text-sm font-semibold text-primary-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{completed} de {total} fases completadas</p>
            </div>
          )}

          {/* ── DATOS PERSONALES ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" /> Mis datos personales
              </h2>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
              >
                {editingProfile ? <><X className="h-4 w-4" /> Cancelar</> : <><Edit3 className="h-4 w-4" /> Editar</>}
              </button>
            </div>
            <div className="p-6">
              {editingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={user.name} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">RUT</label><input type="text" value={user.rut} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label><input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Enfermedades</label><textarea value={profileForm.diseases} onChange={(e) => setProfileForm({ ...profileForm, diseases: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Pill className="h-4 w-4" /> Alergias</label><textarea value={profileForm.allergies} onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                  <div className="md:col-span-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
                    >
                      {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface rounded-lg"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nombre</p><p className="font-medium text-gray-900">{user.name}</p></div>
                  <div className="p-4 bg-surface rounded-lg"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">RUT</p><p className="font-medium text-gray-900">{user.rut}</p></div>
                  <div className="p-4 bg-surface rounded-lg"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Cake className="h-3 w-3" /> Nacimiento</p><p className="font-medium text-gray-900">{user.birthDate || "No especificado"}</p>{age !== null && <p className="text-xs text-primary-600 mt-0.5">{age} años</p>}</div>
                  <div className="p-4 bg-surface rounded-lg"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Teléfono</p><p className="font-medium text-gray-900">{user.phone || "No especificado"}</p></div>
                  <div className="p-4 bg-surface rounded-lg md:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Enfermedades</p><p className="font-medium text-gray-900">{user.diseases || "Ninguna registrada"}</p></div>
                  <div className="p-4 bg-surface rounded-lg md:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Pill className="h-3 w-3" /> Alergias</p><p className="font-medium text-gray-900">{user.allergies || "Ninguna registrada"}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* ── ESTADO DE AGENDA ── */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${agenda?.enabled ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <Info className={`h-5 w-5 flex-shrink-0 ${agenda?.enabled ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className={`font-medium text-sm ${agenda?.enabled ? "text-green-800" : "text-red-800"}`}>
                {agenda?.enabled ? "La clínica está recibiendo citas" : "La clínica no está recibiendo citas en este momento"}
              </p>
              {agenda?.closedReason && <p className="text-xs text-red-600 mt-0.5">{agenda.closedReason}</p>}
            </div>
          </div>

          {/* ── CITAS ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary-600" /> Mis citas
              </h2>
              {agenda?.enabled && (
                <button
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {showBookingForm ? "Cerrar" : "Agendar cita"}
                </button>
              )}
            </div>

            {showBookingForm && agenda?.enabled && (
              <div className="p-6 bg-surface border-b border-gray-100">
                <h3 className="font-heading font-semibold text-gray-900 mb-4">Nueva cita</h3>
                {bookingError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{bookingError}</div>}
                {bookingSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> ¡Cita agendada exitosamente!</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <select
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value, time: "" })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selecciona una fecha</option>
                        {agenda.enabledDates
                          .filter((d) => d >= today)
                          .sort()
                          .map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                      </select>
                      {agenda.enabledDates.filter((d) => d >= today).length === 0 && (
                        <p className="text-xs text-red-600 mt-1">No hay fechas disponibles en este momento</p>
                      )}
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <select value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" disabled={!bookingForm.date || !agenda.enabledDates.includes(bookingForm.date)}>
                      <option value="">Seleccionar hora</option>
                      {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {bookingForm.date && availableSlots.length === 0 && !agenda.enabledDates.includes(bookingForm.date) && <p className="text-xs text-red-600 mt-1">No hay horarios disponibles</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctora a cargo</label>
                    {assignedDoctor ? (
                      <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {assignedDoctor.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{assignedDoctor.name}</span>
                          {assignedDoctor.specialty && (
                            <span className="text-xs text-primary-600 ml-2">{assignedDoctor.specialty}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full px-3 py-2 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-700">
                        No tienes un doctor asignado aún. Contacta a la clínica.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                    <select value={bookingForm.treatment} onChange={(e) => setBookingForm({ ...bookingForm, treatment: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                    <textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Alguna observación para el dentista..." rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleBookAppointment}
                    disabled={savingBooking || !assignedDoctor}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
                  >
                    {savingBooking ? <><Loader2 className="h-4 w-4 animate-spin" /> Agendando...</> : <><CalendarPlus className="h-4 w-4" /> Confirmar cita</>}
                  </button>
                </div>
              </div>
            )}

            {/* Vista mobile: tarjetas */}
            <div className="md:hidden divide-y divide-gray-100">
              {appointments.length === 0 ? (
                <p className="px-6 py-10 text-center text-gray-400 text-sm">No tienes citas agendadas.</p>
              ) : (
                appointments.map((appt) => (
                  <div key={appt.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{appt.treatment}</p>
                        <p className="text-xs text-gray-500">{appt.dentist}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getApptStatusStyle(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{appt.date} · {appt.time} hrs</p>
                    {appt.status !== "Cancelada" && appt.status !== "Completada" && (
                      <button onClick={() => handleCancelAppointment(appt.id)} className="text-xs text-red-600 font-medium">Cancelar cita</button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dentista</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Notas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">{agenda?.enabled ? "No tienes citas agendadas. ¡Agenda tu primera cita!" : "No tienes citas agendadas."}</td></tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{appt.date}</div>
                          <div className="text-sm text-gray-400">{appt.time} hrs</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{appt.dentist}</td>
                        <td className="px-6 py-4 text-gray-600">{appt.treatment}</td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{appt.notes || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getApptStatusStyle(appt.status)}`}>
                            {appt.status === "Confirmada" ? <CheckCircle2 className="h-3 w-3" /> : appt.status === "Pendiente" ? <Clock className="h-3 w-3" /> : appt.status === "Cancelada" ? <CalendarX className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {appt.status !== "Cancelada" && appt.status !== "Completada" && (
                            <button onClick={() => handleCancelAppointment(appt.id)} className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">Cancelar</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── PLAN DE TRATAMIENTO ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-heading font-semibold text-gray-900">Plan de tratamiento</h2>
              <p className="text-sm text-gray-400 mt-0.5">Detalle de cada fase de tu tratamiento dental</p>
            </div>

            {/* Vista mobile: tarjetas */}
            <div className="md:hidden divide-y divide-gray-100">
              {treatments.length === 0 ? (
                <p className="px-6 py-10 text-center text-gray-400 text-sm">No tienes tratamientos asignados.</p>
              ) : (
                treatments.map((item) => (
                  <div key={item.id} className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{item.procedure}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusStyle(item.status)}`}>{item.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">Fase: {item.phase} · {item.dentist}</p>
                    <p className="text-xs text-gray-500">{item.date} · <span className="font-medium text-gray-700">{item.cost}</span></p>
                  </div>
                ))
              )}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fase</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Procedimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dentista</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Costo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {treatments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No tienes tratamientos asignados. Contacta a tu dentista.</td></tr>
                  ) : (
                    treatments.map((item) => (
                      <tr key={item.id} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.phase}</td>
                        <td className="px-6 py-4 text-gray-600">{item.procedure}</td>
                        <td className="px-6 py-4 text-gray-600">{item.dentist}</td>
                        <td className="px-6 py-4 text-gray-600">{item.date}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.cost}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                            {item.status === "Completado" ? <CheckCircle2 className="h-3 w-3" /> : item.status === "En Progreso" ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {item.status}
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