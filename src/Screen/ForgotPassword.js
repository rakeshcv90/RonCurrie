/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
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
import React, { useState } from 'react';
import { Color, FONT, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loader, setLoader] = useState(false);
  const forgetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

    try {
      setLoader(true);
      const payload = {
        email: email,
      };

      const response = await postData(Api.FORGOT_PASSWORD, payload);
      console.log('response', response?.data);
      if (response?.status === 200) {
        setLoader(false);
        setEmail('');
        showToast('success', 'Success', response?.data?.message);
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
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
            <Text style={styles.title}>Forgotten Password?</Text>
            <View
              style={{
                width: moderateScale(100),
                height: 3,
                backgroundColor: Color.RED,
                marginBottom: moderateScale(40),
              }}
            />
            <Text style={styles.forgotText}>
              Enter the e-mail address associated with your account. Click
              submit to have your password e-mailed to you.
            </Text>

            <View
              style={{
                marginBottom: moderateScale(5),
                marginTop: moderateScale(10),
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
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    forgetPassword();
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                forgetPassword();
              }}
            >
              <Text style={styles.loginText}>Continue</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember Your Password ?</Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <Text style={styles.signupText}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Loader visible={loader} />
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
    marginTop: '300@vs',
    padding: '20@s',
  },

  title: {
    fontSize: '30@s',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
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
    color: Color.GRAY,
    fontFamily: FONT.SEMIBOLD,
    fontSize: '14@ms',
  },

  loginBtn: {
    backgroundColor: Color.RED,
    paddingVertical: '15@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
    marginTop: '15@vs',
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

export default ForgotPassword;
