import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GoalFilters } from '../GoalFilters';
import { GoalStatus, GoalCategory } from '../../../models/Financial';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider initialMode="adult">
    {children}
  </ThemeProvider>
);

describe('GoalFilters', () => {
  const mockFilters = {
    status: 'all' as const,
    category: 'all' as const,
    sortBy: 'deadline' as const,
    sortOrder: 'asc' as const,
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display goal count correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={5}
        />
      </TestWrapper>
    );

    expect(getByText('5 goals')).toBeTruthy();
  });

  it('should display singular form for one goal', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={1}
        />
      </TestWrapper>
    );

    expect(getByText('1 goal')).toBeTruthy();
  });

  it('should show active filters count badge', () => {
    const filtersWithActive = {
      ...mockFilters,
      status: GoalStatus.ACTIVE,
      category: GoalCategory.VACATION,
    };

    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    expect(getByText('2')).toBeTruthy(); // Badge showing 2 active filters
  });

  it('should toggle quick filter chips', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Active'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: GoalStatus.ACTIVE,
    });
  });

  it('should toggle off active filter when pressed again', () => {
    const activeFilters = {
      ...mockFilters,
      status: GoalStatus.ACTIVE,
    };

    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Active'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...activeFilters,
      status: 'all',
    });
  });

  it('should toggle sort order when sort button is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    // Find and press the sort button (contains "Deadline" and "↑")
    const sortButton = getByText('Deadline').parent;
    fireEvent.press(sortButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      sortOrder: 'desc',
    });
  });

  it('should open filters modal when filters button is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));

    expect(getByText('Filter & Sort Goals')).toBeTruthy();
  });

  it('should allow status selection in modal', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));
    fireEvent.press(getByText('Active'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: GoalStatus.ACTIVE,
    });
  });

  it('should allow category selection in modal', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));
    fireEvent.press(getByText('Vacation'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      category: GoalCategory.VACATION,
    });
  });

  it('should allow sort by selection in modal', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));
    fireEvent.press(getByText('Progress'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      sortBy: 'progress',
    });
  });

  it('should reset filters when reset button is pressed', () => {
    const filtersWithValues = {
      status: GoalStatus.ACTIVE,
      category: GoalCategory.VACATION,
      sortBy: 'progress' as const,
      sortOrder: 'desc' as const,
    };

    const { getByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));
    fireEvent.press(getByText('Reset'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: 'all',
      category: 'all',
      sortBy: 'deadline',
      sortOrder: 'asc',
    });
  });

  it('should close modal when apply button is pressed', () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    fireEvent.press(getByText('Filters'));
    expect(getByText('Filter & Sort Goals')).toBeTruthy();

    fireEvent.press(getByText('Apply'));
    
    // Modal should be closed (title should not be visible)
    expect(queryByText('Filter & Sort Goals')).toBeNull();
  });

  it('should not show badge when no filters are active', () => {
    const { queryByText } = render(
      <TestWrapper>
        <GoalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          goalCount={3}
        />
      </TestWrapper>
    );

    // Should not show any badge number
    expect(queryByText('1')).toBeNull();
    expect(queryByText('2')).toBeNull();
  });
});