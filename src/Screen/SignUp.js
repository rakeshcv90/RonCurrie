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

const SignUp = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureText1, setSecureText1] = useState(true);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleConfirmPassword = text => {
    setConfirmPassword(text);
    if (password && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };
  const loginFunction = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    console.log('Logging in with:', email, password);
    Alert.alert('Success', 'Login successful (demo)');
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
            {/* <Image
              source={ImageData.LoginNew}
              style={styles.topImage}
              resizeMode="cover"
            /> */}
               <FastImage
              source={ImageData.LoginNew}
              style={styles.topImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign up</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="mail-outline"
                size={moderateScale(20)}
                color="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="demo@email.com"
                placeholderTextColor={Color.GRAY2}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.inputRow}>
              <Ionicons
                name="phone-portrait-outline"
                size={moderateScale(20)}
                color="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="+00 000-0000-000"
                placeholderTextColor={Color.GRAY2}
                value={phone}
                keyboardType="phone-pad"
                onChangeText={setPhone}
              />
            </View>

            {/* Password */}
            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={moderateScale(20)}
                color="#999"
              />
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
            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={moderateScale(20)}
                color="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={Color.GRAY2}
                secureTextEntry={secureText1}
                value={confirmPassword}
                onChangeText={handleConfirmPassword}
              />
              <TouchableOpacity onPress={() => setSecureText1(!secureText1)}>
                <Ionicons
                  name={secureText1 ? 'eye-off-outline' : 'eye-outline'}
                  size={moderateScale(20)}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                loginFunction();
              }}
            >
              <Text style={styles.loginText}>Signup</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an Account ? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.signupText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: '20@s',
  },

  title: {
    fontSize: '36@s',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    marginBottom: '20@vs',
    borderBottomWidth: 2,
    borderBottomColor: '#940000',
    alignSelf: 'flex-start',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: '5@vs',
    justifyContent: 'center',
    borderBottomColor: Color.GRAY2,
    marginBottom: '20@vs',
    paddingBottom: '5@vs',
  },

  input: {
    flex: 1,
    color: Color.BLACK,
    fontFamily: FONT.REGULAR,
    fontSize: '15@ms',
  },

  loginBtn: {
    backgroundColor: Color.RED,
    paddingVertical: '14@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
    marginTop: '10@vs',
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
  errorText: {
    color: Color.RED,
    fontSize: '12@ms',
    marginTop: '-15@vs',
    marginBottom: '10@vs',
  },
  footerText: {
    color: Color.GRAY,
    fontSize: '16@ms',
    fontFamily: FONT.MEDIUM,
  },
  signupText: { color: Color.RED, fontSize: '16@ms', fontFamily: FONT.BOLD },
});

export default SignUp;
