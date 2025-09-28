// App constants
export const APP_NAME = 'Finance Farm Simulator';
export const VERSION = '1.0.0';

// Database constants
export const DATABASE_NAME = 'FinanceFarmDB.db';
export const DATABASE_VERSION = 1;

// Theme constants
export const COLORS = {
  primary: '#4CAF50',
  secondary: '#8BC34A',
  accent: '#FFC107',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  error: '#F44336',
  text: '#212121',
  textSecondary: '#757575',
};

// Animation constants
export const ANIMATION_DURATION = {
  short: 200,
  medium: 300,
  long: 500,
};

// Farm constants
export const CROP_TYPES = {
  CARROT: 'carrot',
  TOMATO: 'tomato',
  CORN: 'corn',
  WHEAT: 'wheat',
} as const;

export const GROWTH_STAGES = {
  SEED: 'seed',
  SPROUT: 'sprout',
  GROWING: 'growing',
  MATURE: 'mature',
  HARVEST: 'harvest',
} as const;