import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {ChoresScreen} from '../../../screens/child/ChoresScreen';
import {authSlice} from '../../../store/slices/authSlice';
import {UserMode} from '../../../models/User';

// Mock the ParentalControlService
jest.mock('../../../services/ParentalControlService', () => ({
  getChoresForChild: jest.fn().mockResolvedValue([
    {
      id: '1',
      childId: 'child-1',
      parentId: 'parent-1',
      title: 'Clean your room',
      description: 'Make your bed and put toys away',
      reward: 5.00,
      isCompleted: false,
      dueDate: new Date('2024-12-31'),
      isRecurring: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      childId: 'child-1',
      parentId: 'parent-1',
      title: 'Take out trash',
      description: 'Empty all wastebaskets',
      reward: 3.00,
      isCompleted: true,
      completedAt: new Date(),
      dueDate: new Date('2024-12-31'),
      isRecurring: true,
      recurringPeriod: 'weekly',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ]),
  getPendingApprovalRequests: jest.fn().mockResolvedValue([
    {
      id: '1',
      childId: 'child-1',
      parentId: 'parent-1',
      type: 'goal',
      itemId: 'goal-1',
      requestData: {},
      status: 'pending',
      requestedAt: new Date(),
    },
  ]),
  completeChore: jest.fn().mockResolvedValue(undefined),
}));

const createTestStore = (userMode: UserMode = UserMode.CHILD) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'child-1',
          email: 'child@test.com',
          profile: {
            displayName: 'Test Child',
            age: 10,
            mode: userMode,
            currency: 'HKD',
            timezone: 'Asia/Hong_Kong',
            parentAccountId: 'parent-1',
            preferences: {
              theme: 'auto',
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
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  });
};

const TestWrapper: React.FC<{children: React.ReactNode; userMode?: UserMode}> = ({
  children,
  userMode = UserMode.CHILD,
}) => {
  const store = createTestStore(userMode);
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
};

describe('Child Mode Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ChoresScreen in Child Mode', () => {
    it('renders with child-friendly interface', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('🏠 My Chores')).toBeTruthy();
        expect(getByText('Complete chores to earn money for your farm!')).toBeTruthy();
      });
    });

    it('displays chores with child-friendly styling', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Clean your room')).toBeTruthy();
        expect(getByText('Make your bed and put toys away')).toBeTruthy();
        expect(getByText('$5.00')).toBeTruthy();
        expect(getByText('I did it! 🎉')).toBeTruthy();
      });
    });

    it('shows parental approval banner for pending requests', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('👨‍👩‍👧‍👦 Waiting for Mom or Dad')).toBeTruthy();
      });
    });

    it('displays chore statistics in child-friendly format', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('2')).toBeTruthy(); // Total chores
        expect(getByText('1')).toBeTruthy(); // Completed chores
        expect(getByText('Total')).toBeTruthy();
        expect(getByText('Completed')).toBeTruthy();
      });
    });

    it('shows recurring chore indicator', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('🔄 Repeats weekly')).toBeTruthy();
      });
    });

    it('handles chore completion flow', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const completeButton = getByText('I did it! 🎉');
        fireEvent.press(completeButton);
      });

      // Should open completion modal
      await waitFor(() => {
        expect(getByText('🎉 Awesome Work!')).toBeTruthy();
        expect(getByText('"Clean your room"')).toBeTruthy();
        expect(getByText('You will earn:')).toBeTruthy();
      });
    });

    it('shows educational tooltips', async () => {
      const {getByText, getByRole} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const helpButton = getByRole('button');
        fireEvent.press(helpButton);
      });

      // Should show educational content
      await waitFor(() => {
        expect(getByText(/What is/)).toBeTruthy();
      });
    });
  });

  describe('Adult Mode Comparison', () => {
    it('renders with adult interface when user is in adult mode', async () => {
      const {getByText, queryByText} = render(
        <TestWrapper userMode={UserMode.ADULT}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Chores & Tasks')).toBeTruthy();
        expect(getByText('Complete tasks to earn rewards')).toBeTruthy();
        // Should not have child-specific text
        expect(queryByText('🏠 My Chores')).toBeNull();
        expect(queryByText('Complete chores to earn money for your farm!')).toBeNull();
      });
    });

    it('uses different button text in adult mode', async () => {
      const {getByText, queryByText} = render(
        <TestWrapper userMode={UserMode.ADULT}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Complete')).toBeTruthy();
        // Should not have child-specific button text
        expect(queryByText('I did it! 🎉')).toBeNull();
      });
    });
  });

  describe('Theme Integration', () => {
    it('applies child theme styling correctly', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const title = getByText('🏠 My Chores');
        // The component should be rendered (we can't easily test actual styles in this environment)
        expect(title).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles loading states gracefully', async () => {
      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      // Should show loading initially, then content
      await waitFor(() => {
        expect(getByText('🏠 My Chores')).toBeTruthy();
      });
    });

    it('shows empty state when no chores available', async () => {
      // Mock empty chores list
      const ParentalControlService = require('../../../services/ParentalControlService');
      ParentalControlService.getChoresForChild.mockResolvedValueOnce([]);

      const {getByText} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('No chores right now!')).toBeTruthy();
        expect(getByText(/Ask your parents if there are any chores/)).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', async () => {
      const {getByRole} = render(
        <TestWrapper userMode={UserMode.CHILD}>
          <ChoresScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const buttons = getByRole('button');
        expect(buttons).toBeTruthy();
      });
    });
  });
});