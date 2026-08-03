/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  Animated,
  AppState,
} from 'react-native';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { Color, FONT, ImageData } from '../Component/Image';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import Loader from '../Component/Loader';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import { showToast } from '../utility/showToast';
import { MMKVStorage } from '../utility/MmkvStore';
import * as Keychain from 'react-native-keychain';
import Clipboard from '@react-native-clipboard/clipboard';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;

const OtpTimer = forwardRef(({ onResend }, ref) => {
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);
  const endTimeRef = useRef(Date.now() + RESEND_SECONDS * 1000);

  const getRemainingSeconds = useCallback(() => {
    return Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
  }, []);

  const startTimer = useCallback(() => {
    endTimeRef.current = Date.now() + RESEND_SECONDS * 1000;
    setTimer(RESEND_SECONDS);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setTimer(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setCanResend(true);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // Handle app background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        const remaining = getRemainingSeconds();
        setTimer(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setCanResend(true);
        }
      }
    });
    return () => subscription.remove();
  }, [getRemainingSeconds]);

  useImperativeHandle(ref, () => ({
    restart: () => {
      startTimer();
    },
  }));

  const formatTimer = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!canResend) {
    return (
      <View style={styles.timerWrap}>
        <Text style={styles.timerActiveText}>
          OTP expires in{' '}
          <Text style={styles.timerCount}>{formatTimer(timer)}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.timerWrap}>
      <Text style={styles.timerExpiredText}>
        The OTP has timed out and you need to{' '}
        <Text style={styles.resendLink} onPress={onResend}>
          resend a new OTP.
        </Text>
      </Text>
    </View>
  );
});

