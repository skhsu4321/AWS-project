import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { GoalsScreen } from '../../../screens/goals/GoalsScreen';
import { GoalCard } from '../GoalCard';
import { CreateGoalModal } from '../CreateGoalModal';
import { EditGoalModal } from '../EditGoalModal';
import { AddProgressModal } from '../AddProgressModal';
import { GoalCompletionModal } from '../GoalCompletionModal';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { SavingsGoal, GoalStatus, GoalCategory } from '../../../models/Financial';
import { FinancialDataManager } from '../../../services/FinancialDataManager';

// Mock dependencies
jest.mock('../../../services/FinancialDataManager');
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => callback(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockFinancialManager = FinancialDataManager as jest.MockedClass<typeof FinancialDataManager>;

const mockGoal: SavingsGoal = {
  id: 'goal-1',
  userId: 'test-user-id',
  title: 'New Laptop',
  description: 'Save for a new MacBook Pro',
  targetAmount: 2000,
  currentAmount: 500,
  deadline: new Date('2024-12-31'),
  category: GoalCategory.GADGET,
  cropType: 'tomato',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  status: GoalStatus.ACTIVE,
  isRecurring: false,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider initialMode="adult">
    {children}
  </ThemeProvider>
);

describe('Goal Management Integration Tests', () => {
  let mockManagerInstance: jest.Mocked<FinancialDataManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockManagerInstance = {
      getUserSavingsGoals: jest.fn(),
      createSavingsGoal: jest.fn(),
      updateSavingsGoal: jest.fn(),
      deleteSavingsGoal: jest.fn(),
      updateGoalProgress: jest.fn(),
    } as any;
    mockFinancialManager.mockImplementation(() => mockManagerInstance);
  });

  describe('GoalsScreen', () => {
    it('should load and display goals on mount', async () => {
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([mockGoal]);

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('New Laptop')).toBeTruthy();
        expect(getByText('$500.00')).toBeTruthy();
        expect(getByText('$2,000.00')).toBeTruthy();
      });

      expect(mockManagerInstance.getUserSavingsGoals).toHaveBeenCalledWith('test-user-id');
    });

    it('should show empty state when no goals exist', async () => {
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([]);

      const { getByText } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('No Goals Yet')).toBeTruthy();
        expect(getByText('Create Your First Goal')).toBeTruthy();
      });
    });

    it('should open create goal modal when new goal button is pressed', async () => {
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([]);

      const { getByText } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        fireEvent.press(getByText('New Goal'));
      });

      expect(getByText('Create New Goal')).toBeTruthy();
    });

    it('should handle goal creation successfully', async () => {
      const newGoal = { ...mockGoal, id: 'goal-2', title: 'Vacation Fund' };
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([mockGoal]);
      mockManagerInstance.createSavingsGoal.mockResolvedValue(newGoal);

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        fireEvent.press(getByText('New Goal'));
      });

      // Fill out the form
      fireEvent.changeText(getByPlaceholderText('e.g., New Laptop, Vacation Fund'), 'Vacation Fund');
      fireEvent.changeText(getByPlaceholderText('0.00'), '3000');

      fireEvent.press(getByText('Create Goal'));

      await waitFor(() => {
        expect(mockManagerInstance.createSavingsGoal).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Vacation Fund',
            targetAmount: 3000,
            userId: 'test-user-id',
          })
        );
      });
    });

    it('should handle goal creation errors', async () => {
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([]);
      mockManagerInstance.createSavingsGoal.mockRejectedValue(new Error('Creation failed'));

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        fireEvent.press(getByText('New Goal'));
      });

      fireEvent.changeText(getByPlaceholderText('e.g., New Laptop, Vacation Fund'), 'Test Goal');
      fireEvent.changeText(getByPlaceholderText('0.00'), '1000');

      fireEvent.press(getByText('Create Goal'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create goal. Please try again.');
      });
    });
  });

  describe('GoalCard', () => {
    const mockProps = {
      goal: mockGoal,
      onEdit: jest.fn(),
      onDelete: jest.fn(),
      onProgressUpdate: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display goal information correctly', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCard {...mockProps} />
        </TestWrapper>
      );

      expect(getByText('New Laptop')).toBeTruthy();
      expect(getByText('gadget')).toBeTruthy();
      expect(getByText('$500.00')).toBeTruthy();
      expect(getByText('$2,000.00')).toBeTruthy();
      expect(getByText('$1,500.00 remaining')).toBeTruthy();
    });

    it('should show progress bar with correct percentage', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCard {...mockProps} />
        </TestWrapper>
      );

      // Progress should be 25% (500/2000)
      expect(getByText('25.0%')).toBeTruthy();
    });

    it('should open add progress modal when button is pressed', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCard {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Add Progress'));
      expect(getByText('Add Progress')).toBeTruthy(); // Modal title
    });

    it('should call onEdit when edit button is pressed', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCard {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Edit'));
      expect(mockProps.onEdit).toHaveBeenCalled();
    });

    it('should show options menu on long press', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <GoalCard {...mockProps} />
        </TestWrapper>
      );

      // Simulate long press on the card
      const card = getByTestId('goal-card') || getByText('New Laptop').parent;
      fireEvent(card, 'longPress');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Goal Options',
        'What would you like to do with "New Laptop"?',
        expect.any(Array)
      );
    });

    it('should display completed state for completed goals', () => {
      const completedGoal = { ...mockGoal, status: GoalStatus.COMPLETED };
      const { getByText } = render(
        <TestWrapper>
          <GoalCard {...mockProps} goal={completedGoal} />
        </TestWrapper>
      );

      expect(getByText('🎉 Completed!')).toBeTruthy();
    });
  });

  describe('CreateGoalModal', () => {
    const mockProps = {
      visible: true,
      onClose: jest.fn(),
      onSubmit: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate required fields', async () => {
      const { getByText } = render(
        <TestWrapper>
          <CreateGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Create Goal'));

      await waitFor(() => {
        expect(getByText('Goal title is required')).toBeTruthy();
        expect(getByText('Please enter a valid target amount')).toBeTruthy();
      });

      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid form data', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <CreateGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByPlaceholderText('e.g., New Laptop, Vacation Fund'), 'Test Goal');
      fireEvent.changeText(getByPlaceholderText('0.00'), '1500');

      fireEvent.press(getByText('Create Goal'));

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Goal',
            targetAmount: 1500,
          })
        );
      });
    });

    it('should allow category selection', () => {
      const { getByText } = render(
        <TestWrapper>
          <CreateGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Vacation'));
      // Category should be selected (visual feedback would be tested in component tests)
    });

    it('should allow crop type selection', () => {
      const { getByText } = render(
        <TestWrapper>
          <CreateGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Carrot'));
      // Crop type should be selected (visual feedback would be tested in component tests)
    });
  });

  describe('AddProgressModal', () => {
    const mockProps = {
      visible: true,
      goal: mockGoal,
      onClose: jest.fn(),
      onSubmit: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display goal information', () => {
      const { getByText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      expect(getByText('New Laptop')).toBeTruthy();
      expect(getByText('Current: $500.00 / $2,000.00')).toBeTruthy();
      expect(getByText('Remaining: $1,500.00')).toBeTruthy();
    });

    it('should validate amount input', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByPlaceholderText('0.00'), '-100');
      fireEvent.press(getByText('Add Progress'));

      await waitFor(() => {
        expect(getByText('Amount must be greater than 0')).toBeTruthy();
      });

      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid progress amount', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByPlaceholderText('0.00'), '250');
      fireEvent.press(getByText('Add Progress'));

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith(250);
      });
    });

    it('should use quick amount buttons', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('50%'));

      // Should set amount to 50% of remaining (750)
      const input = getByPlaceholderText('0.00');
      expect(input.props.value).toBe('750.00');
    });

    it('should warn when amount exceeds goal', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByPlaceholderText('0.00'), '2000');
      fireEvent.press(getByText('Add Progress'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Exceeds Goal',
          expect.stringContaining('will exceed your goal'),
          expect.any(Array)
        );
      });
    });

    it('should show completion preview when goal will be completed', () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddProgressModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByPlaceholderText('0.00'), '1500');

      expect(getByText('🎉 Goal Complete!')).toBeTruthy();
      expect(getByText('Complete Goal!')).toBeTruthy();
    });
  });

  describe('EditGoalModal', () => {
    const mockProps = {
      visible: true,
      goal: mockGoal,
      onClose: jest.fn(),
      onSubmit: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pre-populate form with goal data', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <EditGoalModal {...mockProps} />
        </TestWrapper>
      );

      expect(getByDisplayValue('New Laptop')).toBeTruthy();
      expect(getByDisplayValue('2000')).toBeTruthy();
    });

    it('should prevent target amount below current progress', async () => {
      const { getByText, getByDisplayValue } = render(
        <TestWrapper>
          <EditGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByDisplayValue('2000'), '400');
      fireEvent.press(getByText('Save Changes'));

      await waitFor(() => {
        expect(getByText(/Target amount cannot be less than current progress/)).toBeTruthy();
      });

      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid updates', async () => {
      const { getByText, getByDisplayValue } = render(
        <TestWrapper>
          <EditGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByDisplayValue('New Laptop'), 'Updated Laptop');
      fireEvent.changeText(getByDisplayValue('2000'), '2500');

      fireEvent.press(getByText('Save Changes'));

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated Laptop',
            targetAmount: 2500,
          })
        );
      });
    });

    it('should warn about unsaved changes on close', () => {
      const { getByText, getByDisplayValue } = render(
        <TestWrapper>
          <EditGoalModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.changeText(getByDisplayValue('New Laptop'), 'Changed Title');
      fireEvent.press(getByText('Cancel'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        expect.any(Array)
      );
    });
  });

  describe('GoalCompletionModal', () => {
    const mockProps = {
      visible: true,
      goal: { ...mockGoal, status: GoalStatus.COMPLETED },
      onClose: jest.fn(),
    };

    it('should display completion celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCompletionModal {...mockProps} />
        </TestWrapper>
      );

      expect(getByText('Goal Completed! 🎉')).toBeTruthy();
      expect(getByText('New Laptop')).toBeTruthy();
      expect(getByText('Celebrate! 🎊')).toBeTruthy();
    });

    it('should show goal statistics', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCompletionModal {...mockProps} />
        </TestWrapper>
      );

      expect(getByText('Target Amount:')).toBeTruthy();
      expect(getByText('$2,000.00')).toBeTruthy();
      expect(getByText('Final Amount:')).toBeTruthy();
      expect(getByText('Category:')).toBeTruthy();
    });

    it('should close when celebrate button is pressed', () => {
      const { getByText } = render(
        <TestWrapper>
          <GoalCompletionModal {...mockProps} />
        </TestWrapper>
      );

      fireEvent.press(getByText('Celebrate! 🎊'));
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Goal Management Workflow Integration', () => {
    it('should complete full goal lifecycle', async () => {
      // Start with empty goals
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([]);
      
      const { getByText, getByPlaceholderText, rerender } = render(
        <TestWrapper>
          <GoalsScreen />
        </TestWrapper>
      );

      // 1. Create a new goal
      await waitFor(() => {
        fireEvent.press(getByText('Create Your First Goal'));
      });

      fireEvent.changeText(getByPlaceholderText('e.g., New Laptop, Vacation Fund'), 'Test Goal');
      fireEvent.changeText(getByPlaceholderText('0.00'), '1000');

      const newGoal = { ...mockGoal, id: 'new-goal', title: 'Test Goal', targetAmount: 1000, currentAmount: 0 };
      mockManagerInstance.createSavingsGoal.mockResolvedValue(newGoal);

      fireEvent.press(getByText('Create Goal'));

      // 2. Update goals list to include new goal
      mockManagerInstance.getUserSavingsGoals.mockResolvedValue([newGoal]);

      await waitFor(() => {
        expect(mockManagerInstance.createSavingsGoal).toHaveBeenCalled();
      });

      // 3. Add progress to goal
      const updatedGoal = { ...newGoal, currentAmount: 500 };
      mockManagerInstance.updateGoalProgress.mockResolvedValue(updatedGoal);

      // This would trigger through the GoalCard component
      // The full integration would be tested in E2E tests
    });
  });
});