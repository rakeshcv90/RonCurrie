import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { View, Text, Animated, Easing } from 'react-native';

const ToastMessage = forwardRef(({ timeout = 3000 }, ref) => {
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    text: '',
    description: '',
  });

  const TOAST_TYPE = {
    success: { backgroundColor: '#2fcc71', icon: 'check-circle' },
    danger: { backgroundColor: '#e74c3c', icon: 'exclamation-circle' },
    info: { backgroundColor: '#3498db', icon: 'info-circle' },
    warning: { backgroundColor: '#f39c12', icon: 'exclamation-triangle' },
  };

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  const show = ({
    type = 'success',
    text = '',
    description = '',
    duration,
  }) => {
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

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setToast(prev => ({ ...prev, isVisible: false })));
      clearTimeout(timer);
    }, duration || timeout);
  };

  useImperativeHandle(ref, () => ({
    show,
  }));

  if (!toast.isVisible) return null;

  const { backgroundColor, icon } = TOAST_TYPE[toast.type];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        width: '90%',
        alignSelf: 'center',
        backgroundColor,
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {/* <FontAwesome5 name={icon} size={30} color="#FFF" /> */}
      <View style={{ marginLeft: 12, flexShrink: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFF' }}>
          {toast.text}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '400', color: '#FFF' }}>
          {toast.description}
        </Text>
      </View>
    </Animated.View>
  );
});

export default ToastMessage;
