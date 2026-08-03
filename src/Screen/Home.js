/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-catch-shadow */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  LayoutAnimation,
  RefreshControl,
  Dimensions,
  BackHandler,
  Modal,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import { fetchProducts } from '../Redux/Slice/ProductMenuSlice';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../Component/Loader';

import CartComponent from '../Component/CartComponent';
import { Color, FONT, ImageData } from '../Component/Image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { ImageBaseUrl } from '../utility/api';
import decodeHtml from '../utility/decodeHtml';

import FastImage from 'react-native-fast-image';
import SearchComponent from './Component/SearchComponent';
import CategoryComponent from './Component/CategoryComponent';
import { fetchCategories } from '../Redux/Slice/CategoriesSlice';
import { MMKVStorage } from '../utility/MmkvStore';
import { fetchCartData } from '../Redux/Slice/CartDataShowSlice';
import RNExitApp from 'react-native-exit-app';

const screenW = Dimensions.get('window').width;
const COLUMNS = 6;
const PADDING_HORIZONTAL = 5;
const MARGIN_HORIZONTAL = 1;
const itemWidth =
  (screenW - PADDING_HORIZONTAL * 2 - MARGIN_HORIZONTAL * 2 * COLUMNS) /
  COLUMNS;

const itemKeyExtractor = (item, index) =>
  `${item.id || item.product_id || index}`;

