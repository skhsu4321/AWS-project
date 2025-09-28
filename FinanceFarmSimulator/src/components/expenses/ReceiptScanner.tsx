import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Typography, Button } from '../common';
import { ExpenseCategory } from '../../models/Financial';

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: { amount?: number; description?: string; category?: ExpenseCategory; image?: string }) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const { theme, colorScheme } = useTheme();
  const cameraRef = useRef<Camera>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaLibraryStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are required to scan receipts.',
          [
            { text: 'Cancel', onPress: onClose },
            { text: 'Settings', onPress: () => {/* Open settings */} },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (photo) {
        await processReceiptImage(photo.uri, photo.base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsProcessing(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await processReceiptImage(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processReceiptImage = async (imageUri: string, base64?: string) => {
    try {
      // For now, we'll simulate OCR processing
      // In a real implementation, you would use ML Kit or a similar service
      const mockOCRResult = await simulateOCR(imageUri);
      
      onScan({
        ...mockOCRResult,
        image: base64 ? `data:image/jpeg;base64,${base64}` : imageUri,
      });
      
      onClose();
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Failed to process receipt. Please enter details manually.');
    }
  };

  // Simulate OCR processing - in real implementation, use ML Kit or cloud OCR
  const simulateOCR = async (imageUri: string): Promise<{ amount?: number; description?: string; category?: ExpenseCategory }> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock OCR results - in real implementation, this would analyze the image
    const mockResults = [
      { amount: 25.50, description: 'Restaurant meal', category: ExpenseCategory.FOOD },
      { amount: 15.00, description: 'Coffee shop', category: ExpenseCategory.FOOD },
      { amount: 45.99, description: 'Grocery store', category: ExpenseCategory.FOOD },
      { amount: 12.50, description: 'Bus ticket', category: ExpenseCategory.TRANSPORT },
      { amount: 89.99, description: 'Clothing store', category: ExpenseCategory.SHOPPING },
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === FlashMode.off ? FlashMode.on : FlashMode.off);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : theme.spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
    },
    headerTitle: {
      color: 'white',
      flex: 1,
      textAlign: 'center',
    },
    headerButton: {
      padding: theme.spacing.sm,
    },
    headerButtonText: {
      color: 'white',
      fontSize: 18,
    },
    cameraContainer: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanFrame: {
      width: screenWidth * 0.8,
      height: screenHeight * 0.6,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: 'transparent',
    },
    scanFrameCorners: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: theme.colors.primary,
      borderWidth: 4,
    },
    cornerTopLeft: {
      top: -2,
      left: -2,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    cornerTopRight: {
      top: -2,
      right: -2,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    cornerBottomLeft: {
      bottom: -2,
      left: -2,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    cornerBottomRight: {
      bottom: -2,
      right: -2,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    instructions: {
      position: 'absolute',
      bottom: 200,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    instructionText: {
      color: 'white',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginHorizontal: theme.spacing.lg,
    },
    controls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: theme.spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.lg,
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'white',
    },
    controlIcon: {
      color: 'white',
      fontSize: 24,
    },
    captureIcon: {
      color: 'white',
      fontSize: 32,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    permissionIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    permissionTitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    permissionDescription: {
      textAlign: 'center',
      color: theme.colors.outline,
      marginBottom: theme.spacing.xl,
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    processingText: {
      color: 'white',
      marginTop: theme.spacing.lg,
      textAlign: 'center',
    },
  });

  if (hasPermission === null) {
    return (
      <Modal visible={visible} onClose={onClose}>
        <View style={styles.permissionContainer}>
          <Typography style={styles.permissionIcon}>📷</Typography>
          <Typography variant="h2" style={styles.permissionTitle}>
            Requesting Permissions
          </Typography>
          <Typography variant="body1" style={styles.permissionDescription}>
            Please allow camera and photo library access to scan receipts.
          </Typography>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} onClose={onClose}>
        <View style={styles.permissionContainer}>
          <Typography style={styles.permissionIcon}>🚫</Typography>
          <Typography variant="h2" style={styles.permissionTitle}>
            Camera Access Required
          </Typography>
          <Typography variant="body1" style={styles.permissionDescription}>
            To scan receipts, please enable camera and photo library permissions in your device settings.
          </Typography>
          <Button
            title="Close"
            onPress={onClose}
            variant="primary"
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} onClose={onClose} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Typography style={styles.headerButtonText}>✕</Typography>
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            {colorScheme === 'child' ? '📸 Scan Your Receipt' : 'Receipt Scanner'}
          </Typography>
          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Typography style={styles.headerButtonText}>
              {flashMode === FlashMode.off ? '🔦' : '💡'}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Camera */}
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
          >
            {/* Scan Frame Overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanFrameCorners, styles.cornerTopLeft]} />
                <View style={[styles.scanFrameCorners, styles.cornerTopRight]} />
                <View style={[styles.scanFrameCorners, styles.cornerBottomLeft]} />
                <View style={[styles.scanFrameCorners, styles.cornerBottomRight]} />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Typography variant="body1" style={styles.instructionText}>
                {colorScheme === 'child' 
                  ? 'Point your camera at the receipt and tap the button to scan! 📸'
                  : 'Position the receipt within the frame and tap to capture'
                }
              </Typography>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.controlButton} onPress={pickFromGallery}>
                  <Typography style={styles.controlIcon}>🖼️</Typography>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={takePicture}
                  disabled={isProcessing}
                >
                  <Typography style={styles.captureIcon}>
                    {isProcessing ? '⏳' : '📷'}
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.controlButton} 
                  onPress={() => setCameraType(
                    cameraType === CameraType.back ? CameraType.front : CameraType.back
                  )}
                >
                  <Typography style={styles.controlIcon}>🔄</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Typography style={styles.processingText}>
              {colorScheme === 'child' 
                ? '🔍 Reading your receipt...\nThis might take a moment!'
                : '🔍 Processing receipt...\nExtracting expense details'
              }
            </Typography>
          </View>
        )}
      </View>
    </Modal>
  );
};