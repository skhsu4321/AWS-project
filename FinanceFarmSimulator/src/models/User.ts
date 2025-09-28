import { z } from 'zod';

// Enums and constants
export enum UserMode {
  ADULT = 'adult',
  CHILD = 'child',
}

export enum Currency {
  HKD = 'HKD',
  USD = 'USD',
  CNY = 'CNY',
}

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  notifications: z.boolean().default(true),
  language: z.string().default('en'),
  soundEnabled: z.boolean().default(true),
  hapticFeedback: z.boolean().default(true),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// User Profile Schema
export const UserProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  age: z.number().int().min(6).max(120),
  mode: z.nativeEnum(UserMode),
  currency: z.nativeEnum(Currency).default(Currency.HKD),
  timezone: z.string().default('Asia/Hong_Kong'),
  parentAccountId: z.string().optional(),
  preferences: UserPreferencesSchema.default(() => ({
    theme: 'auto' as const,
    notifications: true,
    language: 'en',
    soundEnabled: true,
    hapticFeedback: true,
  })),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  profile: UserProfileSchema,
  createdAt: z.date(),
  lastLoginAt: z.date(),
  isEmailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type User = z.infer<typeof UserSchema>;

// Authentication Types
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export const RegisterCredentialsSchema = LoginCredentialsSchema.extend({
  confirmPassword: z.string(),
  profile: UserProfileSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>;

export const SocialLoginProviderSchema = z.enum(['google', 'apple']);
export type SocialLoginProvider = z.infer<typeof SocialLoginProviderSchema>;

// Authentication Session
export const AuthSessionSchema = z.object({
  user: UserSchema,
  token: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

// Validation functions
export const validateUser = (data: unknown): User => {
  return UserSchema.parse(data);
};

export const validateUserProfile = (data: unknown): UserProfile => {
  return UserProfileSchema.parse(data);
};

export const validateLoginCredentials = (data: unknown): LoginCredentials => {
  return LoginCredentialsSchema.parse(data);
};

export const validateRegisterCredentials = (data: unknown): RegisterCredentials => {
  return RegisterCredentialsSchema.parse(data);
};