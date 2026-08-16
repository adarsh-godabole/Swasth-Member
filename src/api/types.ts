// Mirrors sections 4-6 of the build brief exactly. This is the only place API
// shapes are declared.

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED';
export type FitnessGoal =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'GENERAL_FITNESS'
  | 'ENDURANCE'
  | 'REHAB';
export type ActivityLevel = 'BEGINNER' | 'OCCASIONAL' | 'REGULAR';
export type GymRole = 'MEMBER' | 'TRAINER' | 'GYM_ADMIN' | 'OWNER';
export type DurationUnit = 'DAY' | 'MONTH';
export type SubscriptionStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'CANCELLED';
export type DevicePlatform = 'ANDROID' | 'IOS';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  path?: string;
  timestamp?: string;
};

export type Gym = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logoUrl: string | null;
  timezone: string | null;
  currency: string | null;
};

export type Membership = {
  gymId: string;
  role: GymRole;
  status: string;
  /** null for app signups; only desk-registered members have one. */
  memberCode: string | null;
  goal: FitnessGoal | null;
  activityLevel: ActivityLevel | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  onboarded: boolean;
  joinedAt: string;
  lastVisitAt: string | null;
};

export type Subscription = {
  status: SubscriptionStatus;
  subscriptionId: string;
  planName: string | null;
  startDate: string | null;
  endDate: string | null;
  /** 0 on the last valid day, negative once past. */
  daysRemaining: number;
  balance: number;
  coveredUntil: string | null;
  hasRenewalQueued: boolean;
};

export type Me = {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  emailVerified: boolean;
  gender: Gender;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  avatarUrl: string | null;
  city: string | null;
  membership: Membership | null;
  /** null for anyone who has never bought a plan — a normal state, not an error. */
  subscription: Subscription | null;
};

/** Every field optional. Send `null` to clear; `""` is a 400. Unknown fields are a 400. */
export type UpdateMePayload = Partial<{
  fullName: string | null;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  heightCm: number | null;
  weightKg: number | null;
  city: string | null;
  avatarUrl: string | null;
  goal: FitnessGoal | null;
  activityLevel: ActivityLevel | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}>;

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  durationValue: number;
  durationUnit: DurationUnit;
  /** Pre-formatted ("3 months") — use as-is. */
  durationLabel: string;
  price: number; // rupees
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  archivedAt: string | null;
};

export type CheckIn = {
  id: string;
  memberId: string;
  /** The gym's local day, not the device's. Render as a plain date, never converted. */
  date: string;
  checkedInAt: string;
  source: string;
  /** true when this call hit an existing check-in for today — still a success. */
  alreadyCheckedIn: boolean;
};

export type CheckInSummary = {
  checkedInToday: boolean;
  checkedInAt: string | null;
  /** Server-computed. Never recompute client-side — you'll disagree with the server. */
  currentStreak: number;
  longestStreak: number;
  visitsThisMonth: number;
  totalVisits: number;
  lastVisitAt: string | null;
};

export type OtpSendResponse = {
  phone: string;
  expiresAt: string;
  /** staging only */
  devCode?: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: GymRole;
  memberCode: string | null;
  onboarded: boolean;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
  user: AuthUser;
  gym: { id: string; code: string; name: string };
};

export type TokenPair = { accessToken: string; refreshToken: string };
