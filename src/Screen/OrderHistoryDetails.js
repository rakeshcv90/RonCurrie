/* eslint-disable no-catch-shadow */
/* eslint-disable no-shadow */
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import React, { memo, useCallback, useRef, useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { showToast } from '../utility/showToast';
import {
  clearProducts,
  fetchOrderDisplay,
} from '../Redux/Slice/OrderDisplaySlice';
import Loader from '../Component/Loader';
import { postData } from '../utility/ApiCall';
import { Api, BaseUrl, ImageBaseUrl } from '../utility/api';
import PrintModel from './Component/PrintModel';
import {
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import DownloadPdf from './DownloadPdf';
import ReturnModel from '../Component/ReturnModel';
import CartComponent from '../Component/CartComponent';
import SearchComponent from './Component/SearchComponent';
import FastImage from 'react-native-fast-image';
import decodeHtml from '../utility/decodeHtml';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as Keychain from 'react-native-keychain';
const OrderHistoryDetails = ({ navigation, route }) => {
  const order_id = route?.params?.orderItem;

  const searchRef = useRef(null);
  const [loader, setLoader] = useState(false);
  const [printVisible, setPrintVisible] = useState(false);
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [returnVisible, setReturnVisible] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const dispatch = useDispatch();
  const [searchNoResults, setSearchNoResults] = useState(false);
  const { orderDisplay, loading, error } = useSelector(
    state => state.displorder,
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        dispatch(clearProducts());
        try {
          await dispatch(fetchOrderDisplay(order_id?.order_id)).unwrap();
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
    }, [dispatch, order_id, navigation]),
  );
  const reOrderItem = async itemData => {
    setLoader(true);
    try {
      const order_product_id = itemData?.order_product_id;
      const order_id = orderDisplay?.order_id;

      const responseData = await postData(Api.RE_ORDER_PRODUCT, {
        order_id,
        order_product_id,
      });

      if (responseData?.data != undefined) {
        setLoader(false);
        if (responseData?.status == 200) {
          showToast('success', 'Success!', responseData?.data?.message);
          dispatch(triggerCartRefresh());
          dispatch(triggerMiscRefresh());
        } else {
          showToast('danger', 'Network Error', 'Something went wrong');
        }
      } else {
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Request Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
    }
  };

  const getPaymentAddressText = addressObj => {
    if (!addressObj || typeof addressObj !== 'object') {
      return '--------';
    }

    const {
      firstname,
      lastname,
      company,
      address_1,
      address_2,
      city,
      postcode,
      zone,
      country,
    } = addressObj;

    // Check if all values are empty
    const allEmpty = [
      firstname,
      lastname,
      company,
      address_1,
      address_2,
      city,
      postcode,
      zone,
      country,
    ].every(v => !v || v.trim() === '');

    if (allEmpty) return '--------';

    // Format actual address
    return `${firstname} ${lastname} ${company} ${address_1} ${address_2} ${city} ${postcode} ${zone} ${country}`;
  };

  const handleItemPress = useCallback(item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
  }, []);

  // const decodeHtml = text => {
  //   if (!text) return '';
  //   return text
  //     .replace(/&quot;/g, '')
  //     .replace(/&apos;/g, '')
  //     .replace(/&amp;/g, '&')
  //     .replace(/&lt;/g, '<')
  //     .replace(/&gt;/g, '>')
  //     .replace(/["']/g, '')
  //     .replace(/[^a-zA-Z0-9\s.,-]/g, '')
  //     .trim();
  // };
  const renderItem = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.itemRow1}
        onPress={() => handleItemPress(item)}
      >
        {imageUrl && !hasError ? (
          <FastImage
            style={styles.itemImage1}
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

        <View style={styles.itemTextContainer1}>
          <Text style={styles.itemName1} numberOfLines={2}>
            {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
          </Text>
          <Text style={styles.itemPrice1}>
            £ {Number(item.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const formatDateDDMMYYYY = dateString => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date)) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const downloadInvoice = async item => {
    setLoader(true);
    try {
      const order_id = item;
      const credentials = await Keychain.getGenericPassword();
      const token = credentials ? credentials.password : '';

      const { config, fs } = ReactNativeBlobUtil;
      const downloadDir =
        Platform.OS === 'ios' ? fs.dirs.DocumentDir : fs.dirs.DownloadDir;
      const fileName = `invoice-${order_id}.pdf`;
      const filePath = `${downloadDir}/${fileName}`;

      const options = {
        fileCache: true,
        path: filePath,
        addAndroidDownloads:
          Platform.OS === 'android'
            ? {
                useDownloadManager: true,
                notification: true,
                title: fileName,
                description: 'Downloading invoice...',
                mime: 'application/pdf',
                mediaScannable: true,
                path: filePath,
              }
            : undefined,
      };

      const res = await config(options).fetch(
        'GET',
        `${BaseUrl}epos/account/order/${order_id}/invoice/download`,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      setLoader(false);
      showToast('success', 'Success!', `Invoice downloaded successfully`);

      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(res.path());
      }
    } catch (error) {
      setLoader(false);
      showToast('danger', 'Error', 'Failed to download invoice');
      console.log('Download error', error);
    }
  };

  const sendEmailInvoice = async item => {
    setLoader(true);
    try {
      const order_id = item;
      const responseData = await postData(
        `epos/account/order/${order_id}/invoice/email`,
        {},
      );

      setLoader(false);

      if (
        responseData?.status === 200 ||
        responseData?.data?.status === 'success'
      ) {
        showToast(
          'success',
          'Success!',
          responseData?.data?.message ||
            'Invoice sent to your email successfully',
        );
      } else {
        showToast(
          'danger',
          'Error',
          responseData?.data?.message || 'Failed to send email',
        );
      }
    } catch (error) {
      setLoader(false);
      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Request Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                activeOpacity={0.7}
                onPress={() => setPrintVisible(true)}
              >
                <Ionicons
                  name="print-outline"
                  size={moderateScale(18)}
                  color={Color.WHITE}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#27ae60' }]}
                activeOpacity={0.7}
                onPress={() => {
                  downloadInvoice(order_id?.order_id);
                }}
              >
                <Ionicons
                  name="download-outline"
                  size={moderateScale(18)}
                  color={Color.WHITE}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#3498db' }]}
                activeOpacity={0.7}
                onPress={() => {
                  sendEmailInvoice(order_id?.order_id);
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={moderateScale(18)}
                  color={Color.WHITE}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: verticalScale(50) }}
          >
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>
                Order ID -{' '}
                <Text style={styles.orderIdRed}>#{order_id?.order_id}</Text>
              </Text>
              <Text style={styles.orderText}>
                Date: {formatDateDDMMYYYY(order_id?.date_added)}
              </Text>
              <Text style={styles.orderText}>
                Payment Method: {orderDisplay?.payment_method}
              </Text>
              <Text style={styles.orderText}>
                Delivery Method:{orderDisplay?.shipping_method}
              </Text>
              <Text style={styles.orderText}>
                Payment Address:{' '}
                {getPaymentAddressText(orderDisplay?.payment_address)}
              </Text>
              {orderDisplay?.shipping_method !== 'Collection' && (
                <Text style={styles.orderText}>
                  Est. Delivery Date: {orderDisplay?.delivery_date}
                </Text>
              )}
            </View>

            {orderDisplay?.products?.map((item, index) => {
              return (
                <View key={index} style={{ flex: 1 }}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableTitle}>QUANTITY</Text>
                    <Text style={styles.tableTitle}>PRICE</Text>
                    <Text style={styles.tableTitle}>TOTAL</Text>
                  </View>

                  <View>
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>
                          {decodeHtml(item?.name)}
                        </Text>
                        <Text style={styles.itemModel}>
                          Model:{' '}
                          <Text style={styles.modelRed}>{item?.model}</Text>
                        </Text>

                        {Array.isArray(item?.options) &&
                          item.options.length > 0 && (
                            <>
                              {item.options.map((opt, idx) => (
                                <View key={idx} style={styles.optionRow}>
                                  <Text style={styles.itemModel}>
                                    Name:{' '}
                                    <Text style={styles.modelRed}>
                                      {opt.name}
                                    </Text>
                                  </Text>
                                  <Text style={styles.itemModel}>
                                    Value:{' '}
                                    <Text style={styles.modelRed}>
                                      {opt.value}
                                    </Text>
                                  </Text>
                                </View>
                              ))}
                            </>
                          )}
                      </View>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                          reOrderItem(item);
                        }}
                      >
                        <Image
                          source={IconData.CART}
                          style={{ width: 15, height: 15 }}
                          resizeMode="contain"
                          tintColor={Color.WHITE}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                          setReturnVisible(true);
                        }}
                      >
                        <Image
                          source={IconData.REORDER}
                          style={{ width: 15, height: 15 }}
                          resizeMode="contain"
                          tintColor={Color.WHITE}
                        />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.tableHeader,
                        {
                          paddingVertical: moderateScale(5),
                          marginTop: moderateScale(2),
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.qtyBox,
                          { marginHorizontal: moderateScale(6) },
                        ]}
                      >
                        <Text style={styles.qtyText}>{item?.quantity}</Text>
                      </View>
                      <Text
                        style={[styles.itemPrice, { left: -moderateScale(20) }]}
                      >
                        x £{Number(item?.price).toFixed(2)}
                      </Text>
                      <Text
                        style={[styles.itemPrice, { left: -moderateScale(50) }]}
                      >
                        - £
                        {(Number(item?.price) * Number(item?.quantity)).toFixed(
                          2,
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {orderDisplay?.totals?.length > 0 && (
              <View style={styles.summaryBox}>
                {orderDisplay?.totals?.map((item, index) => (
                  <Text
                    key={index}
                    style={
                      item.title.toLowerCase().includes('total')
                        ? styles.summaryText
                        : styles.summaryText
                    }
                  >
                    {item.title}:{' '}
                    <Text
                      style={
                        item.title.toLowerCase().includes('total')
                          ? styles.summaryValue
                          : styles.summaryValue
                      }
                    >
                      {/* £{item?.value} */}£
                      {Number(item?.value || 0).toFixed(2)}
                    </Text>
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      <PrintModel
        visible={printVisible}
        onClose={() => setPrintVisible(false)}
        printData={order_id?.order_id}
      />
      {/* <DownloadPdf
        visible={downloadVisible}
        onClose={() => setDownloadVisible(false)}
        printData={order_id?.order_id}
      /> */}
      <ReturnModel
        visible={returnVisible}
        onClose={() => setReturnVisible(false)}
      />
      {<Loader visible={loading || loader} />}
      <CartComponent />
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
    justifyContent: 'space-between',
    padding: moderateScale(10),
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
  buttonRow: { flexDirection: 'row', gap: moderateScale(10) },
  actionIconBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: Color.RED,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  resetBtn: {
    paddingHorizontal: 15,
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(10),
    borderRadius: moderateScale(4),
  },
  orderBtn: {
    paddingHorizontal: 15,
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(4),
  },
  btnText: {
    color: Color.WHITE,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
  orderInfo: {
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(10),
  },
  orderId: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(4),
  },
  orderIdRed: { color: Color.RED },
  orderText: {
    fontFamily: FONT.REGULAR,
    fontSize: moderateScale(13),
    color: Color.GRAY,
    marginBottom: moderateScale(2),
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(15),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: moderateScale(5),
    borderColor: Color.GRAY2,
  },
  tableTitle: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderColor: Color.GRAY3,
  },
  itemTitle: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(13),
    marginBottom: moderateScale(2),
  },
  itemModel: { fontFamily: FONT.REGULAR, fontSize: moderateScale(12) },
  modelRed: { color: Color.RED },
  qtyBox: {
    borderWidth: 1,
    borderColor: Color.GRAY3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(12),
    color: Color.BLACK,
  },
  itemPrice: {
    fontSize: moderateScale(12),
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    marginHorizontal: moderateScale(5),
  },
  iconBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderWidth: 1,
    borderColor: Color.GRAY3,
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6d6d6d',
    marginLeft: moderateScale(6),
  },
  summaryBox: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: moderateScale(30),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  summaryText: {
    fontFamily: FONT.REGULAR,
    fontSize: moderateScale(13),
    color: Color.GRAY,
    marginBottom: moderateScale(5),
  },
  summaryValue: { fontFamily: FONT.SEMIBOLD, color: Color.BLACK },
  totalText: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(15),
    marginTop: moderateScale(10),
  },
  totalAmount: { color: Color.RED, fontFamily: FONT.SEMIBOLD },

  itemRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
    gap: moderateScale(5),
  },
  itemImage1: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  itemName1: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  itemPrice1: {
    fontSize: moderateScale(13),
    color: '#555',
  },
  itemTextContainer1: {
    flex: 1,
    paddingRight: moderateScale(15),
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

export default React.memo(OrderHistoryDetails);
