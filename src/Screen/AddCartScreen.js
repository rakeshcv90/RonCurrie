/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  moderateScale,
  scale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Api, ImageBaseUrl } from '../utility/api';
import { deleteData, getData, postData } from '../utility/ApiCall';
import { showToast } from '../utility/showToast';
import { MMKVStorage } from '../utility/MmkvStore';
import CartComponent from '../Component/CartComponent';
import CartHeader from './Component/Cart/CartHeader';
import CartSearchResults from './Component/Cart/CartSearchResults';
import CartOrderButton from './Component/Cart/CartOrderButton';
import MiscProductsList from './Component/Cart/MiscProductsList';
import RenderItem from '../Component/RenderItem';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import FastImage from 'react-native-fast-image';
import { useCartCalculations } from './Component/Cart/useCartCalculations';
import { useMiscProducts } from './Component/Cart/useMiscProducts';
import CartOrderSummary from './Component/Cart/CartOrderSummary';
import Loader from '../Component/Loader';
import {
  fetchMiscData,
  setSkipAutoBack,
} from '../Redux/Slice/CartDataShowSlice';
import { Dropdown } from 'react-native-element-dropdown';
import DeliveryOptionsModal from '../Component/DeliveryOptionsModal';
import { fetchA4PrintDetails } from '../Redux/Slice/A4PrintSlice';

import decodeHtml from '../utility/decodeHtml';

import AddressMapPin from './Component/AddressMapPin';

