import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Animated,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  moderateScale,
  scale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';

import { Api, ImageBaseUrl } from '../utility/api';
import { getData, postData } from '../utility/ApiCall';
import { showToast } from '../utility/showToast';
import CartComponent from '../Component/CartComponent';
import RenderItem from '../Component/RenderItem';
import { CommonActions } from '@react-navigation/native';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import FastImage from 'react-native-fast-image';
import Loader from '../Component/Loader';
import { setSkipAutoBack } from '../Redux/Slice/CartDataShowSlice';
import { Dropdown } from 'react-native-element-dropdown';
import DeliveryOptionsModal from '../Component/DeliveryOptionsModal';
import { fetchA4PrintDetails } from '../Redux/Slice/A4PrintSlice';
import { Dimensions } from 'react-native';
import decodeHtml from '../utility/decodeHtml';
const windowHeight = Dimensions.get('window').height;
const AddCartScreen = ({ navigation }) => {
  const [loader, setLoader] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const { cartList, loading, error, refreshKey, skipAutoBack } = useSelector(
    state => state.cartListData,
  );
  const [miscList, setMiscList] = useState([
    { id: Date.now(), description: '', price: '', isNegative: false },
  ]);

  const [selectedTab, setSelectedTab] = useState('Collect From Store');
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const [addressData, setAddressData] = useState([]);
  const [postcode, setPostcode] = useState('MK62QD');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState(null);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (skipAutoBack) return;
    if (cartList?.length === 0 && !hasNavigatedBack) {
      setHasNavigatedBack(true);
      navigation.goBack();
    } else if (cartList?.length > 0 && hasNavigatedBack) {
      setHasNavigatedBack(false);
    }
  }, [cartList, navigation]);
  const handleAddMisc = () => {
    setMiscList(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(), // UNIQUE KEY (important!)
        description: '',
        price: '',
        isNegative: false, // always default
      },
    ]);
  };

  const handleChange = (id, field, value) => {
    setMiscList(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const calculateMatrixPrice = useCallback(item => {
    const { matrix, additional_option, cart_quantity, cart_id } = item;
    const additionalOptionArray = JSON.parse(additional_option || '[]');

    if (!matrix || matrix?.length === 0) {
      let customOptionPrice = 0;
      let parsedOption;

      try {
        parsedOption = JSON.parse(additional_option || '[]');
      } catch {
        parsedOption = [];
      }

      if (
        parsedOption &&
        !Array.isArray(parsedOption) &&
        Object.keys(parsedOption).length > 0
      ) {
        const firstValue = Object.values(parsedOption)[0];
        if (typeof firstValue === 'string' && firstValue?.includes('#')) {
          const parts = firstValue?.split('#');

          const middleValue = firstValue.split('#')[2];
          const secondValue = firstValue.split('#')[1];
          const totalPriceNumber =
            (Number(secondValue) || 0) *
            (Number(item?.options?.[0]?.bespoke_factor_val) || 0) *
            (Number(item?.cart_quantity) || 0);

          customOptionPrice = totalPriceNumber || 0;
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;

          const basePrice = item?.price;

          const finalPrice = price > 0 ? price : basePrice;

          customOptionPrice = Number(finalPrice) * cart_quantity || 0;
        }
      }
      // Case 2: parsedOption is array (like [])
      else if (Array.isArray(parsedOption) && parsedOption?.length === 0) {
        customOptionPrice = Number(item?.price) * cart_quantity || 0;
      }

      return customOptionPrice;
    }

    let optionData = {};
    try {
      optionData = JSON.parse(additional_option);
    } catch (e) {
      parsedOption = [];
      // return Number(item.price) * (cart_quantity || 1);
    }

    const values = Object.values(optionData)
      .map(Number)
      .filter(v => !isNaN(v));

    const [width, height] = values.map(v => Math.floor(parseFloat(v)));

    let matched = matrix.find(m => m.width === width && m.height === height);

    if (!matched) {
      const largerMatches = matrix.filter(
        m => m.width >= width && m.height >= height,
      );

      if (largerMatches.length > 0) {
        matched = largerMatches.sort(
          (a, b) =>
            a.width -
            width +
            (a.height - height) -
            (b.width - width + (b.height - height)),
        )[0];
      } else {
        matched = matrix.sort(
          (a, b) => b.width - a.width || b.height - a.height,
        )[0];
      }
    }

    const matrixPrice = Number(matched?.price || 0);

    return matrixPrice * (cart_quantity || 1);
  }, []);

  const totalPrice = useMemo(() => {
    if (!cartList?.length) return '0.00';

    const subTotal = cartList.reduce((sum, item) => {
      const price = calculateMatrixPrice(item);
      return item.mode === 1 || item.mode === 2 ? sum - price : sum + price;
    }, 0);

    const miscTotal = miscList.reduce((sum, misc) => {
      const amt = parseFloat(misc.price) || 0;
      return misc.isNegative ? sum - amt : sum + amt;
    }, 0);

    return (subTotal + miscTotal).toFixed(2);
  }, [cartList, miscList]);

  const handleDeleteMisc = id => {
    setMiscList(prev => prev.filter(item => item.id !== id));
  };
  useEffect(() => {
    if (cartList?.length === 0) {
      navigation.goBack();
    }
  }, [cartList, navigation]);

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
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

  const getItemCount = () => {
    const subTotal = cartList?.reduce(
      (sum, item) => sum + item?.cart_quantity,
      0,
    );

    return Number(subTotal);
  };
  const getTotalCluster = () => {
    const clusterMap = cartList?.reduce((acc, item) => {
      const productId = item?.product_id;
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(clusterMap || {}).length;
  };
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
        showToast(
          'success',
          'Success',
          resData?.data?.message || 'Items added successfully.',
        );

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
    // let validations = [];

    // validations = [
    //   { field: 'phone', message: 'Please enter your phone number' },
    // ];
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

    // for (let i = 0; i < validations.length; i++) {
    //   const { field, message } = validations[i];

    //   // if (!formData[field]) {
    //   //   Alert.alert('Validation Error', message);
    //   //   return;
    //   // }
    //   if (field === 'phone') {
    //     if (formData.phone.length < 10) {
    //       Alert.alert(
    //         'Validation Error',
    //         'Phone number must be at least 10 digits.',
    //       );
    //       return;
    //     } else if (formData.phone.length > 15) {
    //       Alert.alert(
    //         'Validation Error',
    //         'Phone number cannot be more than 15 digits.',
    //       );
    //       return;
    //     }
    //   }
    // }
    // Phone validation only
    if (!contactNumber || contactNumber.trim() === '') {
      setPhoneError('Please enter your phone number');
      return;
    }

    // if (contactNumber.length < 10) {
    //   setPhoneError('Phone number must be at least 10 digits');
    //   return;
    // }

    if (contactNumber.length > 16) {
      setPhoneError('Phone number cannot be more than 16 digits');
      return;
    }

    // ✅ Clear error if valid
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
        showToast('success', 'Success!', res?.message || 'Address found');
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
  const handleApply = (id, date, name, price) => {
    setDeliveryType({
      id: id.id,
      date: id?.date,
      name: id?.name,
      price: id.price,
    });

    setOpenModal(false);
  };

  const getTotal = (price, price2) => {
    const cleanPrice2 = Number(price2?.replace('£', '') || 0);
    const cleanPrice = Number(price);
    const total = cleanPrice + cleanPrice2;

    return total.toFixed(2);
  };

  const toggleSign = id => {
    setMiscList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isNegative: !item.isNegative } : item,
      ),
    );
  };
  // useEffect(() => {
  //   setDeliveryType(null);
  // }, [cartList,]);

  useEffect(() => {
    if (!cartList || cartList?.length === 0) {
      setDeliveryType(null);
    }
  }, [cartList]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SearchComponent
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
      />
      {results?.length > 0 ? (
        <>
          <FlatList
            data={results}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) =>
              `${item.id || item.product_id || index}`
            }
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: moderateScale(120),
            }}
            //  keyExtractor={(item, index) => index.toString()}
            onEndReached={() => loadMoreFunc && loadMoreFunc()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore && (
                <Text style={{ textAlign: 'center' }}>Loading...</Text>
              )
            }
          />
        </>
      ) : (
        <>
          <KeyboardAvoidingView
            style={{ flex: 1, marginVertical: verticalScale(15) }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <Text style={styles.groupText}>Groups= {cartList?.length}</Text>
                <Text style={styles.groupText}>
                  {' '}
                  Cluster= {getTotalCluster()}
                </Text>
                <Text style={styles.groupText}> Items= {getItemCount()}</Text>
              </View>
            </View>
            <ScrollView
              style={{ flex: 1, marginBottom: moderateScale(20) }}
              contentContainerStyle={{ paddingBottom: moderateScale(200) }}
              showsVerticalScrollIndicator={false}
            >
              <FlatList
                data={cartList}
                keyExtractor={(item, index) => String(item.cart_id ?? index)}
                renderItem={({ item }) => (
                  <RenderItem item={item} navigation={navigation} />
                )}
              />

              {miscList?.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: moderateScale(10),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalLabel}>TITLE</Text>

                    <View
                      style={[
                        styles.cashInputRow,
                        {
                          height: windowHeight >= 900 ? verticalScale(35) : 45,
                          paddingHorizontal: 10,
                        },
                      ]}
                    >
                      <TextInput
                        style={styles.cashInput1}
                        placeholder="Enter title"
                        placeholderTextColor={'#000'}
                        value={item.description}
                        onChangeText={text =>
                          handleChange(item.id, 'description', text)
                        }
                      />
                      {/* </View> */}
                    </View>
                  </View>
                  <View>
                    <Text style={styles.cashLabel}>AMOUNT</Text>
                    <View style={[styles.cashBox]}>
                      <View style={[styles.cashInputRow]}>
                        <View
                          style={{
                            width: verticalScale(45),
                            height: verticalScale(40),
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.sidePanel,
                              {
                                borderLeftWidth: 1,
                                borderLeftColor: '#ddd',
                                backgroundColor: Color.RED,
                                borderTopLeftRadius: 5,
                                borderBottomLeftRadius: 5,
                              },
                            ]}
                            onPress={() => toggleSign(item.id)}
                          >
                            <View
                              style={[
                                styles.qtyBtnCircle,
                                { backgroundColor: Color.WHITE },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.qtyBtnText,
                                  { color: Color.RED },
                                ]}
                              >
                                {item.isNegative ? '-' : '-'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                        <View
                          style={{
                            width: verticalScale(80),
                            height: windowHeight >= 1100 ? 45 : 45,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderRightWidth: 1,
                            borderRightColor: '#ddd',
                            // paddingHorizontal: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <Text style={styles.cashSymbol}>£</Text>
                          <Text style={styles.cashSymbol}>
                            {item.isNegative && (
                              <Text style={styles.cashSymbol}>-</Text>
                            )}
                          </Text>
                          <TextInput
                            style={[
                              styles.cashInput1,
                              { flex: 1, textAlign: 'left', left: -5 },
                            ]}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={'#000'}
                            value={item.price}
                            onChangeText={text =>
                              handleChange(item.id, 'price', text)
                            }
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      marginTop: moderateScale(20),
                      zIndex: 10,
                    }}
                    onPress={() => handleDeleteMisc(item.id)}
                  >
                    <Ionicons name="trash-outline" size={25} color="#4472c4" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.miscBtn} onPress={handleAddMisc}>
                <Text style={styles.miscText}>Add Miscellaneous Charges</Text>
              </TouchableOpacity>
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
                    selectedTab === 'Collect From Store' && styles.selectedTab,
                  ]}
                  onPress={() => {
                    setSelectedTab('Collect From Store'), setDeliveryType(null);
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
                          <Text style={styles.findBtnText}>Find Address</Text>
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
                              Delivery Option
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

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
                                  Local Date {deliveryType?.name}:
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
                                {deliveryType?.price}
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
                                {deliveryType?.date}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>
                              £{getTotal(totalPrice, deliveryType?.price)}
                            </Text>
                          </View>

                          <Text style={styles.sectionTitle}>
                            Customer Information
                          </Text>
                        </>
                      )}
                      <View style={{ marginTop: 10, }}>
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
                              setPhoneError('Please enter your phone number');
                            } else if (cleaned.length > 16) {
                              setPhoneError('Maximum 16 digits allowed');
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
                              fontSize: 16,
                              lineHeight: 24,
                            }}
                          >
                            Total:
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
                    </>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={{ top: verticalScale(10) }}>
              <CartComponent />
            </View>

            {selectedTab == 'Get Delivery' && deliveryType != null && (
              <View style={styles.bottomBtn}>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    onCreateDeliverOrder();
                  }}
                  style={{
                    width: '30%',

                    height: moderateScale(40),
                    backgroundColor: '#4472c4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'flex-end',
                    borderRadius: 4,
                  }}
                >
                  <Text style={styles.bottomBtnText}>Create Order</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedTab !== 'Get Delivery' && deliveryType == null && (
              <View
                style={[
                  styles.bottomBtn,
                  {
                    paddingHorizontal: moderateScale(10),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();

                    onCreateOrder1(0);
                  }}
                  style={{
                    width: '30%',

                    height: moderateScale(40),
                    backgroundColor: '#4472c4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'flex-end',
                    borderRadius: 4,
                  }}
                >
                  <Text style={styles.bottomBtnText}>Create Order</Text>
                </TouchableOpacity>
              </View>
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
    // paddingHorizontal: moderateScale(5),
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashSymbol: { fontSize: 16, marginRight: 5 },
  cashInput1: { fontSize: 16, width: moderateScale(130) },
  bottomBtn: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(5),
    alignItems: 'center',
    borderTopWidth: 1,
    //  top:verticalScale(35),
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
    fontFamily: FONT.SEMIBOLD,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(10),
    top: -10,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default React.memo(AddCartScreen);
