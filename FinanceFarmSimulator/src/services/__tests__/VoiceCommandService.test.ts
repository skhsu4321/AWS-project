import { VoiceCommandService, VoiceCommand } from '../VoiceCommandService';
import Voice from '@react-native-voice/voice';
import { accessibilityService } from '../AccessibilityService';

// Mock dependencies
jest.mock('@react-native-voice/voice');
jest.mock('../AccessibilityService');

describe('VoiceCommandService', () => {
  let service: VoiceCommandService;
  const mockVoice = Voice as jest.Mocked<typeof Voice>;
  const mockAccessibilityService = accessibilityService as jest.Mocked<typeof accessibilityService>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (VoiceCommandService as any).instance = undefined;
    service = VoiceCommandService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = VoiceCommandService.getInstance();
      const instance2 = VoiceCommandService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('voice recognition lifecycle', () => {
    it('should start listening', async () => {
      mockVoice.start.mockResolvedValue();
      
      await service.startListening();
      
      expect(mockVoice.start).toHaveBeenCalledWith('en-US');
      expect(mockAccessibilityService.speak).toHaveBeenCalledWith('Listening for your command');
    });

    it('should stop listening', async () => {
      mockVoice.stop.mockResolvedValue();
      
      // Set listening state
      await service.startListening();
      await service.stopListening();
      
      expect(mockVoice.stop).toHaveBeenCalled();
    });

    it('should handle start listening error', async () => {
      const error = new Error('Voice recognition failed');
      mockVoice.start.mockRejectedValue(error);
      
      await service.startListening();
      
      expect(mockAccessibilityService.triggerHapticFeedback).toHaveBeenCalledWith('error');
    });
  });

  describe('expense command parsing', () => {
    it('should parse basic expense command', () => {
      const transcript = 'add expense 50 dollars for food';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'ADD_EXPENSE',
        data: {
          amount: 50,
          category: 'food',
          description: undefined,
        },
        confidence: 0.8,
      });
    });

    it('should parse expense command with description', () => {
      const transcript = 'add expense 25.50 for food on lunch at restaurant';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'ADD_EXPENSE',
        data: {
          amount: 25.5,
          category: 'food',
          description: 'lunch at restaurant',
        },
        confidence: 0.8,
      });
    });

    it('should parse expense command without amount', () => {
      const transcript = 'log expense for transport';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'ADD_EXPENSE',
        data: {
          amount: undefined,
          category: 'transport',
          description: undefined,
        },
        confidence: 0.5,
      });
    });

    it('should handle various expense categories', () => {
      const categories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'healthcare', 'education', 'other'];
      
      categories.forEach(category => {
        const transcript = `add expense 100 for ${category}`;
        const command = (service as any).parseVoiceCommand(transcript);
        
        expect(command?.data.category).toBe(category);
      });
    });
  });

  describe('income command parsing', () => {
    it('should parse basic income command', () => {
      const transcript = 'add income 1000 from salary';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'ADD_INCOME',
        data: {
          amount: 1000,
          source: 'salary',
        },
        confidence: 0.8,
      });
    });

    it('should handle various income sources', () => {
      const sources = ['salary', 'freelance', 'bonus', 'investment', 'gift', 'other'];
      
      sources.forEach(source => {
        const transcript = `log income 500 from ${source}`;
        const command = (service as any).parseVoiceCommand(transcript);
        
        expect(command?.data.source).toBe(source);
      });
    });
  });

  describe('goal command parsing', () => {
    it('should parse goal creation command', () => {
      const transcript = 'create goal 5000 for vacation';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'CREATE_GOAL',
        data: {
          targetAmount: 5000,
          title: 'vacation',
        },
        confidence: 0.7,
      });
    });

    it('should parse goal command without amount', () => {
      const transcript = 'new goal for emergency fund';
      const command = (service as any).parseVoiceCommand(transcript);
      
      expect(command).toEqual({
        type: 'CREATE_GOAL',
        data: {
          targetAmount: undefined,
          title: 'emergency fund',
        },
        confidence: 0.4,
      });
    });
  });

  describe('navigation command parsing', () => {
    it('should parse navigation commands', () => {
      const navigationTests = [
        { transcript: 'go to farm', screen: 'Farm' },
        { transcript: 'navigate to goals', screen: 'Goals' },
        { transcript: 'go to expenses', screen: 'Expenses' },
        { transcript: 'navigate to income', screen: 'Income' },
        { transcript: 'go to analytics', screen: 'Analytics' },
        { transcript: 'navigate to settings', screen: 'Settings' },
      ];
      
      navigationTests.forEach(({ transcript, screen }) => {
        const command = (service as any).parseVoiceCommand(transcript);
        
        expect(command).toEqual({
          type: 'NAVIGATE',
          data: { screen },
          confidence: 0.9,
        });
      });
    });
  });

  describe('help command parsing', () => {
    it('should parse help commands', () => {
      const helpTranscripts = ['help', 'what can i say'];
      
      helpTranscripts.forEach(transcript => {
        const command = (service as any).parseVoiceCommand(transcript);
        
        expect(command).toEqual({
          type: 'HELP',
          data: {},
          confidence: 1.0,
        });
      });
    });
  });

  describe('command recognition callbacks', () => {
    it('should handle successful speech recognition', () => {
      const listener = jest.fn();
      service.subscribe(listener);
      
      const mockEvent = {
        value: ['add expense 50 for food'],
      };
      
      (service as any).onSpeechResults(mockEvent);
      
      expect(mockAccessibilityService.triggerHapticFeedback).toHaveBeenCalledWith('success');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_EXPENSE',
          data: expect.objectContaining({
            amount: 50,
            category: 'food',
          }),
        })
      );
    });

    it('should handle unrecognized commands', () => {
      const listener = jest.fn();
      service.subscribe(listener);
      
      const mockEvent = {
        value: ['this is not a valid command'],
      };
      
      (service as any).onSpeechResults(mockEvent);
      
      expect(mockAccessibilityService.triggerHapticFeedback).toHaveBeenCalledWith('warning');
      expect(mockAccessibilityService.speak).toHaveBeenCalledWith(
        "I didn't understand that command. Try saying 'add expense' followed by the amount and category."
      );
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle speech recognition errors', () => {
      const mockError = { error: 'Network error' };
      
      (service as any).onSpeechError(mockError);
      
      expect(mockAccessibilityService.triggerHapticFeedback).toHaveBeenCalledWith('error');
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);
      
      // Simulate command recognition
      const mockEvent = {
        value: ['help'],
      };
      
      (service as any).onSpeechResults(mockEvent);
      expect(listener).toHaveBeenCalled();
      
      // Unsubscribe
      unsubscribe();
      listener.mockClear();
      
      // Simulate another command
      (service as any).onSpeechResults(mockEvent);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should destroy voice recognition properly', async () => {
      mockVoice.destroy.mockResolvedValue();
      mockVoice.removeAllListeners.mockImplementation(() => {});
      
      await service.destroy();
      
      expect(mockVoice.destroy).toHaveBeenCalled();
      expect(mockVoice.removeAllListeners).toHaveBeenCalled();
    });
  });
});