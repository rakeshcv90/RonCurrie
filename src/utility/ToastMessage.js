// import React, {
//   useState,
//   forwardRef,
//   useImperativeHandle,
//   useRef,

// } from 'react';
// import { View, Text, Animated, Easing, PanResponder } from 'react-native';
// import { ImageData } from '../Component/Image';


// const ToastMessage = forwardRef(({ timeout = 3000 }, ref) => {
//   const [toast, setToast] = useState({
//     isVisible: false,
//     type: 'success',
//     text: '',
//     description: '',
//   });

//   const TOAST_TYPE = {
//     success: { backgroundColor: '#2fcc71', icon: 'check-circle' },
//     danger: { backgroundColor: '#e74c3c', icon: 'exclamation-circle' },
//     info: { backgroundColor: '#3498db', icon: 'info-circle' },
//     warning: { backgroundColor: '#f39c12', icon: 'exclamation-triangle' },
//   };

//   const opacity = useRef(new Animated.Value(0)).current;
//   const translateY = useRef(new Animated.Value(-50)).current;

//   const show = ({
//     type = 'success',
//     text = '',
//     description = '',
//     duration,
//   }) => {
//     setToast({ isVisible: true, type, text, description });

//     Animated.parallel([
//       Animated.timing(opacity, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//       Animated.timing(translateY, {
//         toValue: 0,
//         duration: 300,
//         easing: Easing.out(Easing.ease),
//         useNativeDriver: true,
//       }),
//     ]).start();

//     const timer = setTimeout(() => {
//       Animated.parallel([
//         Animated.timing(opacity, {
//           toValue: 0,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateY, {
//           toValue: -50,
//           duration: 300,
//           easing: Easing.in(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]).start(() => setToast(prev => ({ ...prev, isVisible: false })));
//       clearTimeout(timer);
//     }, duration || timeout);
//   };

//   useImperativeHandle(ref, () => ({
//     show,
//   }));

//   if (!toast.isVisible) return null;

//   const { backgroundColor, icon } = TOAST_TYPE[toast?.type];

//   return (
//     <Animated.View
//       style={{
//         position: 'absolute',
//         top: 60,
//         width: '90%',
//         alignSelf: 'center',
//         backgroundColor,
//         borderRadius: 10,
//         padding: 12,
//         flexDirection: 'row',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 3.84,
//         elevation: 5,
//         zIndex: 9999,
//         opacity,
//         transform: [{ translateY }],
//       }}
//     >
//       {/* <FontAwesome5 name={icon} size={30} color="#FFF" /> */}

//       {/* <Image
//         source={ImageData.Succ}
//         style={{ width: 30, height: 30, resizeMode: 'contain' }}
//       /> */}
//       <View style={{ marginLeft: 12, flexShrink: 1 }}>
//         <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFF' }}>
//           {toast.text}
//         </Text>
//         <Text style={{ fontSize: 16, fontWeight: '400', color: '#FFF' }}>
//           {toast.description}
//         </Text>
//       </View>
//     </Animated.View>
//   );
// });

// export default ToastMessage;


// import React, {
//   useState,
//   forwardRef,
//   useImperativeHandle,
//   useRef,
// } from 'react';
// import {
//   View,
//   Text,
//   Animated,
//   Easing,
//   PanResponder,
// } from 'react-native';

// const ToastMessage = forwardRef(({ timeout = 3000 }, ref) => {
//   const [toast, setToast] = useState({
//     isVisible: false,
//     type: 'success',
//     text: '',
//     description: '',
//   });

//   const TOAST_TYPE = {
//     success: { backgroundColor: '#2fcc71' },
//     danger: { backgroundColor: '#e74c3c' },
//     info: { backgroundColor: '#3498db' },
//     warning: { backgroundColor: '#f39c12' },
//   };

//   const opacity = useRef(new Animated.Value(0)).current;
//   const translateY = useRef(new Animated.Value(-80)).current;
//   const timerRef = useRef(null);

