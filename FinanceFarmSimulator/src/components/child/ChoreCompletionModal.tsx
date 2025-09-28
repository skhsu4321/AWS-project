import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {Chore} from '../../models/ParentalControl';
import {ChildButton} from './ChildButton';
import {RewardAnimation} from './RewardAnimation';

export interface ChoreCompletionModalProps {
  visible: boolean;
  chore: Chore | null;
  onClose: () => void;
  onSubmit: (choreId: string, notes?: string) => void;
}

export const ChoreCompletionModal: React.FC<ChoreCompletionModalProps> = ({
  visible,
  chore,
  onClose,
  onSubmit,
}) => {
  const {theme, colorScheme} = useTheme();
  const [notes, setNotes] = useState('');
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const isChildMode = colorScheme === 'child';

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      width: '90%',
      maxWidth: 400,
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
      marginBottom: theme.spacing.md,
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    choreTitle: {
      ...theme.typography.h4,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.h4.fontSize + 2,
        fontWeight: '700',
      }),
    },
    rewardContainer: {
      backgroundColor: theme.colors.success,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.primaryDark,
      }),
    },
    rewardText: {
      ...theme.typography.body1,
      color: '#FFFFFF',
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
        fontWeight: '700',
      }),
    },
    rewardAmount: {
      ...theme.typography.h2,
      color: '#FFFFFF',
      fontWeight: '700',
      ...(isChildMode && {
        fontSize: theme.typography.h2.fontSize + 4,
      }),
    },
    notesLabel: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        fontWeight: '600',
      }),
    },
    notesInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.dimensions.borderRadius.medium,
      borderWidth: isChildMode ? 2 : 1,
      borderColor: theme.colors.outline,
      padding: theme.spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
      ...theme.typography.body2,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        borderRadius: theme.dimensions.borderRadius.large,
      }),
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    approvalNote: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
      }),
    },
    approvalNoteText: {
      ...theme.typography.body2,
      color: '#333333',
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        fontWeight: '600',
      }),
    },
  });

  const handleSubmit = () => {
    if (!chore) return;
    
    setShowRewardAnimation(true);
    
    // Show animation for 2 seconds, then submit
    setTimeout(() => {
      onSubmit(chore.id, notes.trim() || undefined);
      setNotes('');
      setShowRewardAnimation(false);
    }, 2000);
  };

  const handleClose = () => {
    setNotes('');
    setShowRewardAnimation(false);
    onClose();
  };

  if (!chore) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {showRewardAnimation ? (
            <RewardAnimation
              reward={{
                type: 'money',
                amount: chore.reward,
                title: 'Great job!',
                description: 'You completed your chore!',
              }}
              onComplete={() => {}}
            />
          ) : (
            <>
              <Text style={modalStyles.title}>
                {isChildMode ? '🎉 Awesome Work!' : 'Complete Chore'}
              </Text>
              
              <Text style={modalStyles.choreTitle}>"{chore.title}"</Text>
              
              <View style={modalStyles.rewardContainer}>
                <Text style={modalStyles.rewardText}>
                  {isChildMode ? 'You will earn:' : 'Reward:'}
                </Text>
                <Text style={modalStyles.rewardAmount}>
                  ${chore.reward.toFixed(2)}
                </Text>
              </View>
              
              <View style={modalStyles.approvalNote}>
                <Text style={modalStyles.approvalNoteText}>
                  {isChildMode 
                    ? '👨‍👩‍👧‍👦 Your parents will check your work and approve your reward!'
                    : 'This chore will need parental approval before the reward is added.'
                  }
                </Text>
              </View>
              
              <Text style={modalStyles.notesLabel}>
                {isChildMode 
                  ? 'Tell your parents what you did! (optional)'
                  : 'Add notes about completion (optional):'
                }
              </Text>
              
              <TextInput
                style={modalStyles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={isChildMode 
                  ? "I cleaned my room and put all my toys away!"
                  : "Add any notes about how you completed this chore..."
                }
                placeholderTextColor={theme.colors.outline}
                multiline
                maxLength={200}
              />
              
              <View style={modalStyles.buttonContainer}>
                <ChildButton
                  title="Cancel"
                  onPress={handleClose}
                  variant="secondary"
                  style={modalStyles.button}
                />
                <ChildButton
                  title={isChildMode ? "I'm Done! 🎉" : "Mark Complete"}
                  onPress={handleSubmit}
                  variant="fun"
                  style={modalStyles.button}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};