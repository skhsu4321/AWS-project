// User and Authentication Models
export * from './User';

// Financial Models
export * from './Financial';

// Game Models
export * from './Game';

// Parental Control Models
export * from './ParentalControl';

// Common types and utilities
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReportType = 'financial_summary' | 'goal_progress' | 'expense_breakdown' | 'income_analysis';

// Utility type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Utility type for paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Common validation error type
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}