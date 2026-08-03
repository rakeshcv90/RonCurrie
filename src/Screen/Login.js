/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import React, { useRef, useState } from 'react';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import FastImage from 'react-native-fast-image';
import { postData } from '../utility/ApiCall';
import { Api, BaseUrl } from '../utility/api';

import { showToast } from '../utility/showToast';

import Loader from '../Component/Loader';

import Recaptcha from 'react-native-recaptcha-that-works';
import axios from 'axios';
const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
const baseUrl = 'https://roncurrie.co.uk/';
const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loader, setLoader] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const recaptcha = useRef();

  const validateInput = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      resetCaptcha();
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      resetCaptcha();
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      resetCaptcha();
      return false;
    }
    if (password.length < 8) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 8 characters long',
      );
      resetCaptcha();
      return false;
    }
    return true;
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
    recaptcha.current?.close();
  };

  const loginFunction = async () => {
    try {
      if (!validateInput()) {
        return;
      }

      setLoader(true);
      // const response = await postData(Api.LOGIN, {
      //   email,
      //   password,
      //   captcha_token: captchaToken,
      // });
      const response = await axios.post(BaseUrl + 'login', {
        email,
        password,
        captcha_token: captchaToken,
      });

      if (response?.status == 200) {
        setLoader(false);
        showToast('success', 'Success!', response?.data?.message);
        navigation.replace('OtpScreen', { email: email });
      } else {
        setLoader(false);
        resetCaptcha();
        // Alert.alert('Login Failed', 'Invalid credentials');
      }

      setLoader(false);
    } catch (error) {
      console.log('XCvcvcbcvbcvbvcbcvbv', error);
      setLoader(false);
      resetCaptcha();

      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Login Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
    }
  };
  const onVerify = token => {
    console.log('reCAPTCHA verified!', token);
    setCaptchaToken(token);
    setCaptchaVerified(true);
  };

  const onExpire = () => {
    console.warn('reCAPTCHA expired!');
    setCaptchaToken(null);
    setCaptchaVerified(false);
    Alert.alert('Error', 'reCAPTCHA challenge expired. Please try again.');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // adjust as needed
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topContainer}>
            <FastImage
              source={ImageData.LoginNew}
              style={styles.topImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign in</Text>

            <View
              style={{
                marginBottom: moderateScale(5),
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.BOLD,
                  fontSize: moderateScale(16),
                  color: Color.GRAY,
                }}
              >
                Email{' '}
                <Text
                  style={{
                    fontFamily: FONT.BOLD,
                    fontSize: moderateScale(16),
                    color: Color.RED,
                  }}
                >
                  *
                </Text>
              </Text>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: Color.GRAY2,
                marginBottom: 10,
                height: verticalScale(40),
              }}
            >
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="demo@email.com"
                  placeholderTextColor={Color.GRAY2}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View
              style={{
                marginBottom: moderateScale(5),
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.BOLD,
                  fontSize: moderateScale(16),
                  color: Color.GRAY,
                }}
              >
                Password{' '}
                <Text
                  style={{
                    fontFamily: FONT.BOLD,
                    fontSize: moderateScale(16),
                    color: Color.RED,
                  }}
                >
                  *
                </Text>
              </Text>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: Color.GRAY2,
                marginBottom: 10,
                height: verticalScale(40),
              }}
            >
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Color.GRAY2}
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    if (captchaVerified && validateInput()) {
                      loginFunction();
                    }
                  }}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons
                    name={secureText ? 'eye-off-outline' : 'eye-outline'}
                    size={moderateScale(20)}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setTimeout(() => {
                    navigation.navigate('ForgotPassword');
                  }, 100);
                }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.robotBox}
              activeOpacity={0.8}
              onPress={() => {
                recaptcha.current.open();
              }}
            >
              <View style={styles.robotRow}>
                <Ionicons
                  name={
                    captchaVerified ? 'checkbox' : 'shield-checkmark-outline'
                  }
                  size={moderateScale(24)}
                  color={captchaVerified ? '#4CAF50' : '#999'}
                />
                <Text style={styles.robotText}>
                  {captchaVerified ? 'Verified' : 'Tap to verify'}
                </Text>
                <Image
                  source={{
                    uri: 'https://www.gstatic.com/recaptcha/api2/logo_48.png',
                  }}
                  style={styles.recaptchaLogo}
                />
              </View>
              <Recaptcha
                ref={recaptcha}
                siteKey={siteKey}
                baseUrl={baseUrl}
                onVerify={onVerify}
                onExpire={onExpire}
                onError={err => console.log('reCAPTCHA error:', err)}
                size="normal"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginBtn, !captchaVerified && { opacity: 0.5 }]}
              disabled={!captchaVerified}
              onPress={() => {
                Keyboard.dismiss();
                if (validateInput()) {
                  loginFunction();
                }
              }}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don’t have an Account ?</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setTimeout(() => {
                    navigation.navigate('SignUp');
                  }, 100);
                }}
              >
                <Text style={styles.signupText}>Sign up</Text>
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

  forgotText: {
    color: Color.RED,
    fontFamily: FONT.SEMIBOLD,
    fontSize: '14@ms',
  },

  loginBtn: {
    backgroundColor: Color.RED,
    paddingVertical: '14@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
  },

  loginText: {
    color: Color.WHITE,
    fontSize: '16@ms',
    fontWeight: FONT.SEMIBOLD,
  },

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

export default React.memo(Login);
