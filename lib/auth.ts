"use client";

import { supabase } from "./supabase";

// ============================================================
// Tipos (idénticos a los que ya usa la UI — no hay que tocar
// los componentes que solo importan estos tipos)
// ============================================================

export interface User {
  id: string;
  rut: string;
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

// ============================================================
// Helpers de RUT (puro cálculo, sin cambios respecto al original)
// ============================================================

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

// Supabase Auth exige un email para iniciar sesión. Como el sitio
// usa RUT, generamos un email "interno" determinístico a partir del
// RUT limpio. El email real de contacto del paciente se guarda aparte
// en profiles.email y nunca se usa para iniciar sesión.
function rutToAuthEmail(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  return `${clean}@bydrasolano.app`;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    rut: row.rut,
    role: row.role,
    name: row.name,
    email: row.email,
    birthDate: row.birth_date ?? undefined,
    diseases: row.diseases ?? undefined,
    allergies: row.allergies ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.created_at,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return rowToUser(data);
}

// ============================================================
// Auth — ahora todo pasa por Supabase Auth, no por localStorage
// ============================================================

export async function login(rut: string, password: string): Promise<Session> {
  const cleanRut = rut.replace(/[^0-9kK]/g, "");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: rutToAuthEmail(cleanRut),
    password,
  });
  if (error || !data.session || !data.user) {
    throw new Error("RUT o contraseña incorrectos");
  }
  const user = await fetchProfile(data.user.id);
  if (!user) throw new Error("No se encontró el perfil del usuario");
  return {
    user,
    token: data.session.access_token,
    expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000,
  };
}

export async function registerUser(input: {
  rut: string;
  password: string;
  role: "admin" | "paciente";
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  diseases?: string;
  allergies?: string;
}): Promise<User> {
  const cleanRut = input.rut.replace(/[^0-9kK]/g, "");

  const { data, error } = await supabase.auth.signUp({
    email: rutToAuthEmail(cleanRut),
    password: input.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      throw new Error("Ya existe un usuario con este RUT");
    }
    throw new Error(error.message);
  }
  if (!data.user) throw new Error("No se pudo crear el usuario");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    rut: cleanRut,
    role: input.role,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    birth_date: input.birthDate || null,
    diseases: input.diseases ?? null,
    allergies: input.allergies ?? null,
  });

  if (profileError) {
    // Nota: si esto falla, queda un usuario "huérfano" en auth.users sin
    // perfil. Es un caso borde aceptable para una v1; se puede limpiar
    // manualmente desde el dashboard de Supabase si llega a pasar.
    throw new Error(profileError.message);
  }

  return {
    id: data.user.id,
    rut: cleanRut,
    role: input.role,
    name: input.name,
    email: input.email,
    phone: input.phone,
    birthDate: input.birthDate,
    diseases: input.diseases,
    allergies: input.allergies,
    createdAt: new Date().toISOString(),
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const user = await fetchProfile(data.session.user.id);
  if (!user) return null;
  return {
    user,
    token: data.session.access_token,
    expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user.role === "admin";
}

// ============================================================
// Usuarios (panel admin)
// ============================================================

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToUser);
}

export async function findUserByRut(rut: string): Promise<User | undefined> {
  const { data } = await supabase.from("profiles").select("*").eq("rut", rut).single();
  return data ? rowToUser(data) : undefined;
}

export async function updateUser(rut: string, updates: Partial<User>): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
  if (updates.diseases !== undefined) payload.diseases = updates.diseases;
  if (updates.allergies !== undefined) payload.allergies = updates.allergies;
  if (updates.role !== undefined) payload.role = updates.role;

  const { error } = await supabase.from("profiles").update(payload).eq("rut", rut);
  if (error) throw new Error(error.message);
}

// ============================================================
// Testimonios
// ============================================================

function rowToTestimonial(row: any): Testimonial {
  return { id: row.id, name: row.name, role: row.role, rating: row.rating, text: row.text };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTestimonial);
}

export async function addTestimonial(t: Omit<Testimonial, "id">): Promise<Testimonial> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert({ name: t.name, role: t.role, rating: t.rating, text: t.text })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToTestimonial(data);
}

