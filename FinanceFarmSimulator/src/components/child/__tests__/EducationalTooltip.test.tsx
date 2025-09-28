import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {EducationalTooltip} from '../EducationalTooltip';
import {Text} from 'react-native';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('EducationalTooltip', () => {
  it('renders children correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    expect(getByText('Savings Goal')).toBeTruthy();
  });

  it('shows help icon next to children', () => {
    const {getByText} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    expect(getByText('?')).toBeTruthy();
  });

  it('opens modal when help icon is pressed', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What is Saving? 💰')).toBeTruthy();
  });

  it('displays correct content for savings concept', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What is Saving? 💰')).toBeTruthy();
    expect(getByText('📚 What is it?')).toBeTruthy();
    expect(getByText('💡 Example')).toBeTruthy();
    expect(getByText('🤔 Fun Fact')).toBeTruthy();
  });

  it('displays correct content for budget concept', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="budget">
          <Text>Budget Plan</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What is a Budget? 📊')).toBeTruthy();
  });

  it('displays correct content for expenses concept', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="expenses">
          <Text>My Expenses</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What are Expenses? 💸')).toBeTruthy();
  });

  it('displays correct content for income concept', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="income">
          <Text>My Income</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What is Income? 💵')).toBeTruthy();
  });

  it('displays correct content for goals concept', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="goals">
          <Text>My Goals</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What are Financial Goals? 🎯')).toBeTruthy();
  });

  it('shows related concepts when available', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('🔗 Related Topics')).toBeTruthy();
    expect(getByText('goals')).toBeTruthy();
    expect(getByText('interest')).toBeTruthy();
    expect(getByText('budget')).toBeTruthy();
  });

  it('closes modal when close button is pressed', () => {
    const {getByText, getByRole, queryByText} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('What is Saving? 💰')).toBeTruthy();

    const closeButton = getByText('Got it! 👍');
    fireEvent.press(closeButton);

    // Modal should be closed
    expect(queryByText('What is Saving? 💰')).toBeNull();
  });

  it('uses custom content when provided', () => {
    const customContent = {
      id: 'custom',
      title: 'Custom Title 🎨',
      concept: 'Custom Concept',
      explanation: 'This is a custom explanation.',
      example: 'This is a custom example.',
      funFact: 'This is a custom fun fact.',
      relatedConcepts: ['custom1', 'custom2'],
    };

    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="custom" content={customContent}>
          <Text>Custom Concept</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('Custom Title 🎨')).toBeTruthy();
    expect(getByText('This is a custom explanation.')).toBeTruthy();
    expect(getByText('This is a custom example.')).toBeTruthy();
    expect(getByText('This is a custom fun fact.')).toBeTruthy();
    expect(getByText('custom1')).toBeTruthy();
    expect(getByText('custom2')).toBeTruthy();
  });

  it('handles unknown concepts gracefully', () => {
    const {getByText, getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="unknown">
          <Text>Unknown Concept</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    fireEvent.press(helpButton);

    expect(getByText('About unknown')).toBeTruthy();
    expect(getByText('unknown is an important financial concept that helps you manage your money better.')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const {getByRole} = render(
      <TestWrapper>
        <EducationalTooltip concept="savings">
          <Text>Savings Goal</Text>
        </EducationalTooltip>
      </TestWrapper>
    );

    const helpButton = getByRole('button');
    expect(helpButton.props.accessibilityLabel).toBe('Learn about savings');
  });
});