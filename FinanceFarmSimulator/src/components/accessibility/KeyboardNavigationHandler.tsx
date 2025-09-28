import React, { useEffect, useRef } from 'react';
import { View, findNodeHandle, AccessibilityInfo, Platform } from 'react-native';

export interface KeyboardNavigationHandlerProps {
  children: React.ReactNode;
  focusableElements?: string[]; // testIDs of focusable elements
  onKeyPress?: (key: string) => void;
}

export const KeyboardNavigationHandler: React.FC<KeyboardNavigationHandlerProps> = ({
  children,
  focusableElements = [],
  onKeyPress,
}) => {
  const containerRef = useRef<View>(null);
  const currentFocusIndex = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return; // Keyboard navigation is primarily for web/desktop

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey, shiftKey } = event;

      // Handle custom key combinations
      if (onKeyPress) {
        onKeyPress(key);
      }

      // Handle Tab navigation
      if (key === 'Tab') {
        event.preventDefault();
        navigateToNextElement(shiftKey ? -1 : 1);
        return;
      }

      // Handle Arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
        handleArrowNavigation(key);
        return;
      }

      // Handle Enter/Space for activation
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        activateCurrentElement();
        return;
      }

      // Handle Escape for dismissing modals/menus
      if (key === 'Escape') {
        event.preventDefault();
        handleEscape();
        return;
      }

      // Handle accessibility shortcuts
      if (ctrlKey || altKey) {
        handleAccessibilityShortcuts(key, ctrlKey, altKey);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusableElements, onKeyPress]);

  const navigateToNextElement = (direction: number) => {
    if (focusableElements.length === 0) return;

    currentFocusIndex.current = 
      (currentFocusIndex.current + direction + focusableElements.length) % focusableElements.length;
    
    const elementId = focusableElements[currentFocusIndex.current];
    focusElementById(elementId);
  };

  const handleArrowNavigation = (key: string) => {
    // Implement grid-like navigation for farm interface
    switch (key) {
      case 'ArrowUp':
        navigateToNextElement(-1);
        break;
      case 'ArrowDown':
        navigateToNextElement(1);
        break;
      case 'ArrowLeft':
        navigateToNextElement(-1);
        break;
      case 'ArrowRight':
        navigateToNextElement(1);
        break;
    }
  };

  const activateCurrentElement = () => {
    if (focusableElements.length === 0) return;
    
    const elementId = focusableElements[currentFocusIndex.current];
    const element = document.querySelector(`[data-testid="${elementId}"]`) as HTMLElement;
    
    if (element) {
      element.click();
    }
  };

  const handleEscape = () => {
    // Find and close any open modals or menus
    const modals = document.querySelectorAll('[data-testid*="modal"], [data-testid*="menu"]');
    modals.forEach(modal => {
      const closeButton = modal.querySelector('[data-testid*="close"], [data-testid*="cancel"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    });
  };

  const handleAccessibilityShortcuts = (key: string, ctrlKey: boolean, altKey: boolean) => {
    // Ctrl+/ or Alt+/ for help
    if ((ctrlKey || altKey) && key === '/') {
      showKeyboardShortcuts();
      return;
    }

    // Ctrl+H for home/farm
    if (ctrlKey && key === 'h') {
      navigateToScreen('Farm');
      return;
    }

    // Ctrl+G for goals
    if (ctrlKey && key === 'g') {
      navigateToScreen('Goals');
      return;
    }

    // Ctrl+E for expenses
    if (ctrlKey && key === 'e') {
      navigateToScreen('Expenses');
      return;
    }

    // Ctrl+I for income
    if (ctrlKey && key === 'i') {
      navigateToScreen('Income');
      return;
    }

    // Ctrl+A for analytics
    if (ctrlKey && key === 'a') {
      navigateToScreen('Analytics');
      return;
    }
  };

  const focusElementById = (elementId: string) => {
    const element = document.querySelector(`[data-testid="${elementId}"]`) as HTMLElement;
    if (element) {
      element.focus();
      
      // Announce focus change for screen readers
      if (Platform.OS === 'ios') {
        const nodeHandle = findNodeHandle(element as any);
        if (nodeHandle) {
          AccessibilityInfo.setAccessibilityFocus(nodeHandle);
        }
      }
    }
  };

  const navigateToScreen = (screenName: string) => {
    // This would integrate with your navigation system
    console.log(`Navigate to ${screenName}`);
  };

  const showKeyboardShortcuts = () => {
    // Show keyboard shortcuts help
    const shortcuts = [
      'Tab / Shift+Tab: Navigate between elements',
      'Arrow Keys: Navigate in grid layouts',
      'Enter / Space: Activate buttons and links',
      'Escape: Close modals and menus',
      'Ctrl+H: Go to Farm',
      'Ctrl+G: Go to Goals',
      'Ctrl+E: Go to Expenses',
      'Ctrl+I: Go to Income',
      'Ctrl+A: Go to Analytics',
      'Ctrl+/: Show this help',
    ];
    
    alert('Keyboard Shortcuts:\n\n' + shortcuts.join('\n'));
  };

  return (
    <View ref={containerRef} style={{ flex: 1 }}>
      {children}
    </View>
  );
};