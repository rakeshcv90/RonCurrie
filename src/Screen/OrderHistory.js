import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import React, { memo, useCallback, useRef, useState } from 'react';
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
import { CommonActions } from '@react-navigation/native';

import { postData } from '../utility/ApiCall';
import { Api, ImageBaseUrl } from '../utility/api';
import {
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import CartComponent from '../Component/CartComponent';
import decodeHtml from '../utility/decodeHtml';
const OrderHistory = ({ navigation }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 10;
  const { orderList, loading, hasMore } = useSelector(state => state.orderList);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [lastFetched, setLastFetched] = useState(null);
  const [loader, setLoader] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasInitialLoaded = useRef(false);
  const searchRef = useRef(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const loadData = async (pageNumber = 1, searchTerm = '') => {
    try {
      await dispatch(
        fetchOrderList({
          page: pageNumber,
          limit,
          search: searchTerm,
        }),
      ).unwrap();
      setLastFetched(Date.now());
    } catch (error) {
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };

  useFocusEffect(
    // useCallback(() => {
    //   const fiveMinutes = 5 * 60 * 1000;
    //   const shouldRefresh =
    //     !lastFetched || Date.now() - lastFetched > fiveMinutes;

    //   if (shouldRefresh) {
    //     setPage(1);
    //     loadData(1, search);
    //   }
    // }, [lastFetched]),

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
  const reOrder = async itemData => {
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

  const formatDate = useCallback(date => {
    if (!date) return '';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice();

    return `${day}/${month}/${year}`;
  }, []);
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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Order History</Text>
              <Text style={styles.subTitle}>
                View and track all your past orders here.
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={[styles.cell, styles.borderRight]}>
                    <Text style={styles.headerText}>ORDER ID</Text>
                  </View>
                  <View style={[styles.cell, styles.borderRight]}>
                    <Text style={styles.headerText}>CUSTOMER</Text>
                  </View>

                  <View style={styles.cell}>
                    <Text style={styles.headerText}>DATE</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.headerText}>Delivery Method</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.headerText}>RE-ORDER</Text>
                  </View>
                </View>

                <FlatList
                  data={orderList}
                  showsVerticalScrollIndicator={false}
                  // contentContainerStyle={{
                  //   paddingBottom: moderateScale(10),
                  // }}

                  contentContainerStyle={{
                    paddingBottom: moderateScale(
                      orderList?.length > 15 ? 120 : 180,
                    ),
                  }}
                  keyExtractor={(item, index) => `${item.id}_${index}`}
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        styles.tableRow,
                        index === orderList.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.cell, styles.orderIdColumn]}
                        onPress={() => {
                          navigation.navigate('OrderHistoryDetails', {
                            orderItem: item,
                          });
                        }}
                      >
                        <Text style={styles.orderId}># {item?.order_id}</Text>
                      </TouchableOpacity>
                      <View style={[styles.cell, styles.customerColumn]}>
                        <Text style={styles.customer}>{item.name}</Text>
                      </View>
                      <View style={[styles.cell, styles.dateColumn]}>
                        <Text style={styles.date}>
                          {formatDate(item.date_added)} {}
                        </Text>
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
                          reOrder(item);
                        }}
                      >
                        <Image
                          source={IconData.CART}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
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

          {orderList?.length <= 0 ||
            (loader && <Loader visible={loading || loader} />)}
          <CartComponent />
        </>
      )}
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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
    // flex: 1,
    marginHorizontal: moderateScale(10),
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
    paddingHorizontal: moderateScale(8),
  },
  borderRight: {
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  headerText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  orderId: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: 12,
  },
  customer: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: 11,
  },
  date: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: 11,
  },

  orderIdColumn: {
    width: '25%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  customerColumn: {
    width: '30%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  dateColumn: {
    width: '25%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  dateColumn1: {
    width: '32%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  reorderColumn: {
    width: '15%',
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
