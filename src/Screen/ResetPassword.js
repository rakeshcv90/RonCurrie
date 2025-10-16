import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Color, FONT, ImageData } from '../Component/Image';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { showToast } from '../utility/showToast';
import Loader from '../Component/Loader';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
const ResetPassword = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showCurrent, setShowCurrent] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [showRepeat, setShowRepeat] = useState(true);

  const [loader, setLoader] = useState(false);

  const handleConfirmPassword = text => {
    setRepeatPassword(text);
    if (newPassword && text !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };
  const changePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your new password');
      return;
    }
    if (!repeatPassword.trim()) {
      Alert.alert('Validation Error', 'Please repeat your new password');
      return;
    }
    if (newPassword !== repeatPassword) {
      Alert.alert(
        'Validation Error',
        'New password and repeat password do not match',
      );
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoader(true);
      const payload = {
        current_password:currentPassword ,
        password: newPassword,
        confirm_password: repeatPassword,
      };
      // const response = await postData(Api.CHANGE_PASSWOIRD,payload);
         const response = await postData(Api.CHANGE_PASSWOIRD, payload);
      console.log("XCVxcvxcvxcvxcvcxvcx",response)

      if (response?.status === 200) {
        setLoader(false);
        showToast('success', 'Success', 'Password changed successfully');
      
        setCurrentPassword('');
        setNewPassword('');
        setRepeatPassword('');
      } else {
        setLoader(false);
        // Alert.alert('Error', response?.message || 'Something went wrong');
      }
    } catch (error) {
      setLoader(false);
      showToast('danger', 'Error', error.message || 'Something went wrong');
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
            <Text style={styles.title}>Reset{'\n'}Password</Text>

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
                Current Password{' '}
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
                  placeholder="Current Password *"
                  secureTextEntry={showCurrent}
                  value={currentPassword}
                  placeholderTextColor={Color.GRAY2}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={moderateScale(20)}
                    color="#999"
                  />
                </TouchableOpacity>
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
                New Password{' '}
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
                  placeholder="Current Password *"
                  secureTextEntry={showNew}
                  value={newPassword}
                  placeholderTextColor={Color.GRAY2}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={moderateScale(20)}
                    color="#999"
                  />
                </TouchableOpacity>
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
                Repeat New Password{' '}
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
                  placeholder="Current Password *"
                  secureTextEntry={showRepeat}
                  value={repeatPassword}
                  placeholderTextColor={Color.GRAY2}
                  onChangeText={handleConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowRepeat(!showRepeat)}>
                  <Ionicons
                    name={showRepeat ? 'eye-off-outline' : 'eye-outline'}
                    size={moderateScale(20)}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                changePassword();
              }}
            >
              <Text style={styles.loginText}>Reset Password</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Changed your mind? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
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
    fontSize: '36@s',
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

  footerText: {
    color: Color.GRAY,
    fontSize: '16@ms',
    fontFamily: FONT.MEDIUM,
  },
  errorText: {
    color: Color.RED,
    fontSize: '12@ms',
    marginTop: '-6@vs',
  },
  signupText: { color: Color.RED, fontSize: '16@ms', fontFamily: FONT.BOLD },
});
export default ResetPassword;
