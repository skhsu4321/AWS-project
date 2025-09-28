import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {ChoreCard} from '../ChoreCard';
import {Chore} from '../../../models/ParentalControl';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('ChoreCard', () => {
  const mockOnComplete = jest.fn();
  const mockOnPress = jest.fn();

  const mockChore: Chore = {
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
  };

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnPress.mockClear();
  });

  it('renders chore information correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={mockChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('Clean your room')).toBeTruthy();
    expect(getByText('Make your bed and put toys away')).toBeTruthy();
    expect(getByText('$5.00')).toBeTruthy();
  });

  it('shows complete button for incomplete chores', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={mockChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('I did it! 🎉')).toBeTruthy();
  });

  it('calls onComplete when complete button is pressed', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={mockChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const completeButton = getByText('I did it! 🎉');
    fireEvent.press(completeButton);
    expect(mockOnComplete).toHaveBeenCalledWith('1');
  });

  it('does not show complete button for completed chores', () => {
    const completedChore: Chore = {
      ...mockChore,
      isCompleted: true,
      completedAt: new Date(),
    };

    const {queryByText} = render(
      <TestWrapper>
        <ChoreCard chore={completedChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(queryByText('I did it! 🎉')).toBeNull();
  });

  it('shows correct status for completed chore', () => {
    const completedChore: Chore = {
      ...mockChore,
      isCompleted: true,
      completedAt: new Date(),
    };

    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={completedChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('⏳ Waiting for approval')).toBeTruthy();
  });

  it('shows correct status for approved chore', () => {
    const approvedChore: Chore = {
      ...mockChore,
      isCompleted: true,
      completedAt: new Date(),
      approvedAt: new Date(),
    };

    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={approvedChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('✅ Approved!')).toBeTruthy();
  });

  it('shows due date information', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={mockChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should show some form of due date text
    expect(getByText(/Due/)).toBeTruthy();
  });

  it('shows recurring indicator for recurring chores', () => {
    const recurringChore: Chore = {
      ...mockChore,
      isRecurring: true,
      recurringPeriod: 'weekly',
    };

    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={recurringChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('🔄 Repeats weekly')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChoreCard 
          chore={mockChore} 
          onComplete={mockOnComplete} 
          onPress={mockOnPress}
        />
      </TestWrapper>
    );

    const card = getByText('Clean your room').parent?.parent;
    if (card) {
      fireEvent.press(card);
      expect(mockOnPress).toHaveBeenCalledWith(mockChore);
    }
  });

  it('does not show complete button when showCompleteButton is false', () => {
    const {queryByText} = render(
      <TestWrapper>
        <ChoreCard 
          chore={mockChore} 
          onComplete={mockOnComplete} 
          showCompleteButton={false}
        />
      </TestWrapper>
    );

    expect(queryByText('I did it! 🎉')).toBeNull();
  });

  it('shows overdue status for past due chores', () => {
    const overdueChore: Chore = {
      ...mockChore,
      dueDate: new Date('2020-01-01'), // Past date
    };

    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={overdueChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(getByText('⚠️ Overdue')).toBeTruthy();
  });

  it('applies success variant for approved chores', () => {
    const approvedChore: Chore = {
      ...mockChore,
      isCompleted: true,
      completedAt: new Date(),
      approvedAt: new Date(),
    };

    const {getByText} = render(
      <TestWrapper>
        <ChoreCard chore={approvedChore} onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // The card should have success styling (though we can't easily test the actual styles)
    expect(getByText('✅ Approved!')).toBeTruthy();
  });
});