const OtpScreen = ({ navigation, route }) => {
  const email = route?.params?.email;

  const [otpValue, setOtpValue] = useState('');
  const [loader, setLoader] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hiddenInputRef = useRef(null);
  const timerComponentRef = useRef(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);
 

  const otp = otpValue.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  const handleHiddenChange = text => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtpValue(digits);
  };

  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  const handleLongPressOtp = () => {
    Alert.alert('Paste', 'Paste OTP from clipboard?', [
      {
        text: 'Paste',
        onPress: handlePasteOtp,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handlePasteOtp = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      const digits = clipboardContent
        .replace(/[^0-9]/g, '')
        .slice(0, OTP_LENGTH);
      if (digits.length > 0) {
        setOtpValue(digits);
        hiddenInputRef.current?.focus();
      } else {
        showToast('danger', 'Invalid', 'No valid OTP found in clipboard');
      }
    } catch (error) {
      showToast('danger', 'Error', 'Failed to read clipboard');
    }
  };

  const verifyOtp = async () => {
    if (otpValue.length < OTP_LENGTH) {
      showToast(
        'danger',

        'Please enter the complete 6-digit OTP',
      );
      return;
    }
    try {
      setLoader(true);
      const response = await postData(Api.VERY_OTP, {
        email,
        otp: otpValue,
      });

      if (response?.status === 200) {
        const token = response?.data?.data?.token;
        if (token && response?.data?.data?.user?.epos_user == 1) {
          await Keychain.setGenericPassword('userToken', token);
          await MMKVStorage.setItem('User_Data', response?.data?.data?.user);
          setOtpValue('');
          showToast('success', 'Success!', response?.data?.message);
          navigation.replace('Home');
        } else {
          setLoader(false);
          setOtpValue('');
          hiddenInputRef.current?.focus();
          Alert.alert('Unauthorized User', 'You are not an EPOS user.');
        }
      } else {
        setLoader(false);
        setOtpValue('');
        hiddenInputRef.current?.focus();
      }
    } catch (error) {
      setLoader(false);
      setOtpValue('');
      hiddenInputRef.current?.focus();
      console.log('XCvcxvxcvcxvcxvc', error);
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };

  const resendOtp = async () => {
    try {
     
      setLoader(true);
      const response = await postData(Api.RESET_OTP, { email });

      if (response?.status === 200) {
         timerComponentRef.current?.restart();
        setLoader(false);
        setOtpValue('');
        hiddenInputRef.current?.focus();
        showToast('success', 'Sent', response?.data?.message);
      } else {
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
      showToast('danger', 'Error', error.message || 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header image ── */}
          <View style={styles.topContainer}>
            <FastImage
              source={ImageData.LoginNew}
              style={styles.topImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <View style={styles.formContainer}>
            {/* ── Title ── */}
            <View style={styles.headingWrap}>
              <Text style={styles.heading}>Verify Your Identity</Text>

              <Text style={styles.subheading}>We've sent a 6-digit OTP to</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* <Pressable
              style={styles.otpRow}
              onPress={focusInput}
              onLongPress={handleLongPressOtp}
            >
           
              {otp.map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    digit.trim() ? styles.otpBoxFilled : null,
                    index === otpValue.length &&
                      isFocused &&
                      styles.otpBoxFocused,
                  ]}
                >
                  {digit.trim() ? (
                    <Text
                      style={{
                        fontSize: moderateScale(18),
                        fontFamily: FONT.BOLD,
                        color: Color.BLACK,
                        textAlign: 'center',
                      }}
                    >
                      {digit.trim()}
                    </Text>
                  ) : (
                    index === otpValue.length &&
                    isFocused && (
                      <Animated.View
                        style={{
                          width: 2,
                          height: moderateScale(20),
                          backgroundColor: Color.RED,
                          opacity: cursorAnim,
                        }}
                      />
                    )
                  )}
                </View>
              ))}
          
              <TextInput
                ref={hiddenInputRef}
                value={otpValue}
                onChangeText={handleHiddenChange}
                keyboardType="numeric"
                maxLength={OTP_LENGTH}
                autoFocus
                // caretHidden
                // contextMenuHidden
                caretHidden={true}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  color: 'transparent',
                  backgroundColor: 'transparent',
                  fontSize: moderateScale(18),
                }}
              />
            </Pressable> */}

            <Pressable
              style={styles.otpRow}
              onPress={focusInput}
              onLongPress={handleLongPressOtp}
            >
              {otp.map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    digit.trim() ? styles.otpBoxFilled : null,
                    index === otpValue.length &&
                      isFocused &&
                      styles.otpBoxFocused,
                  ]}
                >
                  {/* {digit.trim() ? (
                    <Text
                      style={{
                        fontSize: moderateScale(18),
                        fontFamily: FONT.BOLD,
                        color: Color.BLACK,
                        textAlign: 'center',
                      }}
                    >
                      {digit.trim()}
                    </Text>
                  ) : null} */}

                  {digit.trim() ? (
                    <Text
                      style={{
                        fontSize: moderateScale(18),
                        fontFamily: FONT.BOLD,
                        color: Color.BLACK,
                        textAlign: 'center',
                      }}
                    >
                      {digit.trim()}
                    </Text>
                  ) : (
                    index === otpValue.length &&
                    isFocused &&
                    showCursor && (
                      <View
                        style={{
                          width: 2,
                          height: moderateScale(20),
                          backgroundColor: Color.RED,
                        }}
                      />
                    )
                  )}
                </View>
              ))}

              <TextInput
                ref={hiddenInputRef}
                value={otpValue}
                onChangeText={handleHiddenChange}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                // caretHidden={true}
                // contextMenuHidden={false}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.01,
                }}
              />
            </Pressable>
            <OtpTimer ref={timerComponentRef} onResend={resendOtp} />

            <TouchableOpacity style={styles.loginBtn} onPress={verifyOtp}>
              <Text style={styles.loginText}>Verify & Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Entered wrong details? </Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={styles.signupText}>Go back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loader visible={loader} />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: Color.WHITE },

  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300@vs',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },

  formContainer: {
    flex: 1,
    marginTop: '250@vs',
    padding: '10@s',
  },

  title: {
    fontSize: '30@s',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    marginBottom: '20@vs',
    borderBottomWidth: 2,
    borderBottomColor: Color.RED,
    alignSelf: 'flex-start',
  },

  headingWrap: {
    alignItems: 'center',
    marginTop: '40@vs',
    marginBottom: '18@vs',
  },

  heading: {
    fontSize: '20@ms',
    fontFamily: FONT.BOLD,
    color: Color.BLACK2,
    marginBottom: '8@vs',
  },

  subheading: {
    color: Color.GRAY,
    fontFamily: FONT.REGULAR,
    fontSize: '14@ms',
    textAlign: 'center',
  },

  emailText: {
    fontFamily: FONT.BOLD,
    color: Color.BLACK3,
    fontSize: '14@ms',
    textAlign: 'center',
    marginTop: '2@vs',
  },

  forgotText: {
    color: Color.GRAY,
    fontFamily: FONT.SEMIBOLD,
    fontSize: '14@ms',
  },

  // ── OTP row ──────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(10),
    marginTop: '14@vs',
    marginBottom: '6@vs',
  },

  otpBox: {
    width: '42@ms',
    height: '42@vs',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    borderColor: Color.GRAY2,
    backgroundColor: Color.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  otpBoxFilled: {
    borderColor: Color.RED,
    backgroundColor: '#fff5f5',
  },

  otpBoxFocused: {
    borderColor: Color.RED,
    borderWidth: 2,
  },

  // ── Timer / Resend ───────────────────────────────────────────────────────
  timerWrap: {
    alignItems: 'center',
    marginBottom: '20@vs',
    marginTop: '10@vs',
    paddingHorizontal: '10@s',
  },

  timerActiveText: {
    color: Color.GRAY4,
    fontFamily: FONT.MEDIUM,
    fontSize: '13@ms',
    textAlign: 'center',
  },

  timerCount: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: '13@ms',
  },

  timerExpiredText: {
    color: Color.GRAY4,
    fontFamily: FONT.MEDIUM,
    fontSize: '13@ms',
    textAlign: 'center',
    lineHeight: '18@vs',
  },

  resendLink: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    textDecorationLine: 'underline',
  },

  // ── Button ────────────────────────────────────────────────────────────────
  loginBtn: {
    backgroundColor: Color.RED,
    paddingVertical: '14@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
  },

  loginText: {
    color: Color.WHITE,
    fontSize: '16@ms',
    fontFamily: FONT.SEMIBOLD,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '20@vs',
  },

  footerText: {
    color: Color.GRAY,
    fontSize: '16@ms',
    fontFamily: FONT.MEDIUM,
  },

  signupText: { color: Color.RED, fontSize: '16@ms', fontFamily: FONT.BOLD },

  // ── (kept for parity with Login styles) ──────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '5@vs',
    height: '100%',
  },

  input: {
    flex: 1,
    color: Color.BLACK,
    fontFamily: FONT.REGULAR,
    fontSize: '15@ms',
  },

  row: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: '20@vs',
  },

  robotBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(4),
    padding: moderateScale(8),
    backgroundColor: '#fafafa',
    marginBottom: verticalScale(10),
  },
  robotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  robotText: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: moderateScale(16),
    color: Color.BLACK,
    fontFamily: FONT.MEDIUM,
  },
  recaptchaLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    resizeMode: 'contain',
  },
});

export default OtpScreen;