//   const hideToast = () => {
//     Animated.parallel([
//       Animated.timing(opacity, {
//         toValue: 0,
//         duration: 250,
//         useNativeDriver: true,
//       }),
//       Animated.timing(translateY, {
//         toValue: -80,
//         duration: 250,
//         easing: Easing.in(Easing.ease),
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setToast(prev => ({ ...prev, isVisible: false }));
//       translateY.setValue(-80);
//     });

//     if (timerRef.current) {
//       clearTimeout(timerRef.current);
//     }
//   };

//   const show = ({
//     type = 'success',
//     text = '',
//     description = '',
//     duration,
//   }) => {
//     if (timerRef.current) {
//       clearTimeout(timerRef.current);
//     }

//     setToast({ isVisible: true, type, text, description });

//     Animated.parallel([
//       Animated.timing(opacity, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//       Animated.timing(translateY, {
//         toValue: 0,
//         duration: 300,
//         easing: Easing.out(Easing.ease),
//         useNativeDriver: true,
//       }),
//     ]).start();

//     timerRef.current = setTimeout(() => {
//       hideToast();
//     }, duration || timeout);
//   };

//   useImperativeHandle(ref, () => ({
//     show,
//   }));

//   // ✅ Swipe Up to Close
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gestureState) => {
//         return Math.abs(gestureState.dy) > 10;
//       },
//       onPanResponderMove: (_, gestureState) => {
//         if (gestureState.dy < 0) {
//           translateY.setValue(gestureState.dy);
//         }
//       },
//       onPanResponderRelease: (_, gestureState) => {
//         if (gestureState.dy < -50) {
//           hideToast();
//         } else {
//           Animated.spring(translateY, {
//             toValue: 0,
//             useNativeDriver: true,
//           }).start();
//         }
//       },
//     }),
//   ).current;

//   if (!toast.isVisible) return null;

//   const { backgroundColor } = TOAST_TYPE[toast?.type];

//   return (
//     <Animated.View
//       {...panResponder.panHandlers}
//       style={{
//         position: 'absolute',
//         top: 60,
//         width: '90%',
//         alignSelf: 'center',
//         backgroundColor,
//         borderRadius: 12,
//         padding: 14,
//         flexDirection: 'row',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 3.84,
//         elevation: 6,
//         zIndex: 9999,
//         opacity,
//         transform: [{ translateY }],
//       }}
//     >
//       <View style={{ flexShrink: 1 }}>
//         <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
//           {toast.text}
//         </Text>
//         {toast.description ? (
//           <Text style={{ fontSize: 14, color: '#FFF', marginTop: 2 }}>
//             {toast.description}
//           </Text>
//         ) : null}
//       </View>
//     </Animated.View>
//   );
// });

// export default ToastMessage;

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ToastMessage = forwardRef(({ timeout = 3000 }, ref) => {
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    text: '',
    description: '',
  });

  const TOAST_TYPE = {
    success: { backgroundColor: '#2fcc71' },
    danger: { backgroundColor: '#e74c3c' },
    info: { backgroundColor: '#3498db' },
    warning: { backgroundColor: '#f39c12' },
  };

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-80)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // 🔹 Hide Toast
  const hideToast = (direction = 'vertical') => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(
        direction === 'horizontal' ? translateX : translateY,
        {
          toValue:
            direction === 'horizontal'
              ? translateX._value > 0
                ? width
                : -width
              : -80,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        },
      ),
    ]).start(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
      translateY.setValue(-80);
      translateX.setValue(0);
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // 🔹 Show Toast
  const show = ({
    type = 'success',
    text = '',
    description = '',
    duration,
  }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ isVisible: true, type, text, description });

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      hideToast();
    }, duration || timeout);
  };

  useImperativeHandle(ref, () => ({
    show,
  }));

  // 🔹 Swipe Left / Right to Close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },

      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 80) {
          hideToast('horizontal');
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!toast.isVisible) return null;

  const { backgroundColor } = TOAST_TYPE[toast?.type];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: 60,
        width: '90%',
        alignSelf: 'center',
        backgroundColor,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 6,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
          {toast.text}
        </Text>

        {toast.description ? (
          <Text style={{ fontSize: 14, color: '#FFF', marginTop: 2 }}>
            {toast.description}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
});

export default ToastMessage;