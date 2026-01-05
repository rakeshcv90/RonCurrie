import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  moderateScale,
  ScaledSheet,
  scale,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import Loader from '../Component/Loader';
import { getData, postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import { showToast } from '../utility/showToast';
import { CommonActions } from '@react-navigation/native';
import {
  clearcartProducts,
  setSkipAutoBack,
} from '../Redux/Slice/CartDataShowSlice';
import { useDispatch } from 'react-redux';
import DeliveryOptionsModal from '../Component/DeliveryOptionsModal';

const CustomerDetails = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const totalPrice = route?.params?.totalPrice;
  const cartData = route?.params?.cartData;
  const miscellaneous = route?.params?.addCost;

  const [selectedTab, setSelectedTab] = useState('Collect From Store');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  const [loader, setLoader] = useState(false);
  const [addressData, setAddressData] = useState([]);
 const [postcode, setPostcode] = useState('HA3 0JA');
  const [selectedAddress, setSelectedAddress] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [cashTendered, setCashTendered] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null);

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

      setLoader(false);
      if (res?.responseCode === 200) {
        showToast('success', 'Success!', res?.message || 'Address found');

        // const transformedData =
        //   res.data?.map((address, index) => ({
        //     label: address,
        //     value: index.toString(),
        //     originalAddress: address,
        //   })) || [];
        const transformedData =
          res.data?.map((address, index) => ({
            label: address,
            value: index.toString(),
            originalAddress: address,

            // 🔥 store all extra fields INSIDE each item
            region: res.region,
            country_id: res.country_id,
            country_name: res.country_name,
            zone_id: res.zone_id,
            zone_name: res.zone_name,
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
  const handleChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    setContactNumber(numericText);
  };
  const handleApply = (id, date, name, price) => {
    
    setDeliveryType({
      id: id.id,
      date: id?.date,
      name: id?.name,
      price: id.price,
    });

    setOpenModal(false);
  };

  const onCreateDeliverOrder = async () => {
    const parts = selectedAddress?.originalAddress
      .split(',')
      .map(item => item.trim());

    let addressObj = {};

    if (parts?.length === 2) {
      addressObj = {
        address1: parts[0],
        city: parts[1],
      };
    } else if (parts?.length === 3) {
      addressObj = {
        company: parts[0],
        address1: parts[1],
        city: parts[2],
      };
    } else if (parts?.length === 4) {
      addressObj = {
        company: parts[0],
        address1: parts[1],
        address2: parts[2],
        city: parts[3],
      };
    }
    let validations = [];

    validations = [
      { field: 'postcode', message: 'Please enter your postcode' },
      { field: 'customerName', message: 'Please enter customer name' },
      { field: 'address', message: 'Please enter address' },
      { field: 'phone', message: 'Please enter your phone number' },
    ];

    const formData = {
      postcode: postcode.trim(),
      customerName: customerName.trim(),
      address: selectedAddress?.originalAddress,
      phone: contactNumber.trim(),
      carDetails: carDetails.trim(),
    };

    for (let i = 0; i < validations.length; i++) {
      const { field, message } = validations[i];

      if (!formData[field]) {
        Alert.alert('Validation Error', message);
        return;
      }
      if (field === 'phone') {
        if (formData.phone.length < 10) {
          Alert.alert(
            'Validation Error',
            'Phone number must be at least 10 digits.',
          );
          return;
        } else if (formData.phone.length > 15) {
          Alert.alert(
            'Validation Error',
            'Phone number cannot be more than 15 digits.',
          );
          return;
        }
      }
    }

    const hasMisc = miscellaneous?.some(
      item =>
        item.description?.trim() !== '' || item.price?.toString().trim() !== '',
    );

    const payload = {
      shipping_method: 'Delivery',
      shipping_code: '',
      shipping_type: 'delivery',
      shipping_date: deliveryType?.date,
      shipping_detail_id: deliveryType?.id,
      epos_customer_name: customerName,
      epos_customer_number: contactNumber,
      epos_customer_address: selectedAddress?.originalAddress,
      payment_method: 'epos_system',
      shipping_company: addressObj?.company,
      shipping_address_1: addressObj?.address1,
      shipping_city: addressObj?.city,
      shipping_postcode: postcode,
      shipping_country_id: selectedAddress?.country_id,
      shipping_zone_id: selectedAddress?.zone_id,
      shipping_zone: selectedAddress?.zone_name,
      shipping_country: selectedAddress?.country_name,
    };

    if (hasMisc) {
      payload.miscellaneous = miscellaneous;
    }

    setLoader(true);
  
    try {
      const response = await postData(Api.ORDER_PLACE, payload);

      const resData = response;

      if (resData?.data?.success && resData?.data?.responseCode === 200) {
        showToast(
          'success',
          'Success',
          resData?.data?.message || 'Items added successfully.',
        );

        dispatch(setSkipAutoBack(true));

        navigation.navigate('OrderSuccessFull', {
          resData: resData?.data,
        });
      } else {
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    } finally {
      setLoader(false);
    }
  };
  const onCreateOrder1 = async () => {
    let validations = [];

    validations = [
      { field: 'customerName', message: 'Please enter customer name' },
      { field: 'phone', message: 'Please enter your phone number' },
      { field: 'carDetails', message: 'Please enter car details' },
    ];

    const formData = {
      customerName: customerName.trim(),
      phone: contactNumber.trim(),
      carDetails: carDetails.trim(),
    };

    for (let i = 0; i < validations.length; i++) {
      const { field, message } = validations[i];

      if (!formData[field]) {
        Alert.alert('Validation Error', message);
        return;
      }
      if (field === 'phone') {
        if (formData.phone.length < 10) {
          Alert.alert(
            'Validation Error',
            'Phone number must be at least 10 digits.',
          );
          return;
        } else if (formData.phone.length > 15) {
          Alert.alert(
            'Validation Error',
            'Phone number cannot be more than 15 digits.',
          );
          return;
        }
      }
    }

    const hasMisc = miscellaneous?.some(
      item =>
        item.description?.trim() !== '' || item.price?.toString().trim() !== '',
    );

    const payload = {
      shipping_method: 'Collection',
      shipping_type: 'collection',
      payment_method: 'epos_system',
      shipping_detail_id: 0,
      epos_customer_name: customerName,
      epos_customer_number: contactNumber,
      epos_car_detail: carDetails,
    };

    if (hasMisc) {
      payload.miscellaneous = miscellaneous;
    }

    setLoader(true);

    try {
      const response = await postData(Api.ORDER_PLACE, payload);

      const resData = response;

      if (resData?.data?.success && resData?.data?.responseCode === 200) {
        showToast(
          'success',
          'Success',
          resData?.data?.message || 'Items added successfully.',
        );

        dispatch(setSkipAutoBack(true));

        navigation.navigate('OrderSuccessFull', {
          resData: resData?.data,
        });
      } else {
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    } finally {
      setLoader(false);
    }
  };
  const getTotal = (price, price2) => {
    const cleanPrice2 = Number(price2.replace('£', ''));
    const cleanPrice = Number(price);
    const total = cleanPrice + cleanPrice2;
 

    return total.toFixed(2);
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
       

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name={'arrow-back'}
              size={moderateScale(20)}
              color={Color.GRAY}
            />
          </TouchableOpacity>

          <View style={styles.tab}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Get Delivery' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Get Delivery')}
            >
              <Text style={styles.textStyle}>Get Delivery Costs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Collect From Store' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Collect From Store')}
            >
              <Text style={styles.textStyle}>Collect From Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(50) }}
        >
          <View style={{ padding: scale(10) }}>
            {selectedTab === 'Get Delivery' ? (
              <View>
                <Text style={styles.sectionTitle}>Delivery</Text>
                <Text style={styles.sectionDesc}>
                  Enter your destination to get a delivery estimate.
                </Text>
                <Text style={styles.label}>POST CODE *</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
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
                      setValue(item.value);

                      setSelectedAddress(prev =>
                        prev && prev !== '' ? prev : item,
                      );
                      setIsFocus(false);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    width: '100%',
                    height: moderateScale(48),
                    backgroundColor: Color.BLACK3,
                    borderRadius: moderateScale(4),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const value = selectedAddress?.label || selectedAddress; // if it's an object with label

                    if (
                      !value ||
                      (typeof value === 'string' && !value.trim())
                    ) {
                      Alert.alert(
                        'Validation Error',
                        'Please select address first',
                      );
                    } else {
                      setOpenModal(true);
                    }
                  }}
                >
                  <Text
                    style={{
                      color: Color.WHITE,
                      fontFamily: FONT.SEMIBOLD,
                      fontSize: 14,
                      lineHeight: 24,
                    }}
                  >
                    Delivery Option
                  </Text>
                </TouchableOpacity>

                {deliveryType != null && (
                  <>
                    <View
                      style={{
                        width: '100%',
                        height: moderateScale(116),
                        backgroundColor: Color.GRAY3,
                        borderRadius: moderateScale(4),
                        alignItems: 'center',
                        marginVertical: moderateScale(16),
                      }}
                    >
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingHorizontal: 10,
                          marginTop: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: Color.GRAY,
                            fontFamily: FONT.BOLD,
                            fontSize: 16,
                            lineHeight: 24,
                          }}
                        >
                          Sub-Total:
                        </Text>

                        <Text
                          style={{
                            color: Color.BLACK,
                            fontFamily: FONT.BOLD,
                            fontSize: 16,
                            lineHeight: 24,
                          }}
                        >
                          £{totalPrice}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingHorizontal: 10,
                        }}
                      >
                        <View style={{ width: 200 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: Color.GRAY,
                              fontFamily: FONT.BOLD,
                              fontSize: 16,

                              lineHeight: 24,
                            }}
                          >
                            {deliveryType?.name}:
                          </Text>
                        </View>

                        <Text
                          style={{
                            color: Color.BLACK,
                            fontFamily: FONT.BOLD,
                            fontSize: 16,
                            lineHeight: 24,
                          }}
                        >
                          {deliveryType?.price}:
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '100%',
                          height: 1,
                          backgroundColor: Color.GRAY5,
                          marginTop: 10,
                        }}
                      />
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingHorizontal: 10,
                          alignItems: 'center',
                          marginTop: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: Color.GRAY,
                            fontFamily: FONT.BOLD,
                            fontSize: 16,
                            lineHeight: 24,
                          }}
                        >
                          Preferred Date:
                        </Text>
                        <Text
                          style={{
                            color: Color.BLACK,
                            fontFamily: FONT.BOLD,
                            fontSize: 16,
                            lineHeight: 24,
                          }}
                        >
                          {deliveryType?.date}:
                        </Text>
                      </View>
                    </View>

                    <View style={styles.totalContainer}>
                      <View>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>
                          £{getTotal(totalPrice, deliveryType?.price)}
                        </Text>
                      </View>
                      <View style={styles.cashBox}>
                        <Text style={styles.cashLabel}>CASH TENDERED</Text>
                        <View style={styles.cashInputRow}>
                          <Text style={styles.cashSymbol}>£</Text>
                          <TextInput
                            style={styles.cashInput}
                            keyboardType="numeric"
                            value={cashTendered}
                            placeholder="0.00"
                            onChangeText={setCashTendered}
                          />
                        </View>
                        {cashTendered && (
                          <Text style={styles.changeText}>
                            Change To Give:{' '}
                            <Text style={styles.changeValue}>
                              £
                              {(
                                parseFloat(cashTendered || 0) -
                                parseFloat(
                                  getTotal(totalPrice, deliveryType?.price) ||
                                    0,
                                )
                              ).toFixed(2)}
                            </Text>
                          </Text>
                        )}
                      </View>
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>Customer Information</Text>

                <Text style={styles.label}>CUSTOMER NAME</Text>
                <TextInput
                  style={styles.input2}
                  placeholder="Enter Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                />

                <Text style={styles.label}>CUSTOMER DELIVERY ADDRESS</Text>
                <TextInput
                  style={[styles.input2, styles.multilineInput]}
                  placeholder="Delivery Address"
                  value={selectedAddress?.originalAddress}
                  multiline={true}
                  textAlignVertical="top"
                  onChangeText={text => setSelectedAddress(text)}
                />

                <Text style={styles.label}>CUSTOMER CONTACT NUMBER</Text>
                <TextInput
                  style={styles.input2}
                  placeholder="Enter Contact Number"
                  value={contactNumber}
                  onChangeText={handleChange}
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Customer Details</Text>
                <Text style={styles.label}>CUSTOMER NAME</Text>
                <TextInput
                  style={styles.input2}
                  placeholder="Enter Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <Text style={styles.label}>CUSTOMER CONTACT NUMBER</Text>
                <TextInput
                  style={styles.input2}
                  placeholder="Enter Contact Number"
                  value={contactNumber}
                  onChangeText={handleChange}
                  keyboardType="phone-pad"
                />
                <Text style={styles.label}>CAR DETAILS</Text>
                <TextInput
                  style={styles.input2}
                  placeholder="Enter car details"
                  value={carDetails}
                  onChangeText={setCarDetails}
                />

                <>
                  <View
                    style={{
                      width: '100%',

                      backgroundColor: Color.GRAY3,
                      borderRadius: moderateScale(4),
                      alignItems: 'center',
                      padding: 10,
                    }}
                  >
                    <View
                      style={{
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          color: Color.GRAY,
                          fontFamily: FONT.BOLD,
                          fontSize: 16,
                          lineHeight: 24,
                        }}
                      >
                        Sub-Total:
                      </Text>
                      <Text
                        style={{
                          color: Color.BLACK,
                          fontFamily: FONT.BOLD,
                          fontSize: 16,
                          lineHeight: 24,
                        }}
                      >
                        £{totalPrice}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.totalContainer, { marginTop: 10 }]}>
                    <View>
                      <Text style={styles.totalLabel}>TOTAL</Text>
                      <Text style={styles.totalValue}>£{totalPrice}</Text>
                    </View>
                    <View style={styles.cashBox}>
                      <Text style={styles.cashLabel}>CASH TENDERED</Text>
                      <View style={styles.cashInputRow}>
                        <Text style={styles.cashSymbol}>£</Text>
                        <TextInput
                          style={styles.cashInput}
                          keyboardType="numeric"
                          value={cashTendered}
                          placeholder="0.00"
                          onChangeText={setCashTendered}
                        />
                      </View>
                      {cashTendered && (
                        <Text style={styles.changeText}>
                          Change To Give:{' '}
                          <Text style={styles.changeValue}>
                            £
                            {(
                              parseFloat(cashTendered || 0) -
                              parseFloat(totalPrice || 0)
                            ).toFixed(2)}
                          </Text>
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              </View>
            )}
          </View>
        </ScrollView>
        {selectedTab == 'Get Delivery' && deliveryType != null && (
          <View style={styles.actionRow}>
            <View style={styles.pushWrapper}></View>

            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={() => {
                onCreateDeliverOrder();
              }}
            >
              <Text style={styles.createOrderText}>Create Order</Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedTab != 'Get Delivery' && (
          <View style={styles.actionRow}>
            <View style={styles.pushWrapper}></View>

            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={() => {
                onCreateOrder1();
              }}
            >
              <Text style={styles.createOrderText}>Create Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {openModal && (
          <DeliveryOptionsModal
            visible={openModal}
            onClose={() => setOpenModal(false)}
            onApply={handleApply}
            cartData={cartData}
            addressData={selectedAddress}
            areaPin={postcode}
          />
        )}
      </KeyboardAvoidingView>

      <Loader visible={loader} />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(12),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: verticalScale(40),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: scale(40),
    height: scale(40),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(10),
    gap: 2,
  },
  back: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    padding: scale(2),
  },
  tabButton: {
    paddingHorizontal: scale(10),
    height: verticalScale(35),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: Color.RED,
  },
  textStyle: {
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },

  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT.EXTRABOLD,
    color: Color.RED,

    marginBottom: verticalScale(5),
  },
  sectionDesc: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
    marginTop: verticalScale(12),
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  input: {
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
  multilineInput: {
    height: moderateScale(100),
    paddingTop: verticalScale(10),
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.GRAY3,
    padding: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: Color.GRAY2,
  },

  pushWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  circleCheck: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Color.RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },

  checkMark: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },

  toggleText: {
    fontSize: moderateScale(14),
    fontFamily: FONT.MEDIUM,
    color: '#555',
  },

  createOrderBtn: {
    backgroundColor: Color.RED,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(25),
    borderRadius: moderateScale(8),
  },

  createOrderText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontFamily: FONT.BOLD,
  },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    paddingHorizontal: moderateScale(10),
    marginBottom: 10,
  },

  totalLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: verticalScale(20),
  },
  cashBox: { alignItems: 'flex-end' },
  cashLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  cashInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    width: 100,
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashSymbol: { fontSize: 16, marginRight: 5 },
  cashInput: { fontSize: 16, width: moderateScale(60) },
  cashInput1: { fontSize: 16, width: moderateScale(130) },
  changeText: { fontSize: 14 },
  changeValue: { color: 'red', fontWeight: '600' },
});

export default CustomerDetails;
