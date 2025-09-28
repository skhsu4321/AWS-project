import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../utils/testHelpers';
import { App } from '../../../App';
import { AuthService } from '../../services/AuthService';
import { FinancialDataManager } from '../../services/FinancialDataManager';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
}));

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Onboarding', () => {
    it('should complete full user registration flow', async () => {
      render(<App />);

      // Should show welcome screen
      expect(screen.getByText(/welcome/i)).toBeTruthy();

      // Navigate to registration
      fireEvent.press(screen.getByText(/sign up/i));

      // Fill registration form
      fireEvent.changeText(screen.getByPlaceholderText(/email/i), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText(/confirm password/i), 'password123');
      
      // Select age
      fireEvent.changeText(screen.getByPlaceholderText(/age/i), '25');
      
      // Select adult mode
      fireEvent.press(screen.getByText(/adult mode/i));

      // Submit registration
      fireEvent.press(screen.getByText(/create account/i));

      // Should navigate to main app
      await waitFor(() => {
        expect(screen.getByText(/farm/i)).toBeTruthy();
      });
    });

    it('should handle child registration with parental linking', async () => {
      render(<App />);

      fireEvent.press(screen.getByText(/sign up/i));

      // Fill child registration
      fireEvent.changeText(screen.getByPlaceholderText(/email/i), 'child@example.com');
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText(/age/i), '8');
      
      // Select child mode
      fireEvent.press(screen.getByText(/child mode/i));

      // Should show parental linking screen
      fireEvent.press(screen.getByText(/create account/i));

      await waitFor(() => {
        expect(screen.getByText(/parent/i)).toBeTruthy();
      });

      // Enter parent email
      fireEvent.changeText(screen.getByPlaceholderText(/parent email/i), 'parent@example.com');
      fireEvent.press(screen.getByText(/send request/i));

      await waitFor(() => {
        expect(screen.getByText(/approval pending/i)).toBeTruthy();
      });
    });
  });

  describe('Savings Goal Management Workflow', () => {
    it('should create, track, and complete a savings goal', async () => {
      // Mock authenticated user
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      // Navigate to goals screen
      fireEvent.press(screen.getByText(/goals/i));

      // Create new goal
      fireEvent.press(screen.getByText(/add goal/i));

      // Fill goal form
      fireEvent.changeText(screen.getByPlaceholderText(/goal title/i), 'New Phone');
      fireEvent.changeText(screen.getByPlaceholderText(/target amount/i), '8000');
      fireEvent.changeText(screen.getByPlaceholderText(/description/i), 'iPhone 15 Pro');

      // Set deadline
      fireEvent.press(screen.getByText(/set deadline/i));
      // Mock date picker interaction
      fireEvent.press(screen.getByText(/confirm/i));

      // Create goal
      fireEvent.press(screen.getByText(/create goal/i));

      // Should show goal in list
      await waitFor(() => {
        expect(screen.getByText('New Phone')).toBeTruthy();
      });

      // Add progress to goal
      fireEvent.press(screen.getByText('New Phone'));
      fireEvent.press(screen.getByText(/add progress/i));
      fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '1000');
      fireEvent.press(screen.getByText(/save progress/i));

      // Should update progress bar
      await waitFor(() => {
        expect(screen.getByText(/12.5%/)).toBeTruthy(); // 1000/8000 = 12.5%
      });

      // Complete goal
      fireEvent.press(screen.getByText(/add progress/i));
      fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '7000');
      fireEvent.press(screen.getByText(/save progress/i));

      // Should show completion celebration
      await waitFor(() => {
        expect(screen.getByText(/congratulations/i)).toBeTruthy();
      });
    });
  });

  describe('Expense Tracking Workflow', () => {
    it('should log expenses with receipt scanning', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      // Navigate to expenses
      fireEvent.press(screen.getByText(/expenses/i));

      // Add new expense
      fireEvent.press(screen.getByText(/add expense/i));

      // Use receipt scanner
      fireEvent.press(screen.getByText(/scan receipt/i));

      // Mock camera permission and scanning
      await waitFor(() => {
        expect(screen.getByText(/camera/i)).toBeTruthy();
      });

      // Mock successful scan
      fireEvent.press(screen.getByText(/capture/i));

      // Should auto-fill expense details
      await waitFor(() => {
        expect(screen.getByDisplayValue(/lunch/i)).toBeTruthy();
        expect(screen.getByDisplayValue(/25.50/)).toBeTruthy();
      });

      // Adjust category
      fireEvent.press(screen.getByText(/food/i));
      fireEvent.press(screen.getByText(/restaurant/i));

      // Add tags
      fireEvent.changeText(screen.getByPlaceholderText(/tags/i), 'business lunch');

      // Save expense
      fireEvent.press(screen.getByText(/save expense/i));

      // Should show in expense list
      await waitFor(() => {
        expect(screen.getByText(/lunch/i)).toBeTruthy();
        expect(screen.getByText(/25.50/)).toBeTruthy();
      });
    });

    it('should handle budget alerts and weed pulling', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      // Set up budget threshold (mock existing expenses)
      fireEvent.press(screen.getByText(/expenses/i));

      // Add multiple expenses to exceed budget
      for (let i = 0; i < 3; i++) {
        fireEvent.press(screen.getByText(/add expense/i));
        fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '500');
        fireEvent.changeText(screen.getByPlaceholderText(/description/i), `Expense ${i + 1}`);
        fireEvent.press(screen.getByText(/save expense/i));
      }

      // Should show budget alert
      await waitFor(() => {
        expect(screen.getByText(/budget exceeded/i)).toBeTruthy();
      });

      // Navigate to farm to see weed effects
      fireEvent.press(screen.getByText(/farm/i));

      // Should show weeds on farm
      await waitFor(() => {
        expect(screen.getByText(/weeds detected/i)).toBeTruthy();
      });

      // Pull weeds (weed pulling interface)
      fireEvent.press(screen.getByText(/pull weeds/i));

      // Mock drag gesture for weed pulling
      const weedElement = screen.getByTestId('weed-1');
      fireEvent(weedElement, 'onPanGestureEvent', {
        nativeEvent: { translationX: 100, translationY: -50 },
      });

      // Should remove weed and improve farm health
      await waitFor(() => {
        expect(screen.queryByTestId('weed-1')).toBeNull();
      });
    });
  });

  describe('Income Logging and Fertilizer System', () => {
    it('should log income and apply fertilizer effects', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      // Navigate to income screen
      fireEvent.press(screen.getByText(/income/i));

      // Add income entry
      fireEvent.press(screen.getByText(/add income/i));
      fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '5000');
      fireEvent.changeText(screen.getByPlaceholderText(/description/i), 'Monthly salary');
      
      // Select source
      fireEvent.press(screen.getByText(/salary/i));

      // Save income
      fireEvent.press(screen.getByText(/save income/i));

      // Should show streak information
      await waitFor(() => {
        expect(screen.getByText(/streak: 1 day/i)).toBeTruthy();
      });

      // Navigate to farm to see fertilizer effects
      fireEvent.press(screen.getByText(/farm/i));

      // Should show fertilizer animation
      await waitFor(() => {
        expect(screen.getByText(/fertilizer applied/i)).toBeTruthy();
      });

      // Crops should show improved growth
      const cropElements = screen.getAllByTestId(/crop-/);
      expect(cropElements.length).toBeGreaterThan(0);
    });

    it('should track streak multipliers', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      fireEvent.press(screen.getByText(/income/i));

      // Log income for multiple consecutive days
      for (let day = 0; day < 7; day++) {
        fireEvent.press(screen.getByText(/add income/i));
        fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '100');
        fireEvent.changeText(screen.getByPlaceholderText(/description/i), `Day ${day + 1} income`);
        fireEvent.press(screen.getByText(/save income/i));
      }

      // Should show increased multiplier
      await waitFor(() => {
        expect(screen.getByText(/multiplier: 1.7x/i)).toBeTruthy();
      });

      // Should show streak achievement
      expect(screen.getByText(/7-day streak!/i)).toBeTruthy();
    });
  });

  describe('Child Mode Workflow', () => {
    it('should handle child mode interface and parental approval', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-child',
        email: 'child@example.com',
        profile: { mode: 'child', age: 8, parentAccountId: 'parent-id' },
      } as any);

      render(<App />);

      // Should show child-friendly interface
      expect(screen.getByText(/my farm/i)).toBeTruthy();
      expect(screen.getByText(/chores/i)).toBeTruthy();

      // Create a goal (requires parental approval)
      fireEvent.press(screen.getByText(/goals/i));
      fireEvent.press(screen.getByText(/add goal/i));

      fireEvent.changeText(screen.getByPlaceholderText(/what do you want to save for/i), 'New toy');
      fireEvent.changeText(screen.getByPlaceholderText(/how much/i), '50');

      fireEvent.press(screen.getByText(/ask parent/i));

      // Should show approval pending
      await waitFor(() => {
        expect(screen.getByText(/waiting for parent approval/i)).toBeTruthy();
      });

      // Complete a chore
      fireEvent.press(screen.getByText(/chores/i));
      fireEvent.press(screen.getByText(/clean room/i));
      fireEvent.press(screen.getByText(/mark complete/i));

      // Should show completion animation
      await waitFor(() => {
        expect(screen.getByText(/great job!/i)).toBeTruthy();
      });

      // Should add fertilizer points
      expect(screen.getByText(/+10 fertilizer points/i)).toBeTruthy();
    });
  });

  describe('Analytics and Reporting Workflow', () => {
    it('should generate and view financial reports', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      render(<App />);

      // Navigate to analytics
      fireEvent.press(screen.getByText(/analytics/i));

      // Should show default charts
      expect(screen.getByText(/spending overview/i)).toBeTruthy();
      expect(screen.getByText(/savings progress/i)).toBeTruthy();

      // Change time period
      fireEvent.press(screen.getByText(/this month/i));
      fireEvent.press(screen.getByText(/last 3 months/i));

      // Should update charts
      await waitFor(() => {
        expect(screen.getByText(/last 3 months/i)).toBeTruthy();
      });

      // Generate PDF report
      fireEvent.press(screen.getByText(/export report/i));
      fireEvent.press(screen.getByText(/pdf/i));

      // Should show export progress
      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeTruthy();
      });

      // Should complete export
      await waitFor(() => {
        expect(screen.getByText(/report saved/i)).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('Offline Functionality Workflow', () => {
    it('should work offline and sync when online', async () => {
      jest.spyOn(AuthService.prototype, 'getCurrentUser').mockReturnValue({
        id: 'test-user',
        email: 'test@example.com',
        profile: { mode: 'adult', age: 25 },
      } as any);

      // Mock offline state
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      render(<App />);

      // Should show offline indicator
      expect(screen.getByText(/offline/i)).toBeTruthy();

      // Add expense while offline
      fireEvent.press(screen.getByText(/expenses/i));
      fireEvent.press(screen.getByText(/add expense/i));
      fireEvent.changeText(screen.getByPlaceholderText(/amount/i), '25');
      fireEvent.changeText(screen.getByPlaceholderText(/description/i), 'Coffee');
      fireEvent.press(screen.getByText(/save expense/i));

      // Should save locally
      await waitFor(() => {
        expect(screen.getByText('Coffee')).toBeTruthy();
        expect(screen.getByText(/pending sync/i)).toBeTruthy();
      });

      // Mock coming back online
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      
      // Trigger sync
      fireEvent.press(screen.getByText(/sync now/i));

      // Should sync data
      await waitFor(() => {
        expect(screen.getByText(/synced/i)).toBeTruthy();
        expect(screen.queryByText(/pending sync/i)).toBeNull();
      });
    });
  });
});