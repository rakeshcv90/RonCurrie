import { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export const usePermissions = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPermissions = async () => {
    try {
      // CAMERA
      let cameraPermission = await Camera.getCameraPermissionStatus();

      if (cameraPermission !== 'granted') {
        cameraPermission = await Camera.requestCameraPermission();
      }

      // MICROPHONE
      let micPermission = await Camera.getMicrophonePermissionStatus();

      if (micPermission !== 'granted') {
        micPermission = await Camera.requestMicrophonePermission();
      }

      // LOCATION
      let locationPermission =
        Platform.OS === 'android'
          ? await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
          : await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

      if (locationPermission !== RESULTS.GRANTED) {
        locationPermission =
          Platform.OS === 'android'
            ? await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
            : await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      }

      const isGranted =
        cameraPermission === 'granted' &&
        micPermission === 'granted' &&
        locationPermission === RESULTS.GRANTED;

      setHasPermission(isGranted);

      if (!isGranted) {
        Alert.alert(
          'Permissions Required',
          'Camera, Microphone, and Location are required. Please enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return { hasPermission, loading, checkPermissions };
};
