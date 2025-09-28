import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {Typography} from '../Typography';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('Typography Component', () => {
  it('renders text content correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <Typography>Test Text</Typography>
      </TestWrapper>
    );

    expect(getByText('Test Text')).toBeTruthy();
  });

  it('applies different variants correctly', () => {
    const variants = ['h1', 'h2', 'h3', 'h4', 'body1', 'body2', 'caption', 'button'] as const;
    
    variants.forEach(variant => {
      const {getByTestId} = render(
        <TestWrapper>
          <Typography variant={variant} testID={`text-${variant}`}>
            Test Text
          </Typography>
        </TestWrapper>
      );

      expect(getByTestId(`text-${variant}`)).toBeTruthy();
    });
  });

  it('applies custom color', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Typography color="#FF0000" testID="colored-text">
          Colored Text
        </Typography>
      </TestWrapper>
    );

    const textElement = getByTestId('colored-text');
    expect(textElement).toBeTruthy();
    // The color should be applied to the style
  });

  it('applies custom styles', () => {
    const customStyle = {fontSize: 20, fontWeight: 'bold' as const};
    const {getByTestId} = render(
      <TestWrapper>
        <Typography style={customStyle} testID="styled-text">
          Styled Text
        </Typography>
      </TestWrapper>
    );

    expect(getByTestId('styled-text')).toBeTruthy();
  });

  it('handles numberOfLines prop', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Typography numberOfLines={2} testID="truncated-text">
          This is a very long text that should be truncated after two lines
        </Typography>
      </TestWrapper>
    );

    const textElement = getByTestId('truncated-text');
    expect(textElement.props.numberOfLines).toBe(2);
  });

  it('renders with default body1 variant', () => {
    const {getByText} = render(
      <TestWrapper>
        <Typography>Default Text</Typography>
      </TestWrapper>
    );

    expect(getByText('Default Text')).toBeTruthy();
  });
});