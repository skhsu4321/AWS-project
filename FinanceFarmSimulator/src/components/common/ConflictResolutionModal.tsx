import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConflictData, ConflictResolution } from '../../services/ConflictResolutionService';
import { selectPendingConflicts, resolveConflict } from '../../store/slices/syncSlice';
import { colors, spacing, typography } from '../../theme';
import { useOfflineSync } from '../../hooks/useOfflineSync';

interface ConflictResolutionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch();
  const conflicts = useSelector(selectPendingConflicts);
  const { resolveConflict: resolveConflictHook } = useOfflineSync();
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolveConflict = async (
    conflict: ConflictData,
    resolution: ConflictResolution
  ) => {
    setIsResolving(true);
    try {
      await resolveConflictHook(conflict.id, resolution);
      dispatch(resolveConflict(conflict.id));
      
      if (conflicts.length <= 1) {
        onClose();
      } else {
        setSelectedConflict(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conflict. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveAll = async (strategy: 'USE_LOCAL' | 'USE_REMOTE' | 'AUTO_MERGE') => {
    Alert.alert(
      'Resolve All Conflicts',
      `Are you sure you want to resolve all conflicts using the "${strategy}" strategy?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsResolving(true);
            try {
              for (const conflict of conflicts) {
                const resolution: ConflictResolution = {
                  action: strategy,
                  reason: `Bulk resolution using ${strategy} strategy`,
                };
                await resolveConflictHook(conflict.id, resolution);
                dispatch(resolveConflict(conflict.id));
              }
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve all conflicts.');
            } finally {
              setIsResolving(false);
            }
          },
        },
      ]
    );
  };

  const renderConflictItem = (conflict: ConflictData) => (
    <TouchableOpacity
      key={conflict.id}
      style={styles.conflictItem}
      onPress={() => setSelectedConflict(conflict)}
    >
      <View style={styles.conflictHeader}>
        <Text style={styles.conflictTitle}>
          {conflict.table} - {conflict.conflictType.replace('_', ' ')}
        </Text>
        <Text style={styles.conflictTime}>
          {new Date(conflict.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.conflictDescription}>
        Data conflict detected for {conflict.localData?.id || conflict.remoteData?.id}
      </Text>
    </TouchableOpacity>
  );

  const renderConflictDetails = (conflict: ConflictData) => (
    <View style={styles.conflictDetails}>
      <Text style={styles.detailsTitle}>Conflict Details</Text>
      
      <View style={styles.dataComparison}>
        <View style={styles.dataColumn}>
          <Text style={styles.dataColumnTitle}>Local Data</Text>
          <ScrollView style={styles.dataContainer}>
            <Text style={styles.dataText}>
              {JSON.stringify(conflict.localData, null, 2)}
            </Text>
          </ScrollView>
        </View>
        
        <View style={styles.dataColumn}>
          <Text style={styles.dataColumnTitle}>Remote Data</Text>
          <ScrollView style={styles.dataContainer}>
            <Text style={styles.dataText}>
              {JSON.stringify(conflict.remoteData, null, 2)}
            </Text>
          </ScrollView>
        </View>
      </View>
      
      <View style={styles.resolutionButtons}>
        <Button
          title="Use Local"
          onPress={() => handleResolveConflict(conflict, {
            action: 'USE_LOCAL',
            reason: 'User chose local data',
          })}
          style={styles.resolutionButton}
          disabled={isResolving}
        />
        
        <Button
          title="Use Remote"
          onPress={() => handleResolveConflict(conflict, {
            action: 'USE_REMOTE',
            reason: 'User chose remote data',
          })}
          style={styles.resolutionButton}
          disabled={isResolving}
        />
        
        <Button
          title="Auto Merge"
          onPress={() => handleResolveConflict(conflict, {
            action: 'MERGE',
            reason: 'User chose automatic merge',
          })}
          style={styles.resolutionButton}
          disabled={isResolving}
        />
      </View>
      
      <Button
        title="Back to List"
        onPress={() => setSelectedConflict(null)}
        variant="outline"
        style={styles.backButton}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Sync Conflicts"
      size="large"
    >
      <View style={styles.container}>
        {conflicts.length === 0 ? (
          <View style={styles.noConflictsContainer}>
            <Text style={styles.noConflictsText}>No sync conflicts</Text>
            <Text style={styles.noConflictsSubtext}>
              All your data is synchronized successfully
            </Text>
          </View>
        ) : selectedConflict ? (
          renderConflictDetails(selectedConflict)
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.conflictCount}>
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found
              </Text>
              
              <View style={styles.bulkActions}>
                <Button
                  title="Use All Local"
                  onPress={() => handleResolveAll('USE_LOCAL')}
                  size="small"
                  variant="outline"
                  disabled={isResolving}
                />
                <Button
                  title="Use All Remote"
                  onPress={() => handleResolveAll('USE_REMOTE')}
                  size="small"
                  variant="outline"
                  disabled={isResolving}
                />
                <Button
                  title="Auto Merge All"
                  onPress={() => handleResolveAll('AUTO_MERGE')}
                  size="small"
                  disabled={isResolving}
                />
              </View>
            </View>
            
            <ScrollView style={styles.conflictsList}>
              {conflicts.map(renderConflictItem)}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: '80%',
  },
  header: {
    marginBottom: spacing.lg,
  },
  conflictCount: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  conflictsList: {
    flex: 1,
  },
  conflictItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  conflictTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  conflictTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  conflictDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  conflictDetails: {
    flex: 1,
  },
  detailsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  dataComparison: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
    marginBottom: spacing.lg,
  },
  dataColumn: {
    flex: 1,
  },
  dataColumnTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  dataContainer: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.sm,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataText: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  resolutionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  resolutionButton: {
    flex: 1,
  },
  backButton: {
    alignSelf: 'center',
  },
  noConflictsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noConflictsText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noConflictsSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});