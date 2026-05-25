import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color, FONT, IconData } from './Image';
import LinearGradient from 'react-native-linear-gradient';

const { height } = Dimensions.get('window');

const ActionBottomSheet = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actions, setActions] = useState([]);
  const translateY = useRef(new Animated.Value(height)).current;
  const closeSheetRef = useRef(null);

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setSelectedItem(null);
    });
  };

  closeSheetRef.current = closeSheet;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeSheetRef.current?.();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useImperativeHandle(ref, () => ({
    show: ({ item, options }) => {
      setSelectedItem(item);
      setActions(options || []);
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }).start();
    },
    hide: () => {
      closeSheet();
    },
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableWithoutFeedback onPress={closeSheet}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.sheet, { transform: [{ translateY }] }]}
            >
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <Text style={styles.title}>Choose Action</Text>
              {selectedItem && (
                <Text style={styles.subtitle}>
                  Order #{selectedItem?.order_id}
                </Text>
              )}

              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeSheet();
                      setTimeout(() => {
                        if (action.onPress) action.onPress(selectedItem);
                      }, 300);
                    }}
                    style={styles.actionItem}
                  >
                    <LinearGradient
                      colors={action.gradientColors || ['#940000', '#c0392b']}
                      style={styles.iconWrapper}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Image
                        source={action.icon}
                        style={styles.actionIcon}
                        resizeMode="contain"
                      />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    <Text style={styles.actionDesc}>{action.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeSheet}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  handle: {
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#D1D1D1',
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    textAlign: 'center',
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: moderateScale(15),
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: moderateScale(4),
  },
  iconWrapper: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    shadowColor: '#940000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  actionIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: '#FFF',
  },
  actionLabel: {
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    textAlign: 'center',
    marginBottom: moderateScale(2),
  },
  actionDesc: {
    fontSize: moderateScale(11),
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    textAlign: 'center',
  },
  cancelButton: {
    height: moderateScale(46),
    borderRadius: moderateScale(12),
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.GRAY2,
  },
  cancelText: {
    fontSize: moderateScale(15),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
});

export default ActionBottomSheet;
