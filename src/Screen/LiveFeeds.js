/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../Component/Image';
import CartComponent from '../Component/CartComponent';
import SearchComponent from './Component/SearchComponent';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { ImageBaseUrl } from '../utility/api';
import decodeHtml from '../utility/decodeHtml';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import Ionicons from '@react-native-vector-icons/ionicons';
import Loader from '../Component/Loader';
import { fetchLiveFeed } from '../Redux/Slice/LiveFeedSlice';

const getLatestTimestamp = item => {
  const carts =
    item.carts ||
    item.products ||
    item.items ||
    item.cart_items ||
    item.cart ||
    [];
  if (carts.length === 0) return null;

  let latestDate = null;
  carts.forEach(cart => {
    if (cart.created_at) {
      const date = new Date(cart.created_at);
      if (!isNaN(date.getTime())) {
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
      }
    }
  });
  return latestDate;
};

const formatTimeAgo = timestamp => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const LiveFeeds = ({ navigation }) => {
  const dispatch = useDispatch();

  const [searchNoResults, setSearchNoResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const searchRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const selectedUser = 'all';
  // const [showUserDropdown, setShowUserDropdown] = useState(false);

  const {
    feedData,
    loading,
    grandTotal,
    totalQty: reduxTotalQty,
    onlineUsers: reduxOnlineUsers,
  } = useSelector(state => state.liveFeed);

  const onlineUsers = reduxOnlineUsers || feedData.length;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;
    if (onlineUsers > 0) {
      pulseAnim.setValue(0);
      animation = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else {
      pulseAnim.setValue(0);
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [onlineUsers, pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  /* const users = [
    { id: 'all', name: 'All', email: 'All' },
    ...Array.from(
      new Map(
        feedData.map(item => [
          item.customer_id || item.user_id || item.id,
          {
            id: item.customer_id || item.user_id || item.id,
            name:
              item.customer_name || item.user_name || item.name || 'Unknown',
            email:
              item.customer_name ||
              item.customer_email ||
              item.email ||
              item.user_email ||
              'Unknown',
          },
        ]),
      ).values(),
    ),
  ]; */

  const fetchFeedData = useCallback(async () => {
    try {
      await dispatch(fetchLiveFeed()).unwrap();
    } catch (error) {
      console.log('Error fetching live feed data:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeedData();
    setRefreshing(false);
  }, [fetchFeedData]);

  const filteredData =
    selectedUser === 'all'
      ? feedData
      : feedData.filter(
          item =>
            (item.customer_id || item.user_id || item.id) === selectedUser,
        );

  const totalQty =
    reduxTotalQty ||
    feedData.reduce((sum, item) => sum + (item.total_qty || 0), 0);
  const totalAmount =
    grandTotal ||
    feedData.reduce(
      (sum, item) => sum + (item.total_amount || item.grand_total || 0),
      0,
    );

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
  };

  const renderSearchItem = ({ item }) => {
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

  const renderUserCard = useCallback(({ item }) => {
    console.log('dfdsfsdfdsfdsf', item);
    const latestTime = getLatestTimestamp(item);
    const timeAgoText = item.time_ago || formatTimeAgo(latestTime);

    const cartsList =
      item.carts ||
      item.products ||
      item.items ||
      item.cart_items ||
      item.cart ||
      [];
    const miscList = item?.miscellaneous || item?.misc_items || [];
    const totalGroups = cartsList.length + miscList.length;
    const delivery = item?.deliveries || [];

    const tableRows = [];

    cartsList.forEach(product => {
      tableRows.push({
        type: 'product',
        key: `product_${product.cart_id || product.id}`,
        data: product,
      });
    });

    if (item.delivery_cost > 0) {
      tableRows.push({
        type: 'delivery',
        key: 'delivery_cost',
        title: 'Delivery Cost',
        amount: Number(item.delivery_cost || 0),
      });
    }

    miscList.forEach((misc, index) => {
      tableRows.push({
        type: 'misc',
        key: `misc_${misc.misc_id || misc.id || index}`,
        title: misc.misc_name || misc.title || 'Misc',
        amount: Number(misc.misc_value || misc.amount || 0),
      });
    });
    delivery.forEach((misc, index) => {
      tableRows.push({
        type: 'del',
        key: `misc_${misc.misc_id || misc.id || index}`,
        title: misc.misc_name || misc.title || 'Misc',
        amount: Number(misc.misc_value || misc.amount || misc.value || 0),
      });
    });
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>
            {item.customer_name || item.user_name || item.name || 'Unknown'}
          </Text>
          {timeAgoText ? (
            <Text style={styles.cardHeaderTime}>{timeAgoText}</Text>
          ) : null}
        </View>

        <View style={styles.productTableHeader}>
          <View
            style={[
              styles.productHeaderCell,
              styles.productCol,
              styles.headerBorderRight,
            ]}
          >
            <Text style={styles.productHeaderText}>Product</Text>
          </View>
          <View
            style={[
              styles.productHeaderCell,
              styles.qtyCol,
              styles.headerBorderRight,
              styles.centerAlign,
            ]}
          >
            <Text style={styles.productHeaderText}>Qty.</Text>
          </View>
          <View
            style={[
              styles.productHeaderCell,
              styles.amountCol,
              styles.rightAlign,
            ]}
          >
            <Text style={styles.productHeaderText}>Amount</Text>
          </View>
        </View>

        {tableRows.map((row, index) => {
          const rowBg = index % 2 === 0 ? '#fff' : '#f9f9f9';

          if (row.type === 'product') {
            const product = row.data;
            const qty = Number(product.quantity || product.qty || 0);
            const price = Number(product.price || 0);
            const amount =
              Number(product.line_total || product.amount || price * qty) || 0;
            const isRefund =
              product.is_refund === 1 ||
              product.is_refund === '1' ||
              product.refund ||
              amount < 0;
            const displayAmount = isRefund && amount > 0 ? -amount : amount;

            return (
              <View
                key={row.key}
                style={[styles.productRow, { backgroundColor: rowBg }]}
              >
                <View style={[styles.productCol, styles.cellBorderRight]}>
                  <Text style={styles.productName}>
                    {product.name || product.title || 'Unknown Product'}
                  </Text>
                  {product.subtitle ? (
                    <Text style={styles.productSubtitle}>
                      {product.subtitle}
                    </Text>
                  ) : Array.isArray(product.option) ? (
                    product.option.map((opt, i) => (
                      <Text key={i} style={styles.productSubtitle}>
                        {opt.name}: {opt.value}
                      </Text>
                    ))
                  ) : null}
                </View>
                <View
                  style={[
                    styles.qtyCol,
                    styles.cellBorderRight,
                    styles.centerAlign,
                  ]}
                >
                  <Text style={styles.qtyText}>{qty > 0 ? qty : ''}</Text>
                </View>
                <View style={[styles.amountCol, styles.rightAlign]}>
                  <Text
                    style={[styles.amountText, isRefund && styles.refundAmount]}
                  >
                    £{displayAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          } else {
            return (
              <View
                key={row.key}
                style={[styles.productRow, { backgroundColor: rowBg }]}
              >
                <View style={[styles.productCol, styles.cellBorderRight]}>
                  <Text style={styles.deliveryText}>{row.title}</Text>
                </View>
                <View
                  style={[
                    styles.qtyCol,
                    styles.cellBorderRight,
                    styles.centerAlign,
                  ]}
                />
                <View style={[styles.amountCol, styles.rightAlign]}>
                  <Text style={styles.amountText}>
                    £{row.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          }
        })}

        <View style={styles.cardFooter}>
          <View style={[styles.productCol, styles.cellBorderRight]}>
            <Text style={styles.footerBold}>{totalGroups} Groups</Text>
          </View>
          <View
            style={[styles.qtyCol, styles.cellBorderRight, styles.centerAlign]}
          >
            <Text style={styles.footerBold}>{item.total_qty || 0}</Text>
          </View>
          <View style={[styles.amountCol, styles.rightAlign]}>
            <Text style={styles.footerBold}>
              £{(item.total_amount || item.grand_total || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
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
        <FlatList
          data={results}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) =>
            `${item.id || item.product_id || index}`
          }
          renderItem={renderSearchItem}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: moderateScale(120),
          }}
          onEndReached={() => loadMoreFunc && loadMoreFunc()}
          onEndReachedThreshold={0.5}
        />
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
          <View style={styles.feedHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={moderateScale(20)}
                color="#fff"
              />
            </TouchableOpacity>
            <View style={styles.feedHeaderContent}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: moderateScale(6),
                }}
              >
                <Text style={[styles.feedTitle, { marginBottom: 0 }]}>
                  Live Basket Feed
                </Text>
                {onlineUsers > 0 && (
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: moderateScale(8),
                      width: moderateScale(14),
                      height: moderateScale(14),
                    }}
                  >
                    <Animated.View
                      style={{
                        position: 'absolute',
                        width: moderateScale(14),
                        height: moderateScale(14),
                        borderRadius: moderateScale(7),
                        backgroundColor: '#4cd964',
                        opacity: pulseOpacity,
                        transform: [{ scale: pulseScale }],
                      }}
                    />
                    <View
                      style={{
                        width: moderateScale(6),
                        height: moderateScale(6),
                        borderRadius: moderateScale(3),
                        backgroundColor: '#4cd964',
                      }}
                    />
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Qty</Text>
                  <Text style={styles.statValue}>{totalQty}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Online</Text>
                  <Text style={styles.statValue}>{onlineUsers} EPOS Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>
                    £{totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Users:</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowUserDropdown(!showUserDropdown)}
            >
              <Text style={styles.filterDropdownText}>
                {selectedUser === 'all'
                  ? 'All'
                  : users.find(u => u.id === selectedUser)?.name || 'All'}
              </Text>
              <Ionicons
                name={showUserDropdown ? 'chevron-up' : 'chevron-down'}
                size={moderateScale(16)}
                color={Color.BLACK2}
              />
            </TouchableOpacity>
          </View> */}

          {/* Dropdown Menu */}
          {/* {showUserDropdown && (
            <View style={styles.dropdownMenu}>
              {users.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedUser(user.id);
                    setShowUserDropdown(false);
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedUser === user.id && styles.checkboxActive,
                    ]}
                  >
                    {selectedUser === user.id && (
                      <Ionicons
                        name="checkmark"
                        size={moderateScale(12)}
                        color="#fff"
                      />
                    )}
                  </View>
                  <Text style={styles.dropdownItemText}>
                    {user.id === 'all' ? 'All' : user.name || user.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )} */}

          {loading ? (
            <Loader visible={true} />
          ) : (
            <FlatList
              data={filteredData}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) =>
                `${item.customer_id || item.user_id || item.id || index}`
              }
              renderItem={renderUserCard}
              contentContainerStyle={styles.feedListContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyFeed}>
                  <Text style={styles.emptyFeedText}>
                    No live baskets found
                  </Text>
                </View>
              }
            />
          )}

          <CartComponent />
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

  feedHeader: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  feedHeaderContent: {
    flex: 1,
  },
  feedTitle: {
    fontSize: moderateScale(18),
    fontFamily: FONT.BOLD,
    color: '#fff',
    marginBottom: moderateScale(6),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {},
  statLabel: {
    fontSize: moderateScale(10),
    fontFamily: FONT.REGULAR,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    fontSize: moderateScale(13),
    fontFamily: FONT.BOLD,
    color: '#fff',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  filterLabel: {
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    marginRight: moderateScale(8),
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    backgroundColor: '#fafafa',
  },
  filterDropdownText: {
    fontSize: moderateScale(13),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
  },
  dropdownMenu: {
    marginHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(4),
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  checkbox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(3),
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginRight: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Color.RED,
    borderColor: Color.RED,
  },
  dropdownItemText: {
    fontSize: moderateScale(12),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
  },

  feedListContent: {
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(120),
  },
  cardContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 0,
    marginBottom: moderateScale(14),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardHeader: {
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  cardHeaderText: {
    fontSize: moderateScale(13),
    fontFamily: FONT.BOLD,
    color: '#fff',
  },
  cardHeaderTime: {
    fontSize: moderateScale(11),
    fontFamily: FONT.REGULAR,
    color: 'rgba(255,255,255,0.7)',
  },

  productTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#800000',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  productHeaderCell: {
    paddingVertical: moderateScale(8),
    justifyContent: 'center',
  },
  productHeaderText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.BOLD,
    color: '#fff',
  },
  headerBorderRight: {
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  productCol: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  qtyCol: {
    width: moderateScale(50),
    paddingVertical: moderateScale(8),
  },
  amountCol: {
    width: moderateScale(85),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  centerAlign: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAlign: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  productRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  productName: {
    fontSize: moderateScale(11),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK,
  },
  productSubtitle: {
    fontSize: moderateScale(10),
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    marginTop: moderateScale(2),
  },
  qtyText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK,
  },
  amountText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK,
  },
  deliveryText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK,
  },
  refundAmount: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
  },

  cardFooter: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
  },
  footerText: {
    fontSize: moderateScale(12),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
  },
  footerBold: {
    fontSize: moderateScale(11),
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
  },

  emptyFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyFeedText: {
    fontSize: moderateScale(16),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
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

export default LiveFeeds;