const ProductRowItem = React.memo(
  ({ item, onPress, imageUrl, hasError, onError }) => {
    return (
      <TouchableOpacity style={styles.itemRow} onPress={() => onPress(item)}>
        <FastImage
          style={styles.itemImage}
          source={
            imageUrl && !hasError
              ? {
                  uri: imageUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }
              : ImageData.NOIMAGE
          }
          resizeMode={FastImage.resizeMode.cover}
          onError={() => onError(item.id)}
        />

        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName} numberOfLines={2}>
            {decodeHtml(item.name || item.descriptions?.name)}
          </Text>
          <Text style={styles.itemPrice}>
            £ {Number(item.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector(
    state => state.product,
    shallowEqual,
  );
  const { categories } = useSelector(state => state.category, shallowEqual);

  const [refreshing, setRefreshing] = useState(false);

  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [expanded, setExpanded] = useState(0);
  const [category, setCategory] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const searchRef = useRef(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);

  // Fetch products and categories once on mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          setShowExitModal(true);
          return true;
        },
      );
      return () => backHandler.remove();
    }, []),
  );

  // Fetch cart data on screen focus
  useFocusEffect(
    useCallback(() => {
      if (userData?.customer_id) {
        dispatch(fetchCartData(userData.customer_id));
      }
    }, [dispatch, userData]),
  );

  const toggleExpand = useCallback(id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => (prev === id ? null : id));
  }, []);

  const handleItemPress = useCallback(
    item => {
      dispatch(clearProducts());

      navigation.navigate('DisplayItems', { itemData: item });
      setTimeout(() => {
        searchRef.current?.clearSearch();
      }, 200);
    },
    [dispatch, navigation],
  );

  const handleImageError = useCallback(id => {
    setImageErrorMap(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      const imageUrl = item?.image ? ImageBaseUrl + item.image : null;
      const hasError = imageErrorMap[item.id];

      return (
        <ProductRowItem
          item={item}
          onPress={handleItemPress}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={handleImageError}
        />
      );
    },
    [imageErrorMap, handleItemPress, handleImageError],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await dispatch(fetchProducts()).unwrap();

      dispatch(fetchCartData(userData.customer_id));
    } catch (err) {}

    setRefreshing(false);
  }, [dispatch, userData]);
  const handleBarcodeScan = useCallback(_isProcessing => {}, []);
  return (
    <SafeAreaView style={styles.container}>
      <SearchComponent
        ref={searchRef}
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus
        onBarcodeScan={handleBarcodeScan}
        onNoResults={setSearchNoResults}
      />

      {results?.length > 0 ? (
        <>
          <FlatList
            data={results}
            showsVerticalScrollIndicator={false}
            keyExtractor={itemKeyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContainer}
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Color.RED]} // Android
              tintColor={Color.RED} // iOS
            />
          }
        >
          {products?.map((cat, index) => (
            <View key={cat?.id || index} style={styles.card}>
              <TouchableOpacity
                activeOpacity={1}
                style={[
                  styles.header,
                  expanded === (cat.id || index) && styles.headerActive,
                ]}
                onPress={() => toggleExpand(cat?.id || index)}
              >
                <Text
                  style={[
                    styles.title,
                    expanded === (cat.id || index) && styles.titleActive,
                  ]}
                >
                  {cat?.main_heading}
                </Text>
                <View>
                  <Ionicons
                    name={
                      expanded === (cat?.id || index)
                        ? 'chevron-down'
                        : 'chevron-up'
                    }
                    size={moderateScale(16)}
                    style={{ top: 5 }}
                    color={expanded === (cat.id || index) ? '#fff' : '#000'}
                  />
                  <Ionicons
                    name={
                      expanded === (cat.id || index)
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={moderateScale(16)}
                    color={expanded === (cat.id || index) ? '#fff' : '#000'}
                    style={{ top: -4 }}
                  />
                </View>
              </TouchableOpacity>

              {expanded === (cat.id || index) &&
                cat?.product_data?.length > 0 && (
                  <View style={styles.expandedItemsContainer}>
                    {cat?.product_data?.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.itemBox,
                          {
                            backgroundColor: cat?.color,
                          },
                        ]}
                        onPress={() => handleItemPress(item)}
                      >
                        <Text style={styles.itemText}>
                          {item.epos_tile_title
                            ? decodeHtml(item.epos_tile_title)
                            : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
            </View>
          ))}

          {categories?.length > 0 && (
            <>
              <View style={styles.categoriesHeaderContainer}>
                <Text style={styles.categoriesHeaderText}>Categories</Text>
                <TouchableOpacity onPress={() => setCategory(!category)}>
                  <Ionicons
                    name={category ? 'close' : 'menu'}
                    size={25}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {category && (
                <CategoryComponent
                  categoryData={categories}
                  navigation={navigation}
                />
              )}
            </>
          )}
        </ScrollView>
      )}
      <CartComponent />

      {loading && products?.length === 0 && <Loader visible />}

      {/* Exit App Modal */}
      <Modal
        transparent
        visible={showExitModal}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Icon Header */}
            <View style={styles.modalIconWrap}>
              <Ionicons name="power" size={moderateScale(36)} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>Exit App</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to exit the application?
            </Text>

            <View style={styles.modalDivider} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnStay}
                activeOpacity={0.8}
                onPress={() => setShowExitModal(false)}
              >
                <Ionicons
                  name="arrow-back"
                  size={moderateScale(16)}
                  color={Color.RED}
                />
                <Text style={styles.modalBtnStayText}>Stay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnExit}
                activeOpacity={0.8}
                onPress={() => {
                  setShowExitModal(false);
                  setTimeout(() => RNExitApp.exitApp(), 400);
                }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={moderateScale(16)}
                  color="#fff"
                />
                <Text style={styles.modalBtnExitText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    marginVertical: 0, // add this
    paddingVertical: 0, // ensure no extra padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '15@s',
    alignItems: 'center',
  },
  headerActive: {
    backgroundColor: Color.RED,
  },
  title: {
    fontSize: '14@ms',
    color: '#333',
    flex: 1,
    fontFamily: FONT.SEMIBOLD,
  },
  titleActive: {
    color: '#fff',
  },

  flatListContainer: {
    paddingHorizontal: 12,
    paddingBottom: moderateScale(120),
  },
  scrollViewContainer: {
    paddingBottom: moderateScale(90),
  },
  expandedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: moderateScale(5),
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: moderateScale(10),
  },
  categoriesHeaderContainer: {
    width: '100%',
    height: verticalScale(35),
    backgroundColor: 'black',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: verticalScale(10),
  },
  categoriesHeaderText: {
    fontSize: verticalScale(18),
    color: 'white',
    fontFamily: FONT.BOLD,
  },
  itemBox: {
    marginHorizontal: MARGIN_HORIZONTAL,
    marginVertical: MARGIN_HORIZONTAL,
    height: moderateScale(60),
    width: itemWidth,
    backgroundColor: '#f4c69f',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  itemText: {
    fontSize: '12@ms',
    color: '#121212',
    fontFamily: FONT.MEDIUM,
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
  itemTextContainer: {
    flex: 1,
    paddingRight: moderateScale(15),
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

  // Exit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(30),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    alignItems: 'center',
    paddingBottom: moderateScale(24),
    overflow: 'hidden',
    elevation: 10,
  },
  modalIconWrap: {
    width: '100%',
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(24),
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: '22@ms',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    marginBottom: moderateScale(8),
  },
  modalMessage: {
    fontSize: '14@ms',
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    textAlign: 'center',
    paddingHorizontal: moderateScale(16),
    lineHeight: 22,
  },
  modalDivider: {
    width: '85%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: moderateScale(20),
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    width: '100%',
  },
  modalBtnStay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    borderWidth: 1.5,
    borderColor: Color.RED,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  modalBtnStayText: {
    fontSize: '15@ms',
    fontFamily: FONT.SEMIBOLD,
    color: Color.RED,
  },
  modalBtnExit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    backgroundColor: Color.RED,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  modalBtnExitText: {
    fontSize: '15@ms',
    fontFamily: FONT.SEMIBOLD,
    color: '#fff',
  },
});

export default React.memo(Home);
