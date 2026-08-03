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
import { getData, postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { Dropdown } from 'react-native-element-dropdown';
import * as Keychain from 'react-native-keychain';
import { MMKVStorage } from '../utility/MmkvStore';
import Recaptcha from 'react-native-recaptcha-that-works';
const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
const baseUrl = 'https://roncurrie.co.uk/';

const SignUp = ({ navigation }) => {
  const [fisrtName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('HA3 0JA');
  const [company, setCompany] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureText1, setSecureText1] = useState(true);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [agree, setAgree] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptcha = useRef();

  const [loader, setLoader] = useState(false);
  const [addressData, setAddressData] = useState([]);

  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [location, setLocation] = useState(null);
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

  const handlePasswordChange = text => {
    setPassword(text);
    if (text && !passwordRegex.test(text)) {
      setPasswordError(
        'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number and a special character.',
      );
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPassword = text => {
    setConfirmPassword(text);
    if (password && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
    recaptcha.current?.close();
  };

  const onVerify = token => {
    setCaptchaToken(token);
    setCaptchaVerified(true);
  };

  const onExpire = () => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
    Alert.alert('Error', 'reCAPTCHA challenge expired. Please try again.');
  };

  const loginFunction = async () => {
    // Trim all input values
    const formData = {
      firstName: fisrtName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      postcode: postcode.trim(),
      company: company.trim(),
      address1: address1.trim(),
      city: city.trim(),
      country: country.trim(),
      region: region.trim(),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
    };

    const validations = [
      { field: 'firstName', message: 'Please enter your first name' },
      { field: 'lastName', message: 'Please enter your last name' },
      { field: 'email', message: 'Please enter your email' },
      { field: 'phone', message: 'Please enter your phone number' },
      { field: 'postcode', message: 'Please enter your postcode' },
      { field: 'company', message: 'Please enter your company name' },
      { field: 'address1', message: 'Please enter address line 1' },
      { field: 'city', message: 'Please enter your city' },
      { field: 'country', message: 'Please enter your country' },
      { field: 'region', message: 'Please enter your region' },
      { field: 'password', message: 'Please enter your password' },
      { field: 'confirmPassword', message: 'Please confirm your password' },
    ];

    // Check required fields
    for (let i = 0; i < validations.length; i++) {
      const { field, message } = validations[i];
      if (!formData[field]) {
        Alert.alert('Validation Error', message);
        return;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number and a special character.',
      );
      return;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    if (!captchaVerified || !captchaToken) {
      Alert.alert('Validation Error', 'Please verify that you are not a robot');
      return;
    }

    const payload = {
      firstname: fisrtName,
      lastname: lastName,
      email: email,
      telephone: phone,
      postcode: postcode,
      company: company,
      address_1: address1,
      address_2: address2,
      city: city,
      country_id: location?.country_id,
      midname: 'qwerty',
      zone_id: location?.zone_id,
      password: password,
      password_confirmation: confirmPassword,
      newsletter: subscribe ? 1 : 0,
      address_id: 0,
      captcha_token: captchaToken,
      epos_user: 1,
    };
console.log('Signup Payload', payload);
    setLoader(true);
    try {
      const response = await postData(Api.SIGNUP, payload);

      if (response?.status == 201) {
        if (response?.data?.success == true) {
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setPostcode('');
          setCompany('');
          setAddress1('');
          setCity('');
          setCountry('');
          setRegion('');
          setPassword('');
          setConfirmPassword('');

          const token = response?.data?.data?.token;
          if (token && response?.data?.data?.user?.epos_user == 1) {
            await Keychain.setGenericPassword('userToken', token);
            await MMKVStorage.setItem('User_Data', response?.data?.data?.user);

            showToast('success', 'Success!', response?.data?.message);
            navigation.replace('Home');
          } else {
            setLoader(false);
          }
        } else {
          setLoader(false);
          resetCaptcha();
          // Alert.alert('SignUp Failed', 'Invalid credentials');
        }
      } else {
        setLoader(false);
        resetCaptcha();
      }

      setLoader(false);
    } catch (error) {
      setLoader(false);
      resetCaptcha();

      console.log('Signup Error',error);
      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Signup Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
    }
  };

  const handleFindAddress = async () => {
    try {
      const trimmedPostcode = postcode.trim();

      if (!trimmedPostcode) {
        Alert.alert('Validation Error', 'Please enter your postcode');
        return; // Exit BEFORE setting loader
      }

      setLoader(true);
      const res = await getData(
        `${Api.FIND_ADDRESS}?postcode=${encodeURIComponent(trimmedPostcode)}`,
      );

      setLocation(res || []);
      setLoader(false);
      if (res?.responseCode === 200) {
        showToast('success', 'Success!', res?.message || 'Address found');

        const transformedData =
          res.data?.map((address, index) => ({
            label: address,
            value: index.toString(),
            originalAddress: address,
          })) || [];
        setAddressData(transformedData);
      } else {
        setAddressData([]);
      }
    } catch (error) {
      setLoader(false);
      setAddressData([]);
      console.log('Find Address Error:', error);
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

  const manageAddress = data => {
    const parts = data.split(',').map(item => item.trim());

    let addressObj = {};

    if (parts.length === 2) {
      // case: "Address1, City"
      addressObj = {
        address1: parts[0],
        city: parts[1],
      };
    } else if (parts.length === 3) {
      // case: "Company, Address1, City"
      addressObj = {
        company: parts[0],
        address1: parts[1],
        city: parts[2],
      };
    } else if (parts.length === 4) {
      // case: "Company, Address1, Address2, City"
      addressObj = {
        company: parts[0],
        address1: parts[1],
        address2: parts[2],
        city: parts[3],
      };
    }

    setCompany(addressObj.company || '');
    setAddress1(addressObj.address1 || '');
    setAddress2(addressObj.address2 || '');
    setCity(addressObj.city || '');
    setCountry(location?.country_name);
    setRegion(location?.region);
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
            <Text style={styles.title}>Sign up</Text>
            {/* //Name */}
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
                First Name{' '}
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
                  placeholder="Enter Name"
                  placeholderTextColor={Color.GRAY2}
                  value={fisrtName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>
            {/* //LastName */}
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
                Last Name{' '}
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
                  placeholder="Enter last name"
                  placeholderTextColor={Color.GRAY2}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
            {/* //Email */}
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
                />
              </View>
            </View>
            {/* //Phone */}
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
                Phone{' '}
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
                  placeholder="Enter phone number"
                  placeholderTextColor={Color.GRAY2}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* //Postcode */}
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
                Postcode{' '}
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
            <View style={styles.row1}>
              <TextInput
                style={styles.input1}
                placeholder="NG14 5HN"
                placeholderTextColor="#999"
                value={postcode}
                onChangeText={setPostcode}
                keyboardType="default"
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.findBtn}
                onPress={() => handleFindAddress()}
              >
                <Text style={styles.findBtnText}>Find Address</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.container}>
              <Dropdown
                style={styles.input2}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={addressData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={'Select item'}
                searchPlaceholder="Search..."
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  manageAddress(item?.originalAddress);
                  setValue(item.value);

                  setIsFocus(false);
                }}
              />
            </View>

            {/* //Company */}
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
                Company{' '}
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
                  placeholder="Enter company name"
                  placeholderTextColor={Color.GRAY2}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </View>

            {/* // Address Line 1 */}
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
                Address Line 1{' '}
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
                  placeholder="Enter Address line 1"
                  placeholderTextColor={Color.GRAY2}
                  value={address1}
                  onChangeText={setAddress1}
                />
              </View>
            </View>
            {/* // Address Line 2 */}
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
                Address Line 2{' '}
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
                  placeholder="Enter Address line 2"
                  placeholderTextColor={Color.GRAY2}
                  value={address2}
                  onChangeText={setAddress2}
                />
              </View>
            </View>
            {/* // City */}
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
                City{' '}
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
                  placeholder="Enter city"
                  placeholderTextColor={Color.GRAY2}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* // Country */}

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
                Country{' '}
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
                  placeholder="Enter country"
                  placeholderTextColor={Color.GRAY2}
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            {/* // Region */}
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
                Region{' '}
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
                  value={region}
                  onChangeText={setRegion}
                />
              </View>
            </View>
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
                borderColor: passwordError ? Color.RED : Color.GRAY2,
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
                  onChangeText={handlePasswordChange}
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
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

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
                Confirm Password{' '}
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
                  placeholder="Confirm your password"
                  placeholderTextColor={Color.GRAY2}
                  secureTextEntry={secureText1}
                  value={confirmPassword}
                  onChangeText={handleConfirmPassword}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    loginFunction();
                  }}
                />
                <TouchableOpacity onPress={() => setSecureText1(!secureText1)}>
                  <Ionicons
                    name={secureText1 ? 'eye-off-outline' : 'eye-outline'}
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
              activeOpacity={0.8}
              style={styles.robotBox}
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
          </View>
        </ScrollView>
        <View style={{ padding: moderateScale(20), marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.loginBtn, !captchaVerified && { opacity: 0.5 }]}
            disabled={!captchaVerified}
            onPress={() => {
              Keyboard.dismiss();
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
    marginTop: '250@vs',
    padding: '20@s',
  },

  title: {
    fontSize: '30@s',
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
    paddingHorizontal: '5@vs',
    height: '100%',
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
    marginTop: '-6@vs',
  },
  footerText: {
    color: Color.GRAY,
    fontSize: '16@ms',
    fontFamily: FONT.MEDIUM,
  },
  signupText: { color: Color.RED, fontSize: '16@ms', fontFamily: FONT.BOLD },
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

  row1: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  input1: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(6),
    height: moderateScale(45),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    paddingHorizontal: 10,
    fontSize: moderateScale(14),
    width: '60%',
  },
  findBtn: {
    backgroundColor: '#3D3D3D',
    height: moderateScale(45),
    width: '35%',
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  findBtnText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontFamily: FONT.BOLD,
  },
  input2: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(6),
    height: moderateScale(45),
    marginBottom: verticalScale(10),
    fontSize: moderateScale(14),
    width: '100%',
    paddingHorizontal: 10,
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    marginTop: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(16),
    color: Color.GRAY,
    fontFamily: FONT.REGULAR,
    marginLeft: moderateScale(8),
  },
  linkText: {
    fontFamily: FONT.REGULAR,
    fontSize: moderateScale(16),
    color: Color.RED,
  },
  robotBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(4),
    padding: moderateScale(5),
    backgroundColor: '#fafafa',
    marginTop: verticalScale(10),
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

export default SignUp;
