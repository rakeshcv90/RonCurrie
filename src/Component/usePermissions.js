
// import { useEffect, useState, useCallback } from 'react';
// import { Alert, Linking, Platform } from 'react-native';
// import { Camera } from 'react-native-vision-camera';
// import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

// export const usePermissions = () => {
//   const [hasPermission, setHasPermission] = useState(false);
//   const [loading, setLoading] = useState(true);

//   const openSettingsAlert = useCallback(() => {
//     Alert.alert(
//       'Permissions Required',
//       'Camera, Microphone, and Location permissions are required. Please enable them in Settings.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Open Settings', onPress: () => Linking.openSettings() },
//       ],
//     );
//   }, []);

//   const checkPermissions = useCallback(async () => {
//     try {
//       /* ---------------- CAMERA ---------------- */
//       let cameraStatus = await Camera.getCameraPermissionStatus();

//       if (cameraStatus === 'not-determined') {
//         cameraStatus = await Camera.requestCameraPermission();
//       }

//       /* ---------------- MICROPHONE ---------------- */
//       let micStatus = await Camera.getMicrophonePermissionStatus();

//       if (micStatus === 'not-determined') {
//         micStatus = await Camera.requestMicrophonePermission();
//       }

//       /* ---------------- LOCATION ---------------- */
//       let locationStatus;

//       if (Platform.OS === 'ios') {
//         locationStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

//         if (locationStatus === RESULTS.DENIED) {
//           locationStatus = await request(
//             PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//           );
//         }
//       } else {
//         locationStatus = await check(
//           PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//         );

//         if (locationStatus === RESULTS.DENIED) {
//           locationStatus = await request(
//             PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//           );
//         }
//       }

//       const granted =
//         cameraStatus === 'granted' &&
//         micStatus === 'granted' &&
//         locationStatus === RESULTS.GRANTED;

//       setHasPermission(granted);

//       /* 🚫 If user denied or blocked → go to Settings */
//       if (
//         cameraStatus === 'denied' ||
//         micStatus === 'denied' ||
//         locationStatus === RESULTS.BLOCKED
//       ) {
//         openSettingsAlert();
//       }
//     } catch (error) {
//       console.warn('Permission error:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [openSettingsAlert]);

//   useEffect(() => {
//     checkPermissions();
//   }, [checkPermissions]);

//   return {
//     hasPermission,
//     loading,
//     checkPermissions, // call manually if needed
//   };
// };

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export const usePermissions = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      /* ---------------- CAMERA ---------------- */
      let cameraStatus = await Camera.getCameraPermissionStatus();

      if (cameraStatus !== 'granted') {
        cameraStatus = await Camera.requestCameraPermission();
      }

      /* ---------------- MICROPHONE ---------------- */
      let micStatus = await Camera.getMicrophonePermissionStatus();

      if (micStatus !== 'granted') {
        micStatus = await Camera.requestMicrophonePermission();
      }

      /* ---------------- LOCATION ---------------- */
      let locationStatus;

      if (Platform.OS === 'ios') {
        locationStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

        if (locationStatus !== RESULTS.GRANTED) {
          locationStatus = await request(
            PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          );
        }
      } else {
        locationStatus = await check(
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        );

        if (locationStatus !== RESULTS.GRANTED) {
          locationStatus = await request(
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          );
        }
      }

      const granted =
        cameraStatus === 'granted' &&
        micStatus === 'granted' &&
        locationStatus === RESULTS.GRANTED;

      setHasPermission(granted);
    } catch (error) {
      console.warn('Permission error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    hasPermission,
    loading,
    checkPermissions,
  };
};