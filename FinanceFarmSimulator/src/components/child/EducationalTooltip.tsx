import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ChildButton} from './ChildButton';

export interface EducationalContent {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  example: string;
  funFact?: string;
  relatedConcepts?: string[];
}

export interface EducationalTooltipProps {
  concept: string;
  children: React.ReactNode;
  content?: EducationalContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const EducationalTooltip: React.FC<EducationalTooltipProps> = ({
  concept,
  children,
  content,
  position = 'top',
}) => {
  const {theme, colorScheme} = useTheme();
  const [showModal, setShowModal] = useState(false);
  const isChildMode = colorScheme === 'child';

  // Default educational content for common financial concepts
  const getDefaultContent = (concept: string): EducationalContent => {
    const defaultContents: Record<string, EducationalContent> = {
      savings: {
        id: 'savings',
        title: 'What is Saving? 💰',
        concept: 'Savings',
        explanation: 'Saving means keeping some of your money instead of spending it all right away. It\'s like putting money in a special place so you can use it later for something important or fun!',
        example: 'If you get $10 and save $3, you still have $7 to spend now, but you also have $3 saved for later. Maybe you want to buy a toy that costs $15 - you can save a little each week until you have enough!',
        funFact: 'Did you know that even small amounts add up? If you save just $1 every week, you\'ll have $52 after one year! 🎉',
        relatedConcepts: ['goals', 'interest', 'budget'],
      },
      budget: {
        id: 'budget',
        title: 'What is a Budget? 📊',
        concept: 'Budget',
        explanation: 'A budget is like a plan for your money. It helps you decide how much to spend on different things and how much to save. Think of it like planning how to use your allowance!',
        example: 'If you get $10 allowance: maybe $3 for snacks, $2 for toys, $2 for saving, and $3 for something special later. That\'s your budget!',
        funFact: 'Even grown-ups use budgets to make sure they have enough money for everything they need! 👨‍👩‍👧‍👦',
        relatedConcepts: ['savings', 'expenses', 'income'],
      },
      expenses: {
        id: 'expenses',
        title: 'What are Expenses? 💸',
        concept: 'Expenses',
        explanation: 'Expenses are things you spend money on. Some expenses are needs (like food) and some are wants (like toys). It\'s important to know the difference!',
        example: 'Needs: lunch, school supplies, clothes. Wants: candy, video games, extra toys. Both are okay, but needs come first!',
        funFact: 'In our farm game, expenses are like weeds - if you spend too much, it can slow down your savings goals! 🌱',
        relatedConcepts: ['budget', 'needs vs wants', 'savings'],
      },
      income: {
        id: 'income',
        title: 'What is Income? 💵',
        concept: 'Income',
        explanation: 'Income is money that comes to you. For kids, this might be allowance, money from chores, or gifts. For grown-ups, it\'s usually from their job!',
        example: 'Your weekly allowance of $5, plus $2 for helping with dishes, plus $3 birthday money = $10 total income this week!',
        funFact: 'In our farm game, income is like fertilizer - it helps your savings goals grow faster! 🌱✨',
        relatedConcepts: ['chores', 'allowance', 'savings'],
      },
      interest: {
        id: 'interest',
        title: 'What is Interest? 📈',
        concept: 'Interest',
        explanation: 'Interest is extra money you can earn just by saving! When you put money in a savings account, the bank pays you a little extra money as a "thank you" for letting them use your money.',
        example: 'If you save $100 and the bank gives you 1% interest per year, after one year you\'ll have $101 - you earned $1 just for saving!',
        funFact: 'Albert Einstein called compound interest "the eighth wonder of the world" because your money can grow and grow! 🤯',
        relatedConcepts: ['savings', 'compound interest', 'banks'],
      },
      goals: {
        id: 'goals',
        title: 'What are Financial Goals? 🎯',
        concept: 'Financial Goals',
        explanation: 'A financial goal is something you want to buy or save for in the future. Having goals helps you stay motivated to save your money instead of spending it all right away!',
        example: 'Maybe you want to buy a $30 video game. That\'s your goal! If you save $3 every week, you\'ll reach your goal in 10 weeks.',
        funFact: 'People who write down their goals are much more likely to achieve them! 📝✨',
        relatedConcepts: ['savings', 'planning', 'delayed gratification'],
      },
    };

    return defaultContents[concept.toLowerCase()] || {
      id: concept,
      title: `About ${concept}`,
      concept,
      explanation: `${concept} is an important financial concept that helps you manage your money better.`,
      example: 'Ask a grown-up to help explain this concept with real examples from your life!',
      funFact: 'Learning about money when you\'re young helps you make smart decisions when you\'re older! 🧠',
    };
  };

  const tooltipStyles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    helpIcon: {
      marginLeft: theme.spacing.xs,
      width: isChildMode ? 24 : 20,
      height: isChildMode ? 24 : 20,
      borderRadius: isChildMode ? 12 : 10,
      backgroundColor: theme.colors.info,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpIconText: {
      color: '#FFFFFF',
      fontSize: isChildMode ? 14 : 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      width: '90%',
      maxWidth: 500,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h4,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
      ...(isChildMode && {
        fontSize: theme.typography.h4.fontSize + 1,
        fontWeight: '700',
      }),
    },
    text: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      lineHeight: theme.typography.body1.lineHeight * 1.2,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 1,
      }),
    },
    exampleContainer: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
        borderWidth: 2,
        borderColor: theme.colors.primary,
      }),
    },
    exampleText: {
      ...theme.typography.body2,
      color: '#FFFFFF',
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        fontWeight: '600',
      }),
    },
    funFactContainer: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
        borderWidth: 2,
        borderColor: theme.colors.secondaryDark,
      }),
    },
    funFactText: {
      ...theme.typography.body2,
      color: '#333333',
      fontWeight: '600',
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        fontWeight: '700',
      }),
    },
    relatedContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    relatedTag: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.dimensions.borderRadius.small,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.medium,
      }),
    },
    relatedTagText: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
      }),
    },
    closeButton: {
      marginTop: theme.spacing.lg,
    },
  });

  const educationalContent = content || getDefaultContent(concept);

  return (
    <View style={tooltipStyles.container}>
      <TouchableOpacity
        style={tooltipStyles.trigger}
        onPress={() => setShowModal(true)}
        accessibilityLabel={`Learn about ${concept}`}
        accessibilityRole="button"
      >
        {children}
        <View style={tooltipStyles.helpIcon}>
          <Text style={tooltipStyles.helpIconText}>?</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={tooltipStyles.modalOverlay}>
          <View style={tooltipStyles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={tooltipStyles.title}>
                {educationalContent.title}
              </Text>

              <View style={tooltipStyles.section}>
                <Text style={tooltipStyles.sectionTitle}>
                  📚 What is it?
                </Text>
                <Text style={tooltipStyles.text}>
                  {educationalContent.explanation}
                </Text>
              </View>

              <View style={tooltipStyles.section}>
                <Text style={tooltipStyles.sectionTitle}>
                  💡 Example
                </Text>
                <View style={tooltipStyles.exampleContainer}>
                  <Text style={tooltipStyles.exampleText}>
                    {educationalContent.example}
                  </Text>
                </View>
              </View>

              {educationalContent.funFact && (
                <View style={tooltipStyles.section}>
                  <Text style={tooltipStyles.sectionTitle}>
                    🤔 Fun Fact
                  </Text>
                  <View style={tooltipStyles.funFactContainer}>
                    <Text style={tooltipStyles.funFactText}>
                      {educationalContent.funFact}
                    </Text>
                  </View>
                </View>
              )}

              {educationalContent.relatedConcepts && educationalContent.relatedConcepts.length > 0 && (
                <View style={tooltipStyles.section}>
                  <Text style={tooltipStyles.sectionTitle}>
                    🔗 Related Topics
                  </Text>
                  <View style={tooltipStyles.relatedContainer}>
                    {educationalContent.relatedConcepts.map((related, index) => (
                      <View key={index} style={tooltipStyles.relatedTag}>
                        <Text style={tooltipStyles.relatedTagText}>
                          {related}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <ChildButton
              title={isChildMode ? "Got it! 👍" : "Close"}
              onPress={() => setShowModal(false)}
              variant="primary"
              style={tooltipStyles.closeButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};