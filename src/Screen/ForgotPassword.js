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

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const loginFunction = () => {
    navigation.navigate('Home');
    // if (!email.trim()) {
    //   Alert.alert('Validation Error', 'Please enter your email');
    //   return;
    // }
    // if (!password.trim()) {
    //   Alert.alert('Validation Error', 'Please enter your password');
    //   return;
    // }

    // console.log('Logging in with:', email, password);
    // Alert.alert('Success', 'Login successful (demo)');
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
            <Text style={styles.title}>Forgotten Password?</Text>
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

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                loginFunction();
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
    borderBottomColor: Color.RED,
    alignSelf: 'flex-start',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: '5@vs',
    justifyContent: 'center',
    borderBottomColor: Color.GRAY2,
    marginTop: '20@vs',
    marginBottom: '30@vs',
    paddingBottom: '5@vs',
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

export default ForgotPassword;
