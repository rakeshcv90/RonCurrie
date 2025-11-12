import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { Api } from '../utility/api';
import { getData, postData } from '../utility/ApiCall';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { showToast } from '../utility/showToast';
import Loader from '../Component/Loader';

const ReturnScreen = ({ route, navigation }) => {
  const { orderData, productData } = route?.params;
  const [loader, setLoader] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [productOpened, setProductOpened] = useState('Yes');
  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState();
  const [last, setLast] = useState();
  const [email, setEmail] = useState(null);
  const [phone, setPhone] = useState(null);
  const [date, setDate] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [reason, setReason] = useState([]);
  const [reasonDetail, setReasonDetail] = useState();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const res = await getData(`${Api.RETURN_REASON}`);

          if (res?.responseCode === 200) {
            setReason(res?.data || []);
          } else {
            // showToast('danger', 'Error', res?.message || 'Reason not found');
          }
        } catch (error) {
          if (error.type === 'network') {
            showToast('danger', 'Network Error', error.message);
          } else if (error.type === 'response') {
            showToast('danger', 'API Error', error.message);
          } else {
            showToast(
              'danger',
              'Unexpected Error',
              error.message || 'Something went wrong',
            );
          }
        }
      };

      const fetchOrderDetails = async () => {
        try {
          const res = await getData(
            `${Api.RETURN_ORDER_DETAILS}/${productData?.order_id}`,
          );

          if (res?.responseCode === 200) {
            setName(res?.data?.firstname);
            setLast(res?.data?.lastname);
            setEmail(res?.data?.email);
            setPhone(res?.data?.telephone);
            setDate(res?.data?.date_added);
            // setName(res?.data?.firstname);
            setOrderId(res?.data?.order_id?.toString());
          } else {
            // showToast('danger', 'Error', res?.message || 'Reason not found');
          }
        } catch (error) {
          if (error.type === 'network') {
            showToast('danger', 'Network Error', error.message);
          } else if (error.type === 'response') {
            showToast('danger', 'API Error', error.message);
          } else {
            showToast(
              'danger',
              'Unexpected Error',
              error.message || 'Something went wrong',
            );
          }
        }
      };
      fetchData();
      fetchOrderDetails();
    }, []),
  );

  const returnOrderSubmit = async () => {
    if (!name || !last) {
      showToast('danger', 'Error', 'Please enter your full name.');
      return;
    }
    if (!email) {
      showToast('danger', 'Error', 'Please enter your email.');
      return;
    }
    if (!phone) {
      showToast('danger', 'Error', 'Please enter your phone number.');
      return;
    }
    if (!orderId) {
      showToast('danger', 'Error', 'Order ID not found.');
      return;
    }
    if (!date) {
      showToast('danger', 'Error', 'Order date not found.');
      return;
    }
    // if (!selectedReason?.return_reason_id) {
    //   showToast('danger', 'Error', 'Please select a reason for return.');
    //   return;
    // }
    // if (!reasonDetail || reasonDetail.trim() === '') {
    //   showToast('danger', 'Error', 'Please provide details for the return.');
    //   return;
    // }
    if (!isChecked) {
      showToast('danger', 'Error', 'Please agree to the Terms & Conditions.');
      return;
    }

    const body = {
      firstname: name,
      lastname: last,
      email: email,
      telephone: phone,
      product: orderData?.name,
      model: orderData?.model,
      quantity: orderData?.quantity,
      opened: productOpened === 'Yes' ? 1 : 0,
      return_reason_id: selectedReason?.return_reason_id,
      comment: reasonDetail,
      date_ordered: date.split(' ')[0],
    };

    try {
      setLoader(true);
      const endpoint = `${Api.RETURN_ORDER}/order/${orderId}/product/${orderData?.product_id}/return`;
      const result = await postData(endpoint, body);

      setLoader(false);

      if (result?.status === 200) {
        showToast('success', 'Success', result?.data?.message);

        navigation.goBack();
      } else {
        // showToast(
        //   'danger',
        //   'Error',
        //   result?.message || 'Failed to submit return.',
        // );
      }
    } catch (error) {
      setLoader(false);
      showToast('danger', 'Error', error?.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.leftContainer}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }], // 👈 this becomes the new root
              }),
            );
          }}
        >
          <Image
            source={IconData.Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Ionicons
            name={'arrow-back'}
            size={moderateScale(20)}
            color={Color.GRAY}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={{ padding: moderateScale(15) }}>
          <Text style={styles.headerTitle}>Product Returns</Text>

          <Text style={styles.subtitle}>
            Please complete the form below to request a return.
          </Text>

          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FIRST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>LAST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={last}
                onChangeText={setLast}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>TELEPHONE</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ORDER ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Order ID"
                value={orderId}
                editable={false}
                onChangeText={setOrderId}
              />
            </View>

            {/* ORDER DATE */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ORDER DATE</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={date}
                  editable={false}
                  onChangeText={setDate}
                />
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#555" />
                </View>
              </View>
            </View>
          </View>

          {/* Product Information */}
          <Text style={styles.sectionTitle}>
            Product Information & Reason for Return
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={orderData?.name}
              editable={false}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Code"
                value={orderData?.product_id.toString()}
                editable={false}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={orderData?.quantity.toString()}
                editable={false}
              />
            </View>
          </View>

          {/* Reason for Return */}
          <Text style={styles.label}>Reason for Return</Text>
          {reason?.map(item => (
            <TouchableOpacity
              key={item?.return_reason_id}
              style={styles.radioRow}
              onPress={() => setSelectedReason(item)}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedReason?.return_reason_id === item?.return_reason_id &&
                    styles.radioOuterSelected,
                ]}
              >
                {selectedReason?.return_reason_id ===
                  item?.return_reason_id && <View style={styles.radioInner} />}
              </View>

              <Text style={styles.radioLabel}>{item?.name}</Text>
            </TouchableOpacity>
          ))}

          {/* Product Opened */}
          <Text style={styles.label}>Product is Opened</Text>
          {['Yes', 'No'].map(option => (
            <TouchableOpacity
              key={option}
              style={styles.radioRow}
              onPress={() => setProductOpened(option)}
            >
              <View
                style={[
                  styles.radioOuter,
                  productOpened === option && styles.radioOuterSelected,
                ]}
              >
                {productOpened === option && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{option}</Text>
            </TouchableOpacity>
          ))}

          {/* Faulty or Other Details */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Faulty or Other Details</Text>
            <TextInput
              style={[
                styles.input,
                { height: moderateScale(80), textAlignVertical: 'top' },
              ]}
              placeholder="Describe details here..."
              value={reasonDetail}
              onChangeText={setReasonDetail}
              multiline
            />
          </View>

          <View style={styles.termsRow}>
            <TouchableOpacity
              onPress={() => setIsChecked(!isChecked)}
              style={styles.checkboxContainer}
              activeOpacity={0.8}
            >
              <View
                style={[styles.checkbox, isChecked && styles.checkboxChecked]}
              >
                {isChecked && (
                  <Ionicons name="checkmark-sharp" size={15} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                I have read and agree to the{' '}
                <Text style={styles.linkText}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.submitButton}>
          <TouchableOpacity
            onPress={() => returnOrderSubmit()}
            style={styles.button}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {<Loader visible={loader} />}
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logo: { width: '80%', height: moderateScale(40) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
  },
  back: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
  },
  scrollContainer: {
    paddingBottom: moderateScale(20),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK,
    marginTop: moderateScale(5),
    marginBottom: moderateScale(5),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT.BOLD,
    color: Color.RED,
    marginVertical: moderateScale(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginVertical: moderateScale(5),
    marginRight: moderateScale(8),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    marginBottom: 4,
    lineHeight: 24,
    color: Color.GRAY4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: moderateScale(8),
    fontSize: moderateScale(13),
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(4),
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioOuterSelected: { borderColor: '#800000' },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#800000',
  },
  radioLabel: {
    fontSize: moderateScale(16),
    color: Color.BLACK2,
    fontFamily: FONT.MEDIUM,
    lineHeight: 24,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  linkText: { color: '#a20000', textDecorationLine: 'underline' },
  submitButton: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(10),
    alignItems: 'center',
    borderTopWidth: 1, // 👈 adds a top border
    borderTopColor: Color.GRAY2,
  },
  button: {
    width: '30%',
    height: moderateScale(48),
    backgroundColor: Color.RED,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 4,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  dateInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
    height: moderateScale(35), // same as your .input height
  },
  dateTextInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  dateIconContainer: {
    width: moderateScale(40),
    height: '100%',
    backgroundColor: '#f5f5f5', // like Color.GRAY5
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
  },

  checkbox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderWidth: 2,
    borderColor: '#a20000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },

  checkboxChecked: {
    backgroundColor: '#a20000',
  },

  checkboxInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    backgroundColor: '#fff',
    borderRadius: 2,
  },

  termsText: {
    fontSize: moderateScale(14),
    color: '#444',
    flex: 1,
    flexWrap: 'wrap',
  },

  linkText: {
    color: '#a20000',
    textDecorationLine: 'underline',
  },
});

export default ReturnScreen;
