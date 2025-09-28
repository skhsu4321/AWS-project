import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography } from '../common';

interface WeedPullingInterfaceProps {
  onComplete: () => void;
  duration?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WEED_EMOJIS = ['🌿', '🌱', '🍃', '🌾', '🌿', '🌱'];
const SPARKLE_EMOJIS = ['✨', '⭐', '💫', '🌟'];

interface WeedParticle {
  id: string;
  emoji: string;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface SparkleParticle {
  id: string;
  emoji: string;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

export const WeedPullingInterface: React.FC<WeedPullingInterfaceProps> = ({
  onComplete,
  duration = 3000,
}) => {
  const { theme, colorScheme } = useTheme();
  const [weedParticles, setWeedParticles] = useState<WeedParticle[]>([]);
  const [sparkleParticles, setSparkleParticles] = useState<SparkleParticle[]>([]);
  const [pullProgress, setPullProgress] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);
  
  const dragY = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
    return () => {
      // Cleanup animations
      weedParticles.forEach(particle => {
        particle.x.stopAnimation();
        particle.y.stopAnimation();
        particle.rotation.stopAnimation();
        particle.scale.stopAnimation();
        particle.opacity.stopAnimation();
      });
      sparkleParticles.forEach(particle => {
        particle.x.stopAnimation();
        particle.y.stopAnimation();
        particle.scale.stopAnimation();
        particle.opacity.stopAnimation();
      });
    };
  }, []);

  const startAnimation = () => {
    // Fade in background
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Create initial weed particles
    createWeedParticles();
    
    // Auto-complete after duration if not manually completed
    setTimeout(() => {
      if (!showSuccess) {
        completeAnimation();
      }
    }, duration);
  };

  const createWeedParticles = () => {
    const particles: WeedParticle[] = [];
    
    for (let i = 0; i < 8; i++) {
      const particle: WeedParticle = {
        id: `weed-${i}`,
        emoji: WEED_EMOJIS[Math.floor(Math.random() * WEED_EMOJIS.length)],
        x: new Animated.Value(Math.random() * (screenWidth - 60) + 30),
        y: new Animated.Value(screenHeight * 0.6 + Math.random() * 100),
        rotation: new Animated.Value(Math.random() * 360),
        scale: new Animated.Value(0.8 + Math.random() * 0.4),
        opacity: new Animated.Value(1),
      };
      
      particles.push(particle);
      
      // Animate weed swaying
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value + 10,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value - 20,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value + 10,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
    
    setWeedParticles(particles);
  };

  const createSparkleParticles = () => {
    const particles: SparkleParticle[] = [];
    
    for (let i = 0; i < 12; i++) {
      const particle: SparkleParticle = {
        id: `sparkle-${i}`,
        emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)],
        x: new Animated.Value(screenWidth / 2 + (Math.random() - 0.5) * 200),
        y: new Animated.Value(screenHeight / 2 + (Math.random() - 0.5) * 200),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
      };
      
      particles.push(particle);
      
      // Animate sparkle appearance and movement
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1 + Math.random() * 0.5,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 700,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(particle.x, {
          toValue: particle.x._value + (Math.random() - 0.5) * 100,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(particle.y, {
          toValue: particle.y._value - 50 - Math.random() * 100,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
    
    setSparkleParticles(particles);
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationY } = event.nativeEvent;
        const progress = Math.max(0, Math.min(1, -translationY / 200));
        pullProgress.setValue(progress);
        
        if (progress > 0.8 && !showSuccess) {
          completeAnimation();
        }
      }
    }
  );

  const handlePanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      
      if (-translationY > 150) {
        completeAnimation();
      } else {
        // Return to original position
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        
        Animated.spring(pullProgress, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const completeAnimation = () => {
    if (showSuccess) return;
    
    setShowSuccess(true);
    
    // Haptic feedback
    Vibration.vibrate([100, 50, 100]);
    
    // Pull weeds out of screen
    weedParticles.forEach((particle, index) => {
      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: -100,
          duration: 500 + index * 50,
          useNativeDriver: false,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(particle.scale, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    });
    
    // Show success animation
    Animated.sequence([
      Animated.timing(successScale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(successScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Create sparkles
    createSparkleParticles();
    
    // Complete after animation
    setTimeout(() => {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        onComplete();
      });
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(76, 175, 80, 0.9)',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    instructions: {
      position: 'absolute',
      top: '20%',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    instructionText: {
      color: 'white',
      textAlign: 'center',
      fontSize: colorScheme === 'child' ? 24 : 20,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    progressBar: {
      width: 200,
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 4,
      marginTop: theme.spacing.lg,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'white',
      borderRadius: 4,
    },
    weedContainer: {
      position: 'absolute',
      width: screenWidth,
      height: screenHeight,
    },
    weedParticle: {
      position: 'absolute',
      fontSize: 32,
    },
    sparkleParticle: {
      position: 'absolute',
      fontSize: 24,
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    successEmoji: {
      fontSize: 80,
      marginBottom: theme.spacing.lg,
    },
    successText: {
      color: 'white',
      fontSize: colorScheme === 'child' ? 28 : 24,
      fontWeight: 'bold',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    successSubtext: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: colorScheme === 'child' ? 18 : 16,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  const progressWidth = pullProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: backgroundOpacity }
      ]}
    >
      <Animated.View style={styles.background} />
      
      {/* Weed Particles */}
      <View style={styles.weedContainer}>
        {weedParticles.map((particle) => (
          <Animated.Text
            key={particle.id}
            style={[
              styles.weedParticle,
              {
                left: particle.x,
                top: particle.y,
                transform: [
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }) },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            {particle.emoji}
          </Animated.Text>
        ))}
        
        {/* Sparkle Particles */}
        {sparkleParticles.map((particle) => (
          <Animated.Text
            key={particle.id}
            style={[
              styles.sparkleParticle,
              {
                left: particle.x,
                top: particle.y,
                transform: [{ scale: particle.scale }],
                opacity: particle.opacity,
              },
            ]}
          >
            {particle.emoji}
          </Animated.Text>
        ))}
      </View>

      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanHandlerStateChange}
        enabled={!showSuccess}
      >
        <Animated.View style={styles.content}>
          {!showSuccess ? (
            <View style={styles.instructions}>
              <Typography style={styles.instructionText}>
                {colorScheme === 'child' 
                  ? '🌿 Pull the weeds up! 🌿\nSwipe up to clean your garden!'
                  : '🌿 Swipe up to pull weeds! 🌿\nClean up your expenses!'
                }
              </Typography>
              
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: progressWidth }
                  ]} 
                />
              </View>
            </View>
          ) : (
            <Animated.View 
              style={[
                styles.successContainer,
                { transform: [{ scale: successScale }] }
              ]}
            >
              <Typography style={styles.successEmoji}>🎉</Typography>
              <Typography style={styles.successText}>
                {colorScheme === 'child' 
                  ? 'Great job!\nYour garden is clean!'
                  : 'Expense logged!\nWell done!'
                }
              </Typography>
              <Typography style={styles.successSubtext}>
                {colorScheme === 'child' 
                  ? 'Keep pulling weeds to grow your savings!'
                  : 'Keep tracking to reach your goals!'
                }
              </Typography>
            </Animated.View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};