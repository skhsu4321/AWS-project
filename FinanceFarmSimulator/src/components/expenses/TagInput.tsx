import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography } from '../common';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  maxTags = 10,
}) => {
  const { theme, colorScheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const commonTags = colorScheme === 'child' 
    ? ['allowance', 'chores', 'treats', 'toys', 'school', 'friends']
    : ['recurring', 'work', 'personal', 'urgent', 'planned', 'unexpected'];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (trimmedTag && 
        !tags.includes(trimmedTag) && 
        tags.length < maxTags &&
        trimmedTag.length <= 20) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'Enter' || key === ',') {
      handleInputSubmit();
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
      fontWeight: '600',
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: isFocused ? theme.colors.primary : theme.colors.outline,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surface,
      minHeight: 56,
      padding: theme.spacing.sm,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.sm,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.dimensions.borderRadius.small,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      maxWidth: 120,
    },
    tagText: {
      ...theme.typography.caption,
      color: theme.colors.onPrimaryContainer,
      fontWeight: '500',
      flex: 1,
    },
    removeTagButton: {
      marginLeft: theme.spacing.xs,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.onPrimaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeTagText: {
      color: theme.colors.primaryContainer,
      fontSize: 10,
      fontWeight: 'bold',
    },
    textInput: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      minHeight: 40,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    commonTagsContainer: {
      marginTop: theme.spacing.md,
    },
    commonTagsLabel: {
      ...theme.typography.caption,
      color: theme.colors.outline,
      marginBottom: theme.spacing.sm,
    },
    commonTagsScroll: {
      maxHeight: 80,
    },
    commonTagsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    commonTag: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.dimensions.borderRadius.small,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    selectedCommonTag: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    commonTagText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    selectedCommonTagText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    helperText: {
      ...theme.typography.caption,
      color: theme.colors.outline,
      marginTop: theme.spacing.xs,
    },
    tagCounter: {
      ...theme.typography.caption,
      color: tags.length >= maxTags ? theme.colors.error : theme.colors.outline,
      textAlign: 'right',
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Typography style={styles.label}>
        {colorScheme === 'child' ? '🏷️ Add labels (optional)' : '🏷️ Tags (optional)'}
      </Typography>

      <View style={styles.inputContainer}>
        {/* Existing Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Typography style={styles.tagText} numberOfLines={1}>
                  {tag}
                </Typography>
                <TouchableOpacity
                  style={styles.removeTagButton}
                  onPress={() => removeTag(tag)}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Typography style={styles.removeTagText}>×</Typography>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleInputSubmit}
          placeholder={tags.length >= maxTags ? 'Maximum tags reached' : placeholder}
          placeholderTextColor={theme.colors.outline}
          editable={tags.length < maxTags}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>

      {/* Helper Text */}
      <Typography style={styles.helperText}>
        {colorScheme === 'child' 
          ? 'Press "Done" to add a label. Labels help you find expenses later!'
          : 'Press Enter or comma to add tags. Use tags to organize and search expenses.'
        }
      </Typography>

      {/* Tag Counter */}
      <Typography style={styles.tagCounter}>
        {tags.length}/{maxTags} tags
      </Typography>

      {/* Common Tags */}
      <View style={styles.commonTagsContainer}>
        <Typography style={styles.commonTagsLabel}>
          {colorScheme === 'child' ? 'Quick labels:' : 'Suggested tags:'}
        </Typography>
        <ScrollView 
          style={styles.commonTagsScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.commonTagsGrid}>
            {commonTags.map((tag, index) => {
              const isSelected = tags.includes(tag);
              const canAdd = !isSelected && tags.length < maxTags;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.commonTag,
                    isSelected && styles.selectedCommonTag,
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      removeTag(tag);
                    } else if (canAdd) {
                      addTag(tag);
                    }
                  }}
                  disabled={!isSelected && !canAdd}
                  activeOpacity={0.7}
                >
                  <Typography 
                    style={[
                      styles.commonTagText,
                      isSelected && styles.selectedCommonTagText,
                    ]}
                  >
                    {isSelected ? `✓ ${tag}` : tag}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};