import type { ActivityLevel, FitnessGoal, Gender, Me, UpdateMePayload } from '../api/types';

/** Everything the member can edit, held as strings so the inputs stay controlled. */
export type ProfileForm = {
  fullName: string;
  email: string;
  gender: Gender | null;
  dateOfBirth: string; // YYYY-MM-DD
  heightCm: string;
  weightKg: string;
  city: string;
  goal: FitnessGoal | null;
  activityLevel: ActivityLevel | null;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export function formFromMe(me: Me | undefined): ProfileForm {
  return {
    fullName: me?.fullName ?? '',
    email: me?.email ?? '',
    gender: me?.gender ?? null,
    dateOfBirth: me?.dateOfBirth ? me.dateOfBirth.slice(0, 10) : '',
    heightCm: me?.heightCm != null ? String(me.heightCm) : '',
    weightKg: me?.weightKg != null ? String(me.weightKg) : '',
    city: me?.city ?? '',
    goal: me?.membership?.goal ?? null,
    activityLevel: me?.membership?.activityLevel ?? null,
    medicalNotes: me?.membership?.medicalNotes ?? '',
    emergencyContactName: me?.membership?.emergencyContactName ?? '',
    emergencyContactPhone: me?.membership?.emergencyContactPhone ?? '',
  };
}

export type FieldErrors = Partial<Record<keyof ProfileForm, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Mirrors the backend's validation so the API doesn't have to reject the form. */
export function validate(form: Partial<ProfileForm>): FieldErrors {
  const errors: FieldErrors = {};

  if (form.fullName !== undefined) {
    const name = form.fullName.trim();
    if (name && (name.length < 2 || name.length > 120)) {
      errors.fullName = 'Name must be between 2 and 120 characters.';
    }
  }
  if (form.email?.trim() && !EMAIL.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (form.dateOfBirth?.trim()) {
    const value = form.dateOfBirth.trim();
    const parsed = new Date(value);
    if (!ISO_DATE.test(value) || Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      errors.dateOfBirth = 'Use YYYY-MM-DD, e.g. 1995-04-17.';
    }
  }
  if (form.heightCm?.trim()) {
    const height = Number(form.heightCm);
    if (!Number.isFinite(height) || height < 50 || height > 280) {
      errors.heightCm = 'Height must be between 50 and 280 cm.';
    }
  }
  if (form.weightKg?.trim()) {
    const weight = Number(form.weightKg);
    if (!Number.isFinite(weight) || weight < 20 || weight > 500) {
      errors.weightKg = 'Weight must be between 20 and 500 kg.';
    }
  }
  if ((form.medicalNotes?.length ?? 0) > 1000) {
    errors.medicalNotes = 'Please keep this under 1000 characters.';
  }
  if ((form.city?.trim().length ?? 0) > 100) {
    errors.city = 'Please keep this under 100 characters.';
  }

  return errors;
}

const text = (value: string) => (value.trim() === '' ? null : value.trim());
const number = (value: string) => (value.trim() === '' ? null : Number(value));

/**
 * Builds the PATCH body. Only changed fields are sent — omitted means "leave
 * alone", `null` means "clear", and `""` is a 400 on validated fields, so empty
 * strings become null. Only the fields the API accepts are ever included.
 */
export function buildPatch(form: ProfileForm, original: ProfileForm): UpdateMePayload {
  const payload: UpdateMePayload = {};
  const changed = <K extends keyof ProfileForm>(key: K) => form[key] !== original[key];

  if (changed('fullName')) payload.fullName = text(form.fullName);
  if (changed('email')) payload.email = text(form.email);
  if (changed('gender')) payload.gender = form.gender;
  if (changed('dateOfBirth')) payload.dateOfBirth = text(form.dateOfBirth);
  if (changed('heightCm')) payload.heightCm = number(form.heightCm);
  if (changed('weightKg')) payload.weightKg = number(form.weightKg);
  if (changed('city')) payload.city = text(form.city);
  if (changed('goal')) payload.goal = form.goal;
  if (changed('activityLevel')) payload.activityLevel = form.activityLevel;
  if (changed('medicalNotes')) payload.medicalNotes = text(form.medicalNotes);
  if (changed('emergencyContactName')) {
    payload.emergencyContactName = text(form.emergencyContactName);
  }
  if (changed('emergencyContactPhone')) {
    payload.emergencyContactPhone = text(form.emergencyContactPhone);
  }

  return payload;
}