const AddCartScreen = ({ navigation }) => {
  const [loader, setLoader] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const [userData, setUserData] = useState(null);
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const [searchNoResults, setSearchNoResults] = useState(false);
  const {
    cartList,
    miscList: reduxMiscList,
    loading,
    miscRefreshKey,
    skipAutoBack,
  } = useSelector(state => state.cartListData);
  const {
    miscList,
    handleAddMisc,
    handleChange,
    toggleSign,
    handleDeleteMisc,
    syncMiscellaneous,
  } = useMiscProducts(reduxMiscList, loading);
  const { calculateMatrixPrice, totalPrice, hasInvalidQuantity } =
    useCartCalculations(cartList, miscList);

  const [selectedTab, setSelectedTab] = useState('Collect From Store');
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const [addressData, setAddressData] = useState([]);
  const [postcode, setPostcode] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState(null);
  const [notes, setNotes] = useState('');
  const searchRef = useRef(null);

  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [confirmedLocationCoords, setConfirmedLocationCoords] = useState(null);

  useEffect(() => {
    const handleCartEmpty = async () => {
      if (cartList?.length === 0 && !loading && !hasNavigatedBack) {
        if (skipAutoBack) {
          dispatch(setSkipAutoBack(false));
          return;
        }
        await syncMiscellaneous([], true);
        setHasNavigatedBack(true);
        setTimeout(() => {
          navigation.navigate('Home');
        }, 100);
      } else if (cartList?.length > 0 && hasNavigatedBack) {
        setHasNavigatedBack(false);
      }
    };

    handleCartEmpty();
  }, [cartList, navigation, skipAutoBack, loading]);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData?.customer_id) {
      dispatch(fetchMiscData(userData.customer_id));
    }
  }, [userData, miscRefreshKey, dispatch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
  };

  const handleImageError = useCallback(id => {
    setImageErrorMap(prev => {
      if (prev[id]) return prev; // prevent unnecessary state update
      return { ...prev, [id]: true };
    });
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      const hasError = imageErrorMap[item.id];
      const imageSource =
        item?.image && !hasError
          ? {
              uri: ImageBaseUrl + item.image,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }
          : ImageData.NOIMAGE;

      return (
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => handleItemPress(item)}
        >
          <FastImage
            style={styles.itemImage}
            source={imageSource}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => handleImageError(item.id)}
          />

          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>
              {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
            </Text>
            <Text style={styles.itemPrice}>
              £ {Number(item.price).toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [imageErrorMap, handleImageError, handleItemPress],
  );

  const itemCount = useMemo(() => {
    const subTotal = cartList?.reduce(
      (sum, item) => sum + (item?.cart_quantity || 0),
      0,
    );
    return Number(subTotal) || 0;
  }, [cartList]);

  const totalCluster = useMemo(() => {
    const clusterMap = cartList?.reduce((acc, item) => {
      const productId = item?.product_id;
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(clusterMap || {}).length;
  }, [cartList]);
  const onCreateOrder1 = async data => {
    const hasInvalidMisc = miscList?.some(item => {
      const hasDescription =
        typeof item.description === 'string' &&
        item.description.trim().length > 0;

      const hasPrice =
        item?.price !== null &&
        item?.price !== undefined &&
        item?.price.toString().trim() !== '';

      return (hasDescription && !hasPrice) || (!hasDescription && hasPrice);
    });

    if (hasInvalidMisc) {
      Alert.alert(
        'Validation Error',
        'Please enter both Description and Price for miscellaneous items.',
      );
      return;
    }
    const hasMisc = miscList.some(item => {
      const hasDescription =
        typeof item.description === 'string' &&
        item.description.trim().length > 0;

      const hasPrice =
        item.price !== null &&
        item.price !== undefined &&
        item.price.toString().trim() !== '';

      return hasDescription || hasPrice;
    });

    const payload = {
      shipping_method: 'Collection',
      shipping_type: 'collection',
      payment_method: 'epos_system',
      shipping_detail_id: 0,
      epos_customer_name: customerName,
      // epos_customer_number: contactNumber,
      epos_car_detail: carDetails,
      notify: 0,
      payment_code: '',
      collection_push_notification: data,
      comment: notes,
    };

    if (hasMisc) {
      payload.miscellaneous = miscList
        // keep only valid rows
        .filter(item => {
          const hasDescription =
            typeof item.description === 'string' &&
            item.description.trim() !== '';

          const hasPrice =
            item.price !== null &&
            item.price !== undefined &&
            item.price.toString().trim() !== '';

          return hasDescription && hasPrice;
        })
        // map to API format
        .map(item => {
          const amount = Math.abs(Number(item.price) || 0);

          return {
            description: item.description.trim(),
            price: item.isNegative ? -amount : amount,
          };
        });
    }

    setLoader(true);

    try {
      const response = await postData(Api.ORDER_PLACE, payload);
      const resData = response;

      if (resData?.data?.success && resData?.data?.responseCode === 200) {
        // showToast(
        //   'success',
        //   'Success',
        //   resData?.data?.message || 'Items added successfully.',
        // );

        dispatch(setSkipAutoBack(true));
        dispatch(fetchA4PrintDetails(resData?.data?.data?.order_id)).unwrap();
        navigation.navigate('OrderSuccessFull', {
          resData: resData?.data,
        });
      } else {
      }
    } catch (error) {
      console.log('Error adding to basket:', error?.response);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    } finally {
      setLoader(false);
    }
  };

  const onCreateDeliverOrder = async () => {
    const parts = selectedAddress?.originalAddress
      .split(',')
      .map(item => item.trim());

    let addressObj = {
      company: '',
      address1: '',
      address2: '',
      city: '',
    };

    if (parts.length > 0) {
      addressObj.city = parts.pop();
    }
    if (parts.length > 0) {
      const first = parts[0].toLowerCase();

      if (
        first.includes('pvt') ||
        first.includes('ltd') ||
        first.includes('private') ||
        first.includes('company')
      ) {
        addressObj.company = parts.shift();
      }
    }

    // 👉 Address 1
    if (parts.length > 0) {
      addressObj.address1 = parts.shift();
    }

    // 👉 Address 2 (remaining)
    if (parts.length > 0) {
      addressObj.address2 = parts.join(', ');
    }

    const hasInvalidMisc = miscList?.some(item => {
      const hasDescription =
        typeof item.description === 'string' &&
        item.description.trim().length > 0;

      const hasPrice =
        item.price !== null &&
        item.price !== undefined &&
        item.price.toString().trim() !== '';

      // ❌ One filled, the other missing
      return (hasDescription && !hasPrice) || (!hasDescription && hasPrice);
    });

    if (hasInvalidMisc) {
      Alert.alert(
        'Validation Error',
        'Please enter both Description and Price for miscellaneous items.',
      );
      return;
    }
    const formData = {
      postcode: postcode.trim(),
      customerName: customerName.trim(),
      address: selectedAddress?.originalAddress,
      phone: contactNumber.trim(),
      carDetails: carDetails.trim(),
    };

    if (!contactNumber || contactNumber.trim() === '') {
      setPhoneError('Please enter your phone number');
      return;
    }

    if (contactNumber.length > 16) {
      setPhoneError('Phone number cannot be more than 16 digits');
      return;
    }

    setPhoneError('');

    const hasMisc = miscList?.some(item => {
      const hasDescription =
        typeof item.description === 'string' && item.description.trim() !== '';

      const hasPrice =
        item.price !== null &&
        item.price !== undefined &&
        item.price.toString().trim() !== '';

      return hasDescription || hasPrice;
    });

    const payload = {
      shipping_method: deliveryType?.name,
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
      notify: 0,
      comment: notes,
      shipping_latitude: confirmedLocationCoords?.lat || '',
      shipping_longitude: confirmedLocationCoords?.lng || '',
    };

    if (hasMisc) {
      payload.miscellaneous = miscList
        .filter(item => {
          const hasDescription =
            typeof item.description === 'string' &&
            item.description.trim() !== '';

          const hasPrice =
            item.price !== null &&
            item.price !== undefined &&
            item.price.toString().trim() !== '';

          return hasDescription || hasPrice;
        })
        .map(item => {
          const amount = Math.abs(Number(item.price) || 0);

          return {
            description: item.description.trim(),
            price: item.isNegative ? -amount : amount,
          };
        });
    }

    setLoader(true);

    try {
      const response = await postData(Api.ORDER_PLACE, payload);

      const resData = response;

      if (resData?.data?.success && resData?.data?.responseCode === 200) {
        // showToast(
        //   'success',
        //   'Success',
        //   resData?.data?.message || 'Items added successfully.',
        // );

        dispatch(setSkipAutoBack(true));

        navigation.navigate('OrderSuccessFull', {
          resData: resData?.data,
        });
      } else {
      }
      // eslint-disable-next-line no-catch-shadow
    } catch (error) {
      console.log('Error adding to basket:', error);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    } finally {
      setLoader(false);
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

      setLoader(false);
      if (res?.responseCode === 200) {
        // showToast('success', 'Success!', res?.message || 'Address found');
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
      // eslint-disable-next-line no-catch-shadow
    } catch (error) {
      setLoader(false);
      setAddressData([]);

      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        console.log('xcvxcvxcvxcvxcvcxv', error);
        // showToast('danger', 'Login Failed', error.message);
      } else if (error?.response?.status === 404) {
        showToast('danger', 'Data List', error?.response?.data?.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error?.response?.data?.message || 'Something went wrong',
        );
      }
    }
  };
  const addressMapQuery = selectedAddress
    ? `${selectedAddress.originalAddress}, ${postcode || ''}, UK`
    : '';

  const handleApply = (id, date, name, price) => {
    setDeliveryType({
      id: id.id,
      date: id?.date,
      name: id?.name,
      price: id.price,
    });

    setOpenModal(false);
  };

  useEffect(() => {
    if (!cartList || cartList?.length === 0) {
      setDeliveryType(null);
    }
  }, [cartList]);

  const deleteDeliverAddress = async () => {
    // setLoader(true);
    try {
      const response = await deleteData(
        `${Api.DELIVERIES}/${userData?.customer_id}`,
      );
      // console.log('xccxvxcvxcvcxvvcx', response);
      // // if (response?.status === 201) {
      // // } else {
      // //   setLoader(false);
      // // }
    } catch (e) {
      console.log('Apply Shipping Error:', e);
      showToast('danger', 'Error', 'Failed to apply shipping option');
    } finally {
      setLoader(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SearchComponent
        ref={searchRef}
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
        onNoResults={setSearchNoResults}
      />
      {results?.length > 0 || searchNoResults ? (
        <CartSearchResults
          results={results}
          searchNoResults={searchNoResults}
          loadingMore={loadingMore}
          loadMoreFunc={loadMoreFunc}
          renderItem={renderItem}
        />
      ) : (
        <>
          <KeyboardAvoidingView
            style={{ flex: 1, marginVertical: verticalScale(15) }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <CartHeader
              cartListLength={cartList?.length || 0}
              miscListLength={reduxMiscList?.miscellaneous?.length || 0}
              totalCluster={totalCluster}
              itemCount={itemCount}
              onBackPress={() => navigation.goBack()}
            />
            <FlatList
              style={{ flex: 1, marginBottom: moderateScale(20) }}
              contentContainerStyle={{ paddingBottom: moderateScale(200) }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              data={cartList}
              keyExtractor={(item, index) => String(item.cart_id ?? index)}
              renderItem={({ item }) => (
                <RenderItem item={item} navigation={navigation} />
              )}
              ListFooterComponent={
                <View>
                  <MiscProductsList
                    miscList={miscList}
                    handleChange={handleChange}
                    toggleSign={toggleSign}
                    handleDeleteMisc={handleDeleteMisc}
                    handleAddMisc={handleAddMisc}
                  />
                  <View
                    style={{
                      width: '100%',
                      marginVertical: 10,
                      borderRadius: moderateScale(4),
                      alignItems: 'flex-start',
                      paddingHorizontal: verticalScale(10),
                      // padding: 10,
                    }}
                  >
                    <Text style={styles.label}>NOTES</Text>
                    <TextInput
                      style={styles.input2}
                      placeholder="Enter Notes"
                      value={notes}
                      onChangeText={setNotes}
                    />
                  </View>

                  <View style={styles.tabHeader}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'Collect From Store' &&
                          styles.selectedTab,
                      ]}
                      onPress={() => {
                        setSelectedTab('Collect From Store'),
                          setDeliveryType(null);
                        deleteDeliverAddress();
                      }}
                    >
                      <Image
                        source={IconData.HOME}
                        style={{ width: 20, height: 20 }}
                      />

                      <Text style={styles.textStyle}>Collect From Store</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'Get Delivery' && styles.selectedTab,
                      ]}
                      onPress={() => setSelectedTab('Get Delivery')}
                    >
                      <Image
                        source={IconData.CAR}
                        style={{ width: 20, height: 20 }}
                      />
                      <Text style={styles.textStyle}>Delivery</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ padding: scale(10) }}>
                    {selectedTab === 'Get Delivery' ? (
                      <>
                        <View>
                          <Text style={styles.sectionTitle}>Delivery</Text>
                          <Text style={styles.sectionDesc}>
                            Enter your destination to get a delivery estimate.
                          </Text>
                          <Text style={styles.label}>POST CODE *</Text>
                          <View style={styles.rowAddress}>
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
                              <Text style={styles.findBtnText}>
                                Find Address
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {addressData?.length > 0 && (
                            <>
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

                                    setSelectedAddress(item);
                                    setIsFocus(false);
                                  }}
                                />
                              </View>
                            </>
                          )}

                          {selectedAddress && (
                            <>
                              <AddressMapPin
                                addressQuery={addressMapQuery}
                                onConfirm={coords => {
                                  console.log('Final Lat Long:', coords);
                                  setIsLocationConfirmed(true);
                                  setConfirmedLocationCoords(coords);
                                }}
                                onPinMoved={() => {
                                  setIsLocationConfirmed(false);
                                  setConfirmedLocationCoords(null);
                                }}
                              />

                              <View style={{ marginTop: 10 }}>
                                <Text style={styles.sectionTitle}>
                                  Customer Information
                                </Text>
                                <Text style={styles.label}>CUSTOMER NAME</Text>
                                <TextInput
                                  style={styles.input2}
                                  placeholder="Enter Name"
                                  value={customerName}
                                  onChangeText={setCustomerName}
                                />

                                <Text style={styles.label}>
                                  CUSTOMER DELIVERY ADDRESS
                                </Text>
                                <TextInput
                                  style={[styles.input2, styles.multilineInput]}
                                  placeholder="Delivery Address"
                                  value={selectedAddress?.originalAddress}
                                  multiline={true}
                                  textAlignVertical="top"
                                  onChangeText={text =>
                                    setSelectedAddress(prev => ({
                                      ...prev,
                                      originalAddress: text,
                                    }))
                                  }
                                />

                                <Text style={styles.label}>
                                  CUSTOMER CONTACT NUMBER
                                  <Text style={{ color: Color.RED }}>*</Text>
                                </Text>
                                <TextInput
                                  style={[
                                    styles.input2,
                                    phoneError && { borderColor: Color.RED },
                                  ]}
                                  placeholder="Enter Contact Number"
                                  value={contactNumber}
                                  // onChangeText={setContactNumber}
                                  keyboardType="phone-pad"
                                  maxLength={16}
                                  onChangeText={text => {
                                    const cleaned = text.replace(/[^0-9]/g, '');

                                    setContactNumber(cleaned);

                                    if (cleaned.length === 0) {
                                      setPhoneError(
                                        'Please enter your phone number',
                                      );
                                    } else if (cleaned.length > 16) {
                                      setPhoneError(
                                        'Maximum 16 digits allowed',
                                      );
                                    } else {
                                      setPhoneError(''); // valid
                                    }
                                  }}
                                />

                                {phoneError ? (
                                  <Text
                                    style={{
                                      color: Color.RED,
                                      fontSize: 12,
                                      marginTop: 4,
                                    }}
                                  >
                                    {phoneError}
                                  </Text>
                                ) : null}
                              </View>

                              <TouchableOpacity
                                style={{
                                  width: '100%',
                                  height: moderateScale(48),
                                  backgroundColor: Color.RED,
                                  borderRadius: moderateScale(4),
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginTop: 5,
                                }}
                                onPress={() => {
                                  if (!isLocationConfirmed) {
                                    Alert.alert(
                                      'Validation Error',
                                      'Please select address first',
                                    );
                                    return;
                                  }

                                  const value =
                                    selectedAddress?.label || selectedAddress; // if it's an object with label

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
                                  Choose Deliver Service
                                </Text>
                              </TouchableOpacity>
                              <CartOrderSummary
                                deliveryType={deliveryType}
                                totalPrice={totalPrice}
                              />
                            </>
                          )}
                        </View>
                      </>
                    ) : (
                      <View>
                        <>
                          <View
                            style={{
                              width: '100%',
                              marginVertical: 10,
                              borderRadius: moderateScale(4),
                              alignItems: 'center',
                              paddingHorizontal: verticalScale(10),
                              // padding: 10,
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
                                  fontSize: 18,
                                  lineHeight: 24,
                                }}
                              >
                                Total:
                              </Text>
                              <Text
                                style={{
                                  color: Color.BLACK,
                                  fontFamily: FONT.BOLD,
                                  fontSize: 18,
                                  lineHeight: 24,
                                }}
                              >
                                £{totalPrice}
                              </Text>
                            </View>
                          </View>
                        </>
                      </View>
                    )}
                  </View>
                </View>
              }
            />
            <View style={{ top: verticalScale(10) }}>
              <CartComponent />
            </View>

            {((selectedTab == 'Get Delivery' && deliveryType != null) ||
              (selectedTab !== 'Get Delivery' && deliveryType == null)) && (
              <CartOrderButton
                hasInvalidQuantity={hasInvalidQuantity}
                onPress={() => {
                  if (selectedTab == 'Get Delivery') {
                    onCreateDeliverOrder();
                  } else {
                    onCreateOrder1(0);
                  }
                }}
              />
            )}
          </KeyboardAvoidingView>

          {openModal && (
            <DeliveryOptionsModal
              visible={openModal}
              onClose={() => setOpenModal(false)}
              onApply={handleApply}
              cartData={cartList}
              addressData={selectedAddress}
              areaPin={postcode}
              selectedOptionId={deliveryType?.id}
            />
          )}
        </>
      )}

      <Loader visible={loader} />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: verticalScale(10),
    marginTop: -10,
  },
  back: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(5) },
  miscBtn: {
    backgroundColor: '#3D3D3D',
    padding: verticalScale(12),
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  miscText: { color: '#fff', fontWeight: '600' },
  totalLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  cashBox: { alignItems: 'flex-end' },
  cashLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  cashInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(5),
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashSymbol: { fontSize: 16, marginRight: 5 },
  cashInput1: { fontSize: 16, width: moderateScale(130), color: Color.BLACK2 },
  bottomBtn: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(5),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Color.GRAY2,
  },
  bottomBtnText: {
    color: Color.WHITE,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONT.SEMIBOLD,
  },
  groupText: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    lineHeight: moderateScale(24),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
    gap: moderateScale(5),
  },
  itemImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  itemName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: moderateScale(13),
    color: '#555',
  },

  tabHeader: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    padding: verticalScale(2),
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: scale(12), // reduce horizontal padding
    height: verticalScale(35),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6, // smaller gap
    alignSelf: 'flex-start',
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
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  input2: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(6),
    height: moderateScale(45),
    fontSize: moderateScale(14),
    width: '100%',
    paddingHorizontal: 10,
    // fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    marginTop: verticalScale(5),
    marginBottom: verticalScale(5),
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
  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT.EXTRABOLD,
    color: Color.RED,

    marginBottom: verticalScale(5),
  },
  rowAddress: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  findBtn: {
    backgroundColor: Color.RED,
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
  sidePanel: {
    width: verticalScale(35),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  qtyBtnCircle: {
    height: verticalScale(28),
    width: verticalScale(28),
    borderRadius: verticalScale(14),
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    top: -1,
  },

  gif: {
    width: 200,
    height: 200,
  },
  emptyContainer: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultText: {
    fontSize: '20@s',
    fontFamily: FONT.SEMIBOLD,
  },
  noResultSubText: {
    fontSize: '14@s',
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
  },
});

export default React.memo(AddCartScreen);
