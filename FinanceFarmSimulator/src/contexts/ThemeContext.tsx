import React, {createContext, useContext, ReactNode} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../store/store';
import {Theme, adultTheme, childTheme, ColorScheme} from '../theme';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  // Get user mode from Redux store
  const userMode = useSelector((state: RootState) => state.auth.user?.profile?.mode || 'adult');
  
  const colorScheme: ColorScheme = userMode === 'child' ? 'child' : 'adult';
  const theme = colorScheme === 'child' ? childTheme : adultTheme;

  const value: ThemeContextType = {
    theme,
    colorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};