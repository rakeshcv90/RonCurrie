import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { vs, ms } from 'react-native-size-matters';
import { useNetInfo } from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

const NetworkStatus = () => {
  const netInfo = useNetInfo();
  const [isConnected, setIsConnected] = useState(true);
  const [scaleValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (netInfo.isConnected === false) {
      setIsConnected(false);
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }).start();
    } else if (netInfo.isConnected === true) {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsConnected(true));
    }
  }, [netInfo.isConnected, scaleValue]);

  if (isConnected) return null;

  return (
    <Modal visible={!isConnected} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <LinearGradient
            colors={['#FF416C', '#FF4B2B']} // error colors
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>!</Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.titleText}>No Internet Connection</Text>
            <Text style={styles.messageText}>
              Please check your internet connection. This popup will close automatically when you are back online.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

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
    marginBottom: vs(10),
  },
});

export default NetworkStatus;
