import {
  User,
  UserProfile,
  UserMode,
  Currency,
  LoginCredentials,
  RegisterCredentials,
  validateUser,
  validateUserProfile,
  validateLoginCredentials,
  validateRegisterCredentials,
  UserSchema,
  UserProfileSchema,
  LoginCredentialsSchema,
  RegisterCredentialsSchema,
} from '../User';

describe('User Models', () => {
  describe('UserProfile', () => {
    const validUserProfile: UserProfile = {
      displayName: 'John Doe',
      age: 25,
      mode: UserMode.ADULT,
      currency: Currency.HKD,
      timezone: 'Asia/Hong_Kong',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
        soundEnabled: true,
        hapticFeedback: true,
      },
    };

    it('should validate a valid user profile', () => {
      expect(() => validateUserProfile(validUserProfile)).not.toThrow();
      const result = validateUserProfile(validUserProfile);
      expect(result).toEqual(validUserProfile);
    });

    it('should require display name', () => {
      const invalidProfile = { ...validUserProfile, displayName: '' };
      expect(() => validateUserProfile(invalidProfile)).toThrow('Display name is required');
    });

    it('should validate age range', () => {
      const tooYoung = { ...validUserProfile, age: 5 };
      const tooOld = { ...validUserProfile, age: 121 };
      
      expect(() => validateUserProfile(tooYoung)).toThrow();
      expect(() => validateUserProfile(tooOld)).toThrow();
    });

    it('should set default values', () => {
      const minimalProfile = {
        displayName: 'Jane Doe',
        age: 30,
        mode: UserMode.ADULT,
      };
      
      const result = UserProfileSchema.parse(minimalProfile);
      expect(result.currency).toBe(Currency.HKD);
      expect(result.timezone).toBe('Asia/Hong_Kong');
      expect(result.preferences.theme).toBe('auto');
    });

    it('should validate child mode with parent account', () => {
      const childProfile: UserProfile = {
        ...validUserProfile,
        age: 10,
        mode: UserMode.CHILD,
        parentAccountId: '123e4567-e89b-12d3-a456-426614174000',
      };
      
      expect(() => validateUserProfile(childProfile)).not.toThrow();
    });
  });

  describe('User', () => {
    const validUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'john@example.com',
      profile: {
        displayName: 'John Doe',
        age: 25,
        mode: UserMode.ADULT,
        currency: Currency.HKD,
        timezone: 'Asia/Hong_Kong',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en',
          soundEnabled: true,
          hapticFeedback: true,
        },
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isEmailVerified: true,
      isActive: true,
    };

    it('should validate a valid user', () => {
      expect(() => validateUser(validUser)).not.toThrow();
    });

    it('should require valid UUID for id', () => {
      const invalidUser = { ...validUser, id: 'invalid-uuid' };
      expect(() => validateUser(invalidUser)).toThrow();
    });

    it('should require valid email', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      expect(() => validateUser(invalidUser)).toThrow();
    });

    it('should set default values', () => {
      const minimalUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john@example.com',
        profile: {
          displayName: 'John Doe',
          age: 25,
          mode: UserMode.ADULT,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      const result = UserSchema.parse(minimalUser);
      expect(result.isEmailVerified).toBe(false);
      expect(result.isActive).toBe(true);
    });
  });

  describe('LoginCredentials', () => {
    const validCredentials: LoginCredentials = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should validate valid login credentials', () => {
      expect(() => validateLoginCredentials(validCredentials)).not.toThrow();
    });

    it('should require valid email format', () => {
      const invalidCredentials = { ...validCredentials, email: 'invalid-email' };
      expect(() => validateLoginCredentials(invalidCredentials)).toThrow('Invalid email format');
    });

    it('should require minimum password length', () => {
      const invalidCredentials = { ...validCredentials, password: '123' };
      expect(() => validateLoginCredentials(invalidCredentials)).toThrow('Password must be at least 8 characters');
    });
  });

  describe('RegisterCredentials', () => {
    const validRegisterCredentials: RegisterCredentials = {
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      profile: {
        displayName: 'John Doe',
        age: 25,
        mode: UserMode.ADULT,
        currency: Currency.HKD,
        timezone: 'Asia/Hong_Kong',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en',
          soundEnabled: true,
          hapticFeedback: true,
        },
      },
    };

    it('should validate valid register credentials', () => {
      expect(() => validateRegisterCredentials(validRegisterCredentials)).not.toThrow();
    });

    it('should require matching passwords', () => {
      const invalidCredentials = {
        ...validRegisterCredentials,
        confirmPassword: 'different-password',
      };
      expect(() => validateRegisterCredentials(invalidCredentials)).toThrow("Passwords don't match");
    });

    it('should validate nested profile', () => {
      const invalidCredentials = {
        ...validRegisterCredentials,
        profile: {
          ...validRegisterCredentials.profile,
          displayName: '',
        },
      };
      expect(() => validateRegisterCredentials(invalidCredentials)).toThrow('Display name is required');
    });
  });
});