export async function updateTestimonial(id: string, t: Partial<Testimonial>): Promise<void> {
  const { error } = await supabase.from("testimonials").update(t).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================
// Tratamientos
// ============================================================

function rowToTreatment(row: any): Treatment {
  return {
    id: row.id,
    patientRut: row.patient_rut,
    phase: row.phase,
    procedure: row.procedure,
    status: row.status,
    date: row.date,
    cost: row.cost,
    dentist: row.dentist,
  };
}

export async function getTreatments(patientRut?: string): Promise<Treatment[]> {
  let query = supabase.from("treatments").select("*").order("date", { ascending: false });
  if (patientRut) query = query.eq("patient_rut", patientRut);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTreatment);
}

export async function addTreatment(t: Omit<Treatment, "id">): Promise<Treatment> {
  const { data, error } = await supabase
    .from("treatments")
    .insert({
      patient_rut: t.patientRut,
      phase: t.phase,
      procedure: t.procedure,
      status: t.status,
      date: t.date,
      cost: t.cost,
      dentist: t.dentist,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToTreatment(data);
}

export async function updateTreatment(id: string, t: Partial<Treatment>): Promise<void> {
  const payload: Record<string, any> = {};
  if (t.phase !== undefined) payload.phase = t.phase;
  if (t.procedure !== undefined) payload.procedure = t.procedure;
  if (t.status !== undefined) payload.status = t.status;
  if (t.date !== undefined) payload.date = t.date;
  if (t.cost !== undefined) payload.cost = t.cost;
  if (t.dentist !== undefined) payload.dentist = t.dentist;
  const { error } = await supabase.from("treatments").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTreatment(id: string): Promise<void> {
  const { error } = await supabase.from("treatments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================
// Citas
// ============================================================

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientRut: row.patient_rut,
    patientName: row.patient_name,
    date: row.date,
    time: row.time,
    dentist: row.dentist,
    treatment: row.treatment,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getAppointments(patientRut?: string): Promise<Appointment[]> {
  let query = supabase.from("appointments").select("*").order("date", { ascending: true }).order("time", { ascending: true });
  if (patientRut) query = query.eq("patient_rut", patientRut);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAppointment);
}

export async function addAppointment(a: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_rut: a.patientRut,
      patient_name: a.patientName,
      date: a.date,
      time: a.time,
      dentist: a.dentist,
      treatment: a.treatment,
      notes: a.notes,
      status: a.status,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToAppointment(data);
}

export async function updateAppointment(id: string, a: Partial<Appointment>): Promise<void> {
  const payload: Record<string, any> = {};
  if (a.date !== undefined) payload.date = a.date;
  if (a.time !== undefined) payload.time = a.time;
  if (a.dentist !== undefined) payload.dentist = a.dentist;
  if (a.treatment !== undefined) payload.treatment = a.treatment;
  if (a.notes !== undefined) payload.notes = a.notes;
  if (a.status !== undefined) payload.status = a.status;
  const { error } = await supabase.from("appointments").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================
// Configuración de agenda (fila única en agenda_config)
// ============================================================

const DEFAULT_AGENDA: AgendaConfig = {
  enabled: true,
  disabledDates: [],
  disabledReason: "",
  workHours: { start: "09:00", end: "18:00" },
};

export async function getAgendaConfig(): Promise<AgendaConfig> {
  const { data, error } = await supabase.from("agenda_config").select("*").eq("id", 1).single();
  if (error || !data) return DEFAULT_AGENDA;
  return {
    enabled: data.enabled,
    disabledDates: data.disabled_dates ?? [],
    disabledReason: data.disabled_reason ?? "",
    workHours: data.work_hours ?? DEFAULT_AGENDA.workHours,
  };
}

export async function saveAgendaConfig(config: AgendaConfig): Promise<void> {
  const { error } = await supabase
    .from("agenda_config")
    .update({
      enabled: config.enabled,
      disabled_dates: config.disabledDates,
      disabled_reason: config.disabledReason,
      work_hours: config.workHours,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}
