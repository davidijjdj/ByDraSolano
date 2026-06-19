"use client";

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

const STORAGE_KEYS = {
  USERS: "cd_users",
  SESSION: "cd_session",
  TESTIMONIALS: "cd_testimonials",
  TREATMENTS: "cd_treatments",
  APPOINTMENTS: "cd_appointments",
  AGENDA: "cd_agenda",
};

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

function seedData() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const adminUser: User = {
      id: "admin-1",
      rut: "11.111.111-1",
      password: "admin123",
      role: "admin",
      name: "Administrador",
      email: "admin@clinicadental.cl",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TESTIMONIALS)) {
    const testimonials: Testimonial[] = [
      { id: "t1", name: "María González", role: "Paciente desde 2022", rating: 5, text: "Excelente atención. El Dr. Pérez me explicó todo el proceso de mi tratamiento de ortodoncia. Mi sonrisa nunca se había visto mejor." },
      { id: "t2", name: "Juan Rodríguez", role: "Paciente desde 2023", rating: 5, text: "Muy profesionales y el ambiente es muy acogedor. Recomiendo totalmente esta clínica para cualquier tratamiento dental." },
      { id: "t3", name: "Carolina Soto", role: "Paciente desde 2021", rating: 5, text: "El mejor servicio dental que he recibido. Las instalaciones son modernas y el personal es muy amable. ¡Gracias por mi nueva sonrisa!" },
    ];
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(testimonials));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AGENDA)) {
    const agenda: AgendaConfig = { enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } };
    localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(agenda));
  }
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  seedData();
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function findUserByRut(rut: string): User | undefined {
  return getUsers().find((u) => u.rut === rut);
}

export function registerUser(user: Omit<User, "id" | "createdAt">): User {
  if (typeof window === "undefined") throw new Error("No window");
  seedData();
  const users = getUsers();
  if (users.some((u) => u.rut === user.rut)) throw new Error("Ya existe un usuario con este RUT");
  const newUser: User = { ...user, id: `user-${Date.now()}`, createdAt: new Date().toISOString() };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return newUser;
}

export function login(rut: string, password: string): Session {
  if (typeof window === "undefined") throw new Error("No window");
  seedData();
  const user = findUserByRut(rut);
  if (!user || user.password !== password) throw new Error("RUT o contraseña incorrectos");
  const session: Session = { user, token: `token-${Date.now()}-${Math.random()}`, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  seedData();
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!data) return null;
  const session: Session = JSON.parse(data);
  if (Date.now() > session.expiresAt) { logout(); return null; }
  return session;
}

export function isAuthenticated(): boolean { return getSession() !== null; }
export function isAdmin(): boolean { return getSession()?.user.role === "admin"; }

// ─── Testimonials CRUD ───
export function getTestimonials(): Testimonial[] {
  if (typeof window === "undefined") return [];
  seedData();
  const data = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
  return data ? JSON.parse(data) : [];
}

export function saveTestimonials(testimonials: Testimonial[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(testimonials));
}

export function addTestimonial(t: Omit<Testimonial, "id">): Testimonial {
  const testimonials = getTestimonials();
  const newT: Testimonial = { ...t, id: `t-${Date.now()}` };
  testimonials.push(newT);
  saveTestimonials(testimonials);
  return newT;
}

export function updateTestimonial(id: string, t: Partial<Testimonial>): void {
  const testimonials = getTestimonials();
  const idx = testimonials.findIndex((x) => x.id === id);
  if (idx >= 0) { testimonials[idx] = { ...testimonials[idx], ...t }; saveTestimonials(testimonials); }
}

export function deleteTestimonial(id: string): void {
  const testimonials = getTestimonials();
  saveTestimonials(testimonials.filter((x) => x.id !== id));
}

// ─── Treatments CRUD ───
export function getTreatments(patientRut?: string): Treatment[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.TREATMENTS);
  const treatments: Treatment[] = data ? JSON.parse(data) : [];
  if (patientRut) return treatments.filter((t) => t.patientRut === patientRut);
  return treatments;
}

export function saveTreatments(treatments: Treatment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TREATMENTS, JSON.stringify(treatments));
}

export function addTreatment(t: Omit<Treatment, "id">): Treatment {
  const treatments = getTreatments();
  const newT: Treatment = { ...t, id: `tr-${Date.now()}` };
  treatments.push(newT);
  saveTreatments(treatments);
  return newT;
}

export function updateTreatment(id: string, t: Partial<Treatment>): void {
  const treatments = getTreatments();
  const idx = treatments.findIndex((x) => x.id === id);
  if (idx >= 0) { treatments[idx] = { ...treatments[idx], ...t }; saveTreatments(treatments); }
}

export function deleteTreatment(id: string): void {
  const treatments = getTreatments();
  saveTreatments(treatments.filter((x) => x.id !== id));
}

// ─── Appointments CRUD ───
export function getAppointments(patientRut?: string): Appointment[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  const appointments: Appointment[] = data ? JSON.parse(data) : [];
  if (patientRut) return appointments.filter((a) => a.patientRut === patientRut).sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());
  return appointments.sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());
}

export function saveAppointments(appointments: Appointment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
}

export function addAppointment(a: Omit<Appointment, "id" | "createdAt">): Appointment {
  const appointments = getAppointments();
  const newA: Appointment = { ...a, id: `ap-${Date.now()}`, createdAt: new Date().toISOString() };
  appointments.push(newA);
  saveAppointments(appointments);
  return newA;
}

export function updateAppointment(id: string, a: Partial<Appointment>): void {
  const appointments = getAppointments();
  const idx = appointments.findIndex((x) => x.id === id);
  if (idx >= 0) { appointments[idx] = { ...appointments[idx], ...a }; saveAppointments(appointments); }
}

export function deleteAppointment(id: string): void {
  const appointments = getAppointments();
  saveAppointments(appointments.filter((x) => x.id !== id));
}

// ─── Agenda Config ───
export function getAgendaConfig(): AgendaConfig {
  if (typeof window === "undefined") return { enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } };
  seedData();
  const data = localStorage.getItem(STORAGE_KEYS.AGENDA);
  return data ? JSON.parse(data) : { enabled: true, disabledDates: [], disabledReason: "", workHours: { start: "09:00", end: "18:00" } };
}

export function saveAgendaConfig(config: AgendaConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(config));
}

// ─── Update User ───
export function updateUser(rut: string, updates: Partial<User>): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.rut === rut);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const session = getSession();
    if (session && session.user.rut === rut) {
      session.user = users[idx];
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }
}
