import { supabase } from "./supabase";

export interface User {
  id: string;
  rut: string;
  password: string;
  role: "admin" | "paciente";
  name: string;
  email: string;
  birthDate?: string;
  diseases?: string;
  allergies?: string;
  phone?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
}

export interface Treatment {
  id: string;
  patientRut: string;
  phase: string;
  procedure: string;
  status: "Completado" | "En Progreso" | "Pendiente";
  date: string;
  cost: string;
  dentist: string;
}

export interface Appointment {
  id: string;
  patientRut: string;
  patientName: string;
  date: string;
  time: string;
  dentist: string;
  treatment: string;
  notes: string;
  status: "Pendiente" | "Confirmada" | "Cancelada" | "Completada";
  createdAt: string;
}

export interface AgendaConfig {
  enabled: boolean;
  disabledDates: string[];
  disabledReason: string;
  workHours: { start: string; end: string };
}

// ─── FUNCIONES DE AYUDA (CÁLCULOS LOCALES) ───
export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1).toUpperCase();
  let formatted = "";
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted;
    count++;
    if (count === 3 && i !== 0) {
      formatted = "." + formatted;
      count = 0;
    }
  }
  return formatted + "-" + verifier;
}

export function isValidRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1).toUpperCase();
  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const rem = sum % 11;
  const calc = rem === 0 ? "0" : rem === 1 ? "K" : (11 - rem).toString();
  return verifier === calc;
}

// ─── AUTENTICACIÓN Y SESIÓN (BBDD Y MEMORIA DE SESIÓN) ───
export async function registerUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  // Verificamos si el RUT ya existe en Supabase
  const { data: existingUser } = await supabase
    .from("perfiles")
    .select("id")
    .eq("rut", user.rut)
    .single();

  if (existingUser) throw new Error("Ya existe un usuario con este RUT");

  const { data, error } = await supabase
    .from("perfiles")
    .insert([{
      nombre_completo: user.name,
      rut: user.rut,
      email: user.email,
      telefono: user.phone,
      fecha_nacimiento: user.birthDate,
      enfermedades: user.diseases,
      alergias: user.allergies,
      rol: user.role,
      password: user.password // Nota: En entornos reales se encripta, útil para tu prototipo actual
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    rut: data.rut,
    password: data.password,
    role: data.rol,
    name: data.nombre_completo,
    email: data.email,
    birthDate: data.fecha_nacimiento,
    diseases: data.enfermedades,
    allergies: data.alergias,
    phone: data.telefono,
    createdAt: data.created_at
  };
}

export async function login(rut: string, password: string): Promise<Session> {
  const { data: profile, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("rut", rut)
    .single();

  if (error || !profile || profile.password !== password) {
    throw new Error("RUT o contraseña incorrectos");
  }

  const user: User = {
    id: profile.id,
    rut: profile.rut,
    password: profile.password,
    role: profile.rol,
    name: profile.nombre_completo,
    email: profile.email,
    birthDate: profile.fecha_nacimiento,
    diseases: profile.enfermedades,
    allergies: profile.alergias,
    phone: profile.telefono,
    createdAt: profile.created_at
  };

  const session: Session = {
    user,
    token: `token-${Date.now()}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("cd_session", JSON.stringify(session));
  }

  return session;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cd_session");
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("cd_session");
  if (!data) return null;
  const session: Session = JSON.parse(data);
  if (Date.now() > session.expiresAt) { logout(); return null; }
  return session;
}

export function isAuthenticated(): boolean { return getSession() !== null; }
export function isAdmin(): boolean { return getSession()?.user.role === "admin"; }

// ─── TREATMENTS (CONSULTAS REALES A SUPABASE) ───
export async function getTreatments(patientRut?: string): Promise<Treatment[]> {
  let query = supabase.from("tratamientos").select(`
    id, phase, procedimiento, estado, fecha, costo,
    paciente:perfiles!paciente_id(rut, nombre_completo),
    dentista:perfiles!dentista_id(nombre_completo)
  `);

  if (patientRut) {
    // Primero buscamos el ID interno UUID del perfil usando el RUT
    const { data: p } = await supabase.from("perfiles").select("id").eq("rut", patientRut).single();
    if (p) query = query.eq("paciente_id", p.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((t: any) => ({
    id: t.id,
    patientRut: t.paciente?.rut || "",
    phase: t.phase,
    procedure: t.procedimiento,
    status: t.estado,
    date: t.fecha || "",
    cost: t.costo ? `$${t.costo.toLocaleString("es-CL")}` : "$0",
    dentist: t.dentista?.nombre_completo || "Por asignar"
  }));
}

export async function addTreatment(t: Omit<Treatment, "id">): Promise<void> {
  const { data: p } = await supabase.from("perfiles").select("id").eq("rut", t.patientRut).single();
  if (!p) return;

  const numericCost = parseInt(t.cost.replace(/[^0-9]/g, "")) || 0;

  await supabase.from("tratamientos").insert([{
    paciente_id: p.id,
    phase: t.phase,
    procedimiento: t.procedure,
    estado: t.status,
    fecha: t.date,
    costo: numericCost
  }]);
}

// ─── APPOINTMENTS (CONSULTAS REALES A SUPABASE) ───
export async function getAppointments(patientRut?: string): Promise<Appointment[]> {
  let query = supabase.from("citas").select(`
    id, fecha_hora, motivo, notas, estado, created_at,
    paciente:perfiles!paciente_id(rut, nombre_completo)
  `);

  if (patientRut) {
    const { data: p } = await supabase.from("perfiles").select("id").eq("rut", patientRut).single();
    if (p) query = query.eq("paciente_id", p.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((a: any) => {
    const fullDate = new Date(a.fecha_hora);
    return {
      id: a.id,
      patientRut: a.paciente?.rut || "",
      patientName: a.paciente?.nombre_completo || "",
      date: fullDate.toISOString().split("T")[0],
      time: fullDate.toTimeString().slice(0, 5),
      dentist: "Dr. Asignado de Turno", // Puedes expandirlo enlazando el dentista_id si lo necesitas
      treatment: a.motivo,
      notes: a.notas || "",
      status: a.estado,
      createdAt: a.created_at
    };
  }).sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());
}

export async function addAppointment(a: Omit<Appointment, "id" | "createdAt">): Promise<void> {
  const { data: p } = await supabase.from("perfiles").select("id").eq("rut", a.patientRut).single();
  if (!p) return;

  const combinedDateTime = `${a.date}T${a.time}:00Z`;

  await supabase.from("citas").insert([{
    paciente_id: p.id,
    fecha_hora: combinedDateTime,
    motivo: a.treatment,
    notas: a.notes,
    estado: a.status
  }]);
}

export async function updateAppointment(id: string, a: Partial<Appointment>): Promise<void> {
  const updates: any = {};
  if (a.status) updates.estado = a.status;
  if (a.notes) updates.notas = a.notes;
  if (a.date && a.time) updates.fecha_hora = `${a.date}T${a.time}:00Z`;

  await supabase.from("citas").update(updates).eq("id", id);
}

// ─── CONFIGURACIÓN DE AGENDA (MANTENIDO TEMPORAL EN LOCALSTORAGE) ───
export function getAgendaConfig(): AgendaConfig {
  if (typeof window === "undefined") return { enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } };
  const data = localStorage.getItem("cd_agenda");
  return data ? JSON.parse(data) : { enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } };
}

export function saveAgendaConfig(config: AgendaConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cd_agenda", JSON.stringify(config));
}

// ─── UPDATE USER PROFILE (SUPABASE) ───
export async function updateUser(rut: string, updates: Partial<User>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.birthDate) dbUpdates.fecha_nacimiento = updates.birthDate;
  if (updates.diseases) dbUpdates.enfermedades = updates.diseases;
  if (updates.allergies) dbUpdates.alergias = updates.allergies;
  if (updates.phone) dbUpdates.telefono = updates.phone;

  const { data, error } = await supabase
    .from("perfiles")
    .update(dbUpdates)
    .eq("rut", rut)
    .select()
    .single();

  if (!error && data) {
    const session = getSession();
    if (session && session.user.rut === rut) {
      session.user = {
        ...session.user,
        birthDate: data.fecha_nacimiento,
        diseases: data.enfermedades,
        allergies: data.alergias,
        phone: data.telefono
      };
      localStorage.setItem("cd_session", JSON.stringify(session));
    }
  }
}

// Mantenemos estas firmas por compatibilidad con el resto de tus componentes
export async function getTestimonials(): Promise<Testimonial[]> {
  return [
    { id: "t1", name: "María González", role: "Paciente desde 2022", rating: 5, text: "Excelente atención. El Dr. Pérez me explicó todo el proceso de mi tratamiento de ortodoncia." },
    { id: "t2", name: "Juan Rodríguez", role: "Paciente desde 2023", rating: 5, text: "Muy profesionales y el ambiente es muy acogedor. Recomiendo totalmente esta clínica." }
  ];
}