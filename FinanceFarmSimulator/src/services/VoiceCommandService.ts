import Voice, { SpeechRecognizedEvent, SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { accessibilityService } from './AccessibilityService';

export interface VoiceCommand {
  type: 'ADD_EXPENSE' | 'ADD_INCOME' | 'CREATE_GOAL' | 'NAVIGATE' | 'HELP';
  data: any;
  confidence: number;
}

export interface ExpenseVoiceData {
  amount?: number;
  category?: string;
  description?: string;
}

export class VoiceCommandService {
  private static instance: VoiceCommandService;
  private isListening = false;
  private listeners: ((command: VoiceCommand) => void)[] = [];

  private constructor() {
    this.initializeVoice();
  }

  public static getInstance(): VoiceCommandService {
    if (!VoiceCommandService.instance) {
      VoiceCommandService.instance = new VoiceCommandService();
    }
    return VoiceCommandService.instance;
  }

  private initializeVoice(): void {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
  }

  private onSpeechStart(): void {
    console.log('Voice recognition started');
    accessibilityService.triggerHapticFeedback('light');
  }

  private onSpeechRecognized(): void {
    console.log('Speech recognized');
  }

  private onSpeechEnd(): void {
    console.log('Voice recognition ended');
    this.isListening = false;
  }

  private onSpeechError(error: SpeechErrorEvent): void {
    console.error('Voice recognition error:', error);
    this.isListening = false;
    accessibilityService.triggerHapticFeedback('error');
  }

  private onSpeechResults(event: SpeechResultsEvent): void {
    if (event.value && event.value.length > 0) {
      const transcript = event.value[0];
      const command = this.parseVoiceCommand(transcript);
      
      if (command) {
        accessibilityService.triggerHapticFeedback('success');
        this.notifyListeners(command);
      } else {
        accessibilityService.triggerHapticFeedback('warning');
        accessibilityService.speak("I didn't understand that command. Try saying 'add expense' followed by the amount and category.");
      }
    }
  }

  private parseVoiceCommand(transcript: string): VoiceCommand | null {
    const lowerTranscript = transcript.toLowerCase();
    
    // Parse expense commands
    if (lowerTranscript.includes('add expense') || lowerTranscript.includes('log expense')) {
      return this.parseExpenseCommand(lowerTranscript);
    }
    
    // Parse income commands
    if (lowerTranscript.includes('add income') || lowerTranscript.includes('log income')) {
      return this.parseIncomeCommand(lowerTranscript);
    }
    
    // Parse goal commands
    if (lowerTranscript.includes('create goal') || lowerTranscript.includes('new goal')) {
      return this.parseGoalCommand(lowerTranscript);
    }
    
    // Parse navigation commands
    if (lowerTranscript.includes('go to') || lowerTranscript.includes('navigate to')) {
      return this.parseNavigationCommand(lowerTranscript);
    }
    
    // Parse help commands
    if (lowerTranscript.includes('help') || lowerTranscript.includes('what can i say')) {
      return {
        type: 'HELP',
        data: {},
        confidence: 1.0,
      };
    }
    
    return null;
  }

  private parseExpenseCommand(transcript: string): VoiceCommand | null {
    const expenseData: ExpenseVoiceData = {};
    
    // Extract amount using regex
    const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|hkd|hong kong dollars?)?/i);
    if (amountMatch) {
      expenseData.amount = parseFloat(amountMatch[1]);
    }
    
    // Extract category
    const categories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'healthcare', 'education', 'other'];
    for (const category of categories) {
      if (transcript.includes(category)) {
        expenseData.category = category;
        break;
      }
    }
    
    // Extract description (everything after "for" or "on")
    const descriptionMatch = transcript.match(/(?:for|on)\s+(.+?)(?:\s+\d+|$)/i);
    if (descriptionMatch) {
      expenseData.description = descriptionMatch[1].trim();
    }
    
    return {
      type: 'ADD_EXPENSE',
      data: expenseData,
      confidence: amountMatch ? 0.8 : 0.5,
    };
  }

  private parseIncomeCommand(transcript: string): VoiceCommand | null {
    const incomeData: any = {};
    
    // Extract amount
    const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|hkd|hong kong dollars?)?/i);
    if (amountMatch) {
      incomeData.amount = parseFloat(amountMatch[1]);
    }
    
    // Extract source
    const sources = ['salary', 'freelance', 'bonus', 'investment', 'gift', 'other'];
    for (const source of sources) {
      if (transcript.includes(source)) {
        incomeData.source = source;
        break;
      }
    }
    
    return {
      type: 'ADD_INCOME',
      data: incomeData,
      confidence: amountMatch ? 0.8 : 0.5,
    };
  }

  private parseGoalCommand(transcript: string): VoiceCommand | null {
    const goalData: any = {};
    
    // Extract amount
    const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|hkd|hong kong dollars?)?/i);
    if (amountMatch) {
      goalData.targetAmount = parseFloat(amountMatch[1]);
    }
    
    // Extract goal name (everything after "for" or "called")
    const nameMatch = transcript.match(/(?:for|called)\s+(.+?)(?:\s+\d+|$)/i);
    if (nameMatch) {
      goalData.title = nameMatch[1].trim();
    }
    
    return {
      type: 'CREATE_GOAL',
      data: goalData,
      confidence: amountMatch ? 0.7 : 0.4,
    };
  }

  private parseNavigationCommand(transcript: string): VoiceCommand | null {
    const screens = {
      'farm': 'Farm',
      'goals': 'Goals',
      'expenses': 'Expenses',
      'income': 'Income',
      'analytics': 'Analytics',
      'settings': 'Settings',
    };
    
    for (const [keyword, screen] of Object.entries(screens)) {
      if (transcript.includes(keyword)) {
        return {
          type: 'NAVIGATE',
          data: { screen },
          confidence: 0.9,
        };
      }
    }
    
    return null;
  }

  public async startListening(): Promise<void> {
    if (this.isListening) return;
    
    try {
      await Voice.start('en-US');
      this.isListening = true;
      accessibilityService.speak("Listening for your command");
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      accessibilityService.triggerHapticFeedback('error');
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.isListening) return;
    
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public subscribe(listener: (command: VoiceCommand) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(command: VoiceCommand): void {
    this.listeners.forEach(listener => listener(command));
  }

  public async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (error) {
      console.error('Failed to destroy voice service:', error);
    }
  }
}

export const voiceCommandService = VoiceCommandService.getInstance();