import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Loader from '../Component/Loader';
import Ionicons from '@react-native-vector-icons/ionicons';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchOrderList } from '../Redux/Slice/OrderListSlice';
import { showToast } from '../utility/showToast';
import debounce from 'lodash.debounce';
import FastImage from 'react-native-fast-image';

import { postData, getData } from '../utility/ApiCall';
import { Api, ImageBaseUrl, BaseUrl } from '../utility/api';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as Keychain from 'react-native-keychain';
import {
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import CartComponent from '../Component/CartComponent';
import decodeHtml from '../utility/decodeHtml';
import ActionBottomSheet from '../Component/ActionBottomSheet';
const FLATLIST_STYLE = { flexGrow: 0 };
const FLATLIST_CONTENT_STYLE = { paddingBottom: 0 };

const ItemRow = React.memo(({ item, handleItemPress }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

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
          onError={() => setHasError(true)}
        />
      ) : (
        <FastImage
          style={styles.itemImage}
          source={ImageData?.NOIMAGE}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setHasError(true)}
        />
      )}

      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>
          {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
        </Text>
        <Text style={styles.itemPrice}>£ {Number(item.price).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const OrderHistory = ({ navigation }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 10;
  const { orderList, loading, hasMore } = useSelector(state => state.orderList);
  const [lastFetched, setLastFetched] = useState(null);
  const [loader, setLoader] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const hasInitialLoaded = useRef(false);
  const searchRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const loadData = async (pageNumber = 1, searchTerm = '') => {
    try {
      await dispatch(
        fetchOrderList({
          limit,
          search: searchTerm,
        }),
      ).unwrap();
      setLastFetched(Date.now());
    } catch (error) {
      // Errors are already handled by handleApiError (toasts/modals)
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fiveMinutes = 5 * 60 * 1000;
      const shouldRefresh =
        !lastFetched || Date.now() - lastFetched > fiveMinutes;

      if (!hasInitialLoaded.current || shouldRefresh) {
        hasInitialLoaded.current = true;
        setPage(1);
        loadData(1, search);
      }
    }, [lastFetched, search]),
  );
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, search);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData(1, search);

    setRefreshing(false);
  };

  const debouncedSearch = useCallback(
    debounce(text => {
      setPage(1);
      loadData(1, text);
    }, 1200),
    [],
  );
  const handleSearch = text => {
    setSearch(text);

    if (text.trim().length > 0) {
      debouncedSearch(text);
    } else {
      debouncedSearch.cancel();

      setPage(1);
      loadData(1, '');
    }
  };
  const reOrder = useCallback(
    async itemData => {
      setLoader(true);
      try {
        const order_id = itemData?.order_id;
        const responseData = await postData(Api.RE_ORDER_FULL_ORDER, {
          order_id,
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
        }
      } catch (error) {
        setLoader(false);
        // Errors are already handled by handleApiError (toasts/modals)
      }
    },
    [dispatch],
  );

  const handleItemPress = useCallback(item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      return <ItemRow item={item} handleItemPress={handleItemPress} />;
    },
    [handleItemPress],
  );

  const keyExtractor = useCallback(
    (item, index) => `${item.id || item.product_id || index}`,
    [],
  );

  const handleEndReached = useCallback(() => {
    if (loadMoreFunc) loadMoreFunc();
  }, [loadMoreFunc]);

  const formatDate = useCallback(date => {
    if (!date) return '';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice();

    return `${day}/${month}/${year}`;
  }, []);

  const downloadInvoice = useCallback(async item => {
    setLoader(true);
    try {
      const order_id = item?.order_id;
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
  }, []);

  const sendEmailInvoice = useCallback(async item => {
    setLoader(true);
    try {
      const order_id = item?.order_id;
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
      // Errors are already handled by handleApiError (toasts/modals)
    }
  }, []);
  const renderOrderRow = useCallback(
    ({ item, index }) => (
      <View
        style={[
          styles.tableRow,
          index === orderList.length - 1 && { borderBottomWidth: 0 },
        ]}
      >
        <TouchableOpacity
          style={[styles.cell, styles.orderIdColumn]}
          onPress={() =>
            navigation.navigate('OrderHistoryDetails', { orderItem: item })
          }
        >
          <Text style={styles.orderId}># {item?.order_id}</Text>
        </TouchableOpacity>
        <View style={[styles.cell, styles.customerColumn]}>
          <Text style={styles.customer}>{item.name}</Text>
        </View>
        <View style={[styles.cell, styles.dateColumn]}>
          <Text style={styles.date}>{formatDate(item.date_added)}</Text>
        </View>
        <View style={[styles.cell, styles.dateColumn1]}>
          <Text style={styles.customer}>
            {item?.shipping_method == 'Collection'
              ? item?.shipping_method
              : 'Shipping'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.cell, styles.reorderColumn]}
          onPress={() => {
            bottomSheetRef.current?.show({
              item,
              options: [
                {
                  label: 'Re-Order',
                  description: 'Add to cart again',
                  icon: IconData.CART,
                  gradientColors: ['#940000', '#c0392b'],
                  onPress: selectedItem => reOrder(selectedItem),
                },
                {
                  label: 'View Details',
                  description: 'See full order',
                  icon: IconData.Eye,
                  gradientColors: ['#8e44ad', '#9b59b6'],
                  onPress: selectedItem =>
                    navigation.navigate('OrderHistoryDetails', {
                      orderItem: selectedItem,
                    }),
                },
                {
                  label: 'Download',
                  description: 'Download invoice',
                  icon: IconData.REORDER,
                  gradientColors: ['#27ae60', '#2ecc71'],
                  onPress: selectedItem => {
                    downloadInvoice(selectedItem);
                  },
                },
                {
                  label: 'Email',
                  description: 'Send to email',
                  icon: IconData.Mail,
                  gradientColors: ['#2c3e50', '#3498db'],
                  onPress: selectedItem => {
                    sendEmailInvoice(selectedItem);
                  },
                },
              ],
            });
          }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={moderateScale(18)}
            color={Color.GRAY4}
          />
        </TouchableOpacity>
      </View>
    ),
    [
      orderList.length,
      formatDate,
      navigation,
      reOrder,
      downloadInvoice,
      sendEmailInvoice,
    ],
  );

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
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: moderateScale(120),
            }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
          />
        </>
      ) : searchNoResults ? (
        <View style={styles.emptyContainer1}>
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

            <View style={styles.tab}>
              <TextInput
                value={search}
                onChangeText={handleSearch}
                placeholder="Search Term"
                style={styles.searchInput}
              />
            </View>
          </View>

          {orderList?.length > 0 ? (
            <View style={styles.flexOne}>
              <Text style={styles.title}>Order History</Text>
              <Text style={styles.subTitle}>
                View and track all your past orders here.
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={[styles.cell, styles.orderIdColumn]}>
                    <Text style={styles.headerText}>ORDER ID</Text>
                  </View>
                  <View style={[styles.cell, styles.customerColumn]}>
                    <Text style={styles.headerText}>CUSTOMER</Text>
                  </View>
                  <View style={[styles.cell, styles.dateColumn]}>
                    <Text style={styles.headerText}>DATE</Text>
                  </View>
                  <View style={[styles.cell, styles.dateColumn1]}>
                    <Text style={styles.headerText}>DELIVERY</Text>
                  </View>
                  <View style={[styles.cell, styles.reorderColumn]}>
                    <Text style={styles.headerText}>ACTION</Text>
                  </View>
                </View>

                <FlatList
                  data={orderList}
                  showsVerticalScrollIndicator={false}
                  style={FLATLIST_STYLE}
                  contentContainerStyle={FLATLIST_CONTENT_STYLE}
                  keyExtractor={item => String(item.order_id)}
                  renderItem={renderOrderRow}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={loading && <Loader visible={true} />}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                />
              </View>
            </View>
          ) : (
            <>
              {loading ? (
                <Loader visible={loading} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No items available</Text>
                </View>
              )}
            </>
          )}

          {loader && <Loader visible={loader} />}
          <CartComponent />
          <ActionBottomSheet ref={bottomSheetRef} />
        </>
      )}
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexOne: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
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
  tab: {
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    width: '85%',
    borderColor: Color.GRAY2,
    paddingHorizontal: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    fontSize: moderateScale(14),
    flex: 1,
    paddingHorizontal: moderateScale(10),
  },
  title: {
    fontSize: moderateScale(20),
    fontFamily: FONT.BOLD,
    color: Color.RED,
    marginTop: moderateScale(10),
    marginLeft: moderateScale(10),
  },
  subTitle: {
    fontSize: moderateScale(14),
    color: Color.BLACK2,
    fontFamily: FONT.REGULAR,
    marginLeft: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  table: {
    flexShrink: 1,
    marginHorizontal: moderateScale(10),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#D1D1D1',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#D1D1D1',
    backgroundColor: '#fff',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(4),
  },
  borderRight: {
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  headerText: {
    fontSize: moderateScale(10),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  orderId: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: moderateScale(11),
  },
  customer: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(10),
  },
  date: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(10),
  },

  orderIdColumn: {
    width: '20%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  customerColumn: {
    width: '25%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  dateColumn: {
    width: '20%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  dateColumn1: {
    width: '25%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  reorderColumn: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.GRAY5,
    borderLeftWidth: 1,
    borderColor: '#F6F6F6',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 350,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    fontFamily: FONT.SEMIBOLD,
    textAlign: 'center',
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
  gif: {
    width: 200,
    height: 200,
  },
  emptyContainer1: {
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

export default OrderHistory;
