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
} from 'react-native';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import React, { useState } from 'react';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import FastImage from 'react-native-fast-image';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import * as Keychain from 'react-native-keychain';
import { showToast } from '../utility/showToast';
import { MMKVStorage } from '../utility/MmkvStore';
import Loader from '../Component/Loader';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loader, setLoader] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const loginFunction = async () => {
    try {
      if (!email.trim()) {
        Alert.alert('Validation Error', 'Please enter your email');
        return;
      }
      if (!emailRegex.test(email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address');
        return;
      }
      if (!password.trim()) {
        Alert.alert('Validation Error', 'Please enter your password');
        return;
      }
      if (password.length < 8) {
        Alert.alert(
          'Validation Error',
          'Password must be at least 8 characters long',
        );
        return;
      }

      setLoader(true);
      const response = await postData(Api.LOGIN, { email, password });

      if (response?.status == 200) {
        setLoader(false);
        const token = response?.data?.data?.token;
        if (token && response?.data?.data?.user?.epos_user == 1) {
          await Keychain.setGenericPassword('userToken', token);

          await MMKVStorage.setItem('User_Data', response?.data?.data?.user);

          showToast('success', 'Success!', 'Data saved successfully');

          navigation.replace('Home');
        } else {
          setLoader(false);
          Alert.alert('Unauthorized User', 'You are not an EPOS user.');
        }
      } else {
        setLoader(false);

        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error) {
      setLoader(false);

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
                height: 45,
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
                height: 45,
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
                  navigation.navigate('ForgotPassword');
                }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                loginFunction();
              }}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don’t have an Account ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
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
    marginBottom: '30@vs',
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
});

export default React.memo(Login);
