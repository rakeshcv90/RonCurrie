import {
  View,
  Text,
  StatusBar,
  TextInput,
  Animated,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Keyboard,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { usePermissions } from '../Component/usePermissions';
import {
  Camera,
  getCameraDevice,
  useCameraDevices,
  useCodeScanner,
} from 'react-native-vision-camera';
import { MMKVStorage } from '../utility/MmkvStore';
import { createProduct } from '../Redux/Slice/BarCodeDataSlice';
import { useDispatch } from 'react-redux';
import { postData } from '../utility/ApiCall';
import { Api, ImageBaseUrl } from '../utility/api';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { CommonActions } from '@react-navigation/native';
import {
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import CartComponent from '../Component/CartComponent';
import SearchComponent from './Component/SearchComponent';
import FastImage from 'react-native-fast-image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import decodeHtml from '../utility/decodeHtml';

const BarCodeReader = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Sales');
  const [barcode, setBarcode] = useState(null);
  const [lastScanned, setLastScanned] = useState(null); // track last scanned code
  const [scanningEnabled, setScanningEnabled] = useState(true); // control scanner
  const [userData, setUserData] = useState(null);
  const { hasPermission } = usePermissions();
  const [message, setMessage] = useState(null);
  const dispatch = useDispatch();
  const camera = useRef(null);
  const devices = Camera.getAvailableCameraDevices();
  const searchRef = useRef(null);
  const [currentCamera, setCurrentCamera] = useState('back');
  const [cameraReady, setCameraReady] = useState(false);
  const device = getCameraDevice(devices, currentCamera);
  const typingTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);
  const inputLayoutRef = useRef(null);

  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [allowKeyboard, setAllowKeyboard] = useState(false);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };
    typingTimeoutRef.current?.focus();

    fetchUserData();
  }, []);

  // Scroll to input when keyboard opens & track visibility
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      // Scroll so the input label is near the top of the visible area
      if (inputLayoutRef.current != null && scrollViewRef.current) {
        const scrollTarget = Math.max(0, inputLayoutRef.current - 10);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollTarget,
            animated: true,
          });
        }, 100);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      // Scroll back to top when keyboard closes
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onCameraReady = () => {
    setCameraReady(true);
  };

  const codeScanner = useCodeScanner({
    // codeTypes: ['qr', 'ean-13'],
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39'],
    onCodeScanned: codes => {
      if (!scanningEnabled) return;

      const firstCode = codes[0]?.value;
      if (!firstCode) return;

      if (firstCode === lastScanned) {
        return;
      }

      setBarcode(firstCode);
      setLastScanned(firstCode);
      setScanningEnabled(false);

      handleSubmitBarcode(firstCode);
    },
  });
  const handleSubmitBarcode = async barcodeValue => {
    if (!barcodeValue) return;
    const payloadData = {
      customer_id: userData?.customer_id,
      bar_code: barcodeValue,
      order_mode: selectedTab == 'Sales' ? 'add' : 'refund',
    };

    try {
      const response = await postData(Api.BAR_CODE_SCANNER, payloadData);
      console.log('dsfvdsfsdfsdfsdfdsf', response);
      if (response?.data?.message !== 'Product not found!!') {
        setMessage({ type: 'success' });

        setTimeout(() => {
          setMessage(null);
          setBarcode(null);
          setLastScanned(null);
          setScanningEnabled(true);
          dispatch(triggerCartRefresh());
          dispatch(triggerMiscRefresh());
          typingTimeoutRef.current?.focus();
        }, 3000);
      } else {
        setMessage({ type: 'error' });
        typingTimeoutRef.current?.focus();
      }
      setTimeout(() => {
        setMessage(null);
        setBarcode(null);
        setLastScanned(null);
        setScanningEnabled(true);
      }, 2000);
      typingTimeoutRef.current?.focus();
    } catch (error) {
      setBarcode(null);
      setLastScanned(null);
      setScanningEnabled(true);
      typingTimeoutRef.current?.focus();
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };
  const handleManualInput = text => {
    setBarcode(text);
  };

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
  };
  const renderItem1 = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleItemPress(item)}
      >
        {imageUrl && !hasError ? (
          <FastImage
            style={styles.itemImage}
            source={{
              uri: imageUrl,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        ) : (
          <FastImage
            style={styles.itemImage}
            source={ImageData?.NOIMAGE}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        )}

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
      {results?.length > 0 ? (
        <>
          <FlatList
            data={results}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) =>
              `${item.id || item.product_id || index}`
            }
            renderItem={renderItem1}
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
      ) : searchNoResults ? (
        <View style={styles.emptyContainer}>
          <FastImage
            source={ImageData.NORESULT}
            style={styles.gif}
            resizeMode={FastImage.resizeMode.contain}
          />
          <Text style={styles.noResultText}>
            No result Found for "{searchNoResults}"
          </Text>
          <Text style={styles.noResultSubText}>
            Try adjusting your search term and search again
          </Text>
        </View>
      ) : (
        <>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                    selectedTab === 'Sales' && styles.selectedTab,
                  ]}
                  onPress={() => setSelectedTab('Sales')}
                >
                  <Text style={styles.textStyle}>SM</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    selectedTab === 'Refund' && styles.selectedTab,
                  ]}
                  onPress={() => setSelectedTab('Refund')}
                >
                  <Text style={styles.textStyle}>RS</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              scrollEnabled={hasPermission}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.cameraContainer}>
                {!hasPermission ? (
                  <Text style={{ color: 'red', textAlign: 'center' }}>
                    Camera permission is required
                  </Text>
                ) : device ? (
                  <Camera
                    ref={camera}
                    style={{ flex: 1 }}
                    device={device}
                    isActive={true}
                    // photo={true}
                    photo={false}
                    video={false}
                    enableZoomGesture
                    codeScanner={codeScanner}
                    onInitialized={onCameraReady}
                    focusable={true}
                    preset="high"
                  />
                ) : (
                  <Text>Loading camera...</Text>
                )}
              </View>

              <View
                style={styles.inputSection}
                onLayout={e => {
                  inputLayoutRef.current = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.label}>ENTER BARCODE MANUALLY</Text>

                <TextInput
                  ref={typingTimeoutRef}
                  style={styles.input}
                  placeholder="Enter barcode"
                  value={barcode}
                  editable={true}
                  keyboardType="numeric"
                  onChangeText={handleManualInput}
                  showSoftInputOnFocus={allowKeyboard}
                  returnKeyType="search"
                  onSubmitEditing={() => handleSubmitBarcode(barcode)}
                  onTouchStart={() => {
                    setAllowKeyboard(true); // enable keyboard when user taps
                  }}
                />
              </View>

              {message?.type == 'error' && (
                <View style={styles.messageContainer}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: moderateScale(10),
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={IconData.Error}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text style={styles.errorText}>Item not found!</Text>
                  </View>
                  <Text style={styles.errorText2}>
                    Barcode scanned is not of a listed product, please try again
                    with a different barcode.
                  </Text>
                </View>
              )}
              {message?.type == 'success' && (
                <View style={styles.messageContainer1}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: moderateScale(10),
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialDesignIcons
                      name="cart"
                      color={Color.GREEN}
                      size={24}
                    />
                    <Text style={styles.succText}>Item added to cart!</Text>
                  </View>
                  <Text style={styles.succText2}>
                    Item associated with the scanned barcode has been added to
                    the cart successfully!
                  </Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
          {!isKeyboardVisible && <CartComponent />}
        </>
      )}
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
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchInput: {
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logo: {
    width: '90%',
    height: moderateScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
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

  // Tabs
  tab: {
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabButton: {
    paddingHorizontal: moderateScale(15), // capsule hugs text
    height: '80%',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: Color.RED, // red capsule
  },
  textStyle: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },

  cameraContainer: {
    width: '94%',
    aspectRatio: 1.5,
    alignSelf: 'center',
    marginTop: 20,

    overflow: 'hidden',
  },
  inputSection: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
    marginBottom: verticalScale(20),
  },
  input: {
    height: moderateScale(45),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: moderateScale(14),
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
  },
  messageContainer: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: moderateScale(4),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FFBBBB',
    backgroundColor: '#FFDADA',
  },
  errorText: {
    fontSize: moderateScale(16),
    fontFamily: FONT.SEMIBOLD,
    lineHeight: moderateScale(24),
    color: '#940000',
  },
  errorText2: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    lineHeight: moderateScale(20),
    color: '#4F4F4F',
    marginTop: 10,
  },
  messageContainer1: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: moderateScale(4),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0FFBB',
    backgroundColor: '#F0FFE8',
  },
  succText: {
    fontSize: moderateScale(16),
    fontFamily: FONT.SEMIBOLD,
    lineHeight: moderateScale(24),
    color: Color.GREEN,
  },
  succText2: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    lineHeight: moderateScale(20),
    color: '#4F4F4F',
    marginTop: 10,
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
  itemTextContainer: {
    flex: 1,
    paddingRight: moderateScale(5),
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

export default BarCodeReader;
