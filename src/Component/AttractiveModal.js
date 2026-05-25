import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { s, vs, ms } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

const AttractiveModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    onPress: () => {},
    buttonText: 'OK',
    type: 'warning', // 'warning', 'error', 'success'
  });

  const [scaleValue] = useState(new Animated.Value(0));

  useImperativeHandle(ref, () => ({
    show: ({ title, message, onPress, buttonText = 'OK', type = 'warning' }) => {
      setConfig({ title, message, onPress, buttonText, type });
      setVisible(true);
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }).start();
    },
    hide: () => {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    },
  }));

  const getGradientColors = () => {
    switch (config.type) {
      case 'error':
        return ['#FF416C', '#FF4B2B'];
      case 'success':
        return ['#11998e', '#38ef7d'];
      case 'warning':
      default:
        return ['#F2994A', '#F2C94C'];
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>!</Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.titleText}>{config.title}</Text>
            <Text style={styles.messageText}>{config.message}</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Animated.timing(scaleValue, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setVisible(false);
                  if (config.onPress) config.onPress();
                });
              }}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={getGradientColors()}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>{config.buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: ms(20),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    height: vs(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  iconText: {
    fontSize: ms(30),
    fontWeight: 'bold',
    color: '#FFF',
  },
  body: {
    padding: ms(20),
    alignItems: 'center',
  },
  titleText: {
    fontSize: ms(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: vs(10),
    textAlign: 'center',
  },
  messageText: {
    fontSize: ms(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: vs(20),
    marginBottom: vs(20),
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: vs(45),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: ms(16),
    fontWeight: 'bold',
  },
});

export default AttractiveModal;
