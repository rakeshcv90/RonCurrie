import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../Redux/Slice/ProductMenuSlice';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { usePermissions } from '../Component/usePermissions';
import CartComponent from '../Component/CartComponent';
import { Color, FONT, ImageData } from '../Component/Image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { ImageBaseUrl } from '../utility/api';

import FastImage from 'react-native-fast-image';
import SearchComponent from './Component/SearchComponent';
import CategoryComponent from './Component/CategoryComponent';
import { fetchCategories } from '../Redux/Slice/CategoriesSlice';
import { MMKVStorage } from '../utility/MmkvStore';
import { fetchCartData } from '../Redux/Slice/CartDataShowSlice';

const screenW = Dimensions.get('window').width;
const COLUMNS = 6;
const totalHorizontalMargin = moderateScale(7) * COLUMNS;
const itemWidth = (screenW - totalHorizontalMargin) / COLUMNS;

const decodeHtml = text => {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '')
    .replace(/&apos;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/["']/g, '')
    .replace(/[^a-zA-Z0-9\s.,-]/g, '')
    .trim();
};

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(state => state.product);
  const { categories } = useSelector(state => state.category);

  const [refreshing, setRefreshing] = useState(false);
  const { hasPermission } = usePermissions();
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [expanded, setExpanded] = useState(0);
  const [category, setCategory] = useState(false);
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          await dispatch(fetchProducts()).unwrap(); // unwrap gives real error
          await dispatch(fetchCategories()).unwrap(); // unwrap gives real error
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
    }, [dispatch]),
  );

  // const toggleExpand = id => {
  //   LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  //   setExpanded(expanded === id ? null : id);
  // };
  const toggleExpand = useCallback(id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => (prev === id ? null : id));
  }, []);

  // const handleItemPress = item => {
  //   dispatch(clearProducts());
  //   navigation.navigate('DisplayItems', { itemData: item });
  // };

  const handleItemPress = useCallback(
    item => {
      dispatch(clearProducts());
      navigation.navigate('DisplayItems', { itemData: item });
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
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => handleItemPress(item)}
        >
          <FastImage
            style={styles.itemImage}
            source={
              imageUrl && !hasError ? { uri: imageUrl } : ImageData.NOIMAGE
            }
            resizeMode={FastImage.resizeMode.cover}
            onError={() => handleImageError(item.id)}
          />

          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>
              {decodeHtml(item.name || item.descriptions?.name)}
            </Text>
            <Text style={styles.itemPrice}>
              £ {Number(item.price).toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [imageErrorMap, handleItemPress, handleImageError],
  );

  // const renderItem = ({ item }) => {
  //   const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

  //   // const handleError = () => {
  //   //   setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
  //   // };

  //   const hasError = imageErrorMap[item.id] || false;

  //   return (
  //     <TouchableOpacity
  //       style={styles.itemRow}
  //       onPress={() => handleItemPress(item)}
  //     >
  //       {imageUrl && !hasError ? (
  //         <FastImage
  //           style={styles.itemImage}
  //           source={{
  //             uri: imageUrl,
  //             priority: FastImage.priority.high,
  //             cache: FastImage.cacheControl.immutable,
  //           }}
  //           resizeMode={FastImage.resizeMode.cover}
  //           onError={() => handleImageError(item.id)}
  //         />
  //       ) : (
  //         <FastImage
  //           style={styles.itemImage}
  //           source={ImageData?.NOIMAGE}
  //           resizeMode={FastImage.resizeMode.cover}
  //           onError={() => handleImageError(item.id)}
  //         />
  //       )}

  //       <View style={styles.itemTextContainer}>
  //         <Text style={styles.itemName}>
  //           {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
  //         </Text>
  //         <Text style={styles.itemPrice}>
  //           £ {Number(item.price).toFixed(2)}
  //         </Text>
  //       </View>
  //     </TouchableOpacity>
  //   );
  // };
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      // Re-fetch your products or any data
      await dispatch(fetchProducts()).unwrap();

      dispatch(fetchCartData(userData.customer_id));
    } catch (error) {
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }

    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <SearchComponent
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
      /> */}

      <SearchComponent
        onResults={useCallback(setResults, [])}
        onLoadMoreRef={useCallback(setLoadMoreFunc, [])}
        navigation={navigation}
        autoFocus
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
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: moderateScale(90) }}
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
          {products?.map((category, index) => (
            <View key={category?.id || index} style={styles.card}>
              <TouchableOpacity
                activeOpacity={1}
                style={[
                  styles.header,
                  expanded === (category.id || index) && styles.headerActive,
                ]}
                onPress={() => toggleExpand(category?.id || index)}
              >
                <Text
                  style={[
                    styles.title,
                    expanded === (category.id || index) && styles.titleActive,
                  ]}
                >
                  {category?.main_heading}
                </Text>
                <View>
                  <Ionicons
                    name={
                      expanded === (category?.id || index)
                        ? 'chevron-down'
                        : 'chevron-up'
                    }
                    size={moderateScale(16)}
                    style={{ top: 5 }}
                    color={
                      expanded === (category.id || index) ? '#fff' : '#000'
                    }
                  />
                  <Ionicons
                    name={
                      expanded === (category.id || index)
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={moderateScale(16)}
                    color={
                      expanded === (category.id || index) ? '#fff' : '#000'
                    }
                    style={{ top: -4 }}
                  />
                </View>
              </TouchableOpacity>

              {expanded === (category.id || index) &&
                category?.product_data?.length > 0 && (
                  <FlatList
                    data={category?.product_data}
                    numColumns={COLUMNS}
                    // key={COLUMNS}
                    keyExtractor={(item, idx) => idx.toString()}
                    // scrollEnabled={true}
                    scrollEnabled={expanded === (category.id || index)}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    removeClippedSubviews
                    windowSize={5}
                    initialNumToRender={18}
                    maxToRenderPerBatch={18}
                    style={{ maxHeight: moderateScale(350) }}
                    contentContainerStyle={{ paddingBottom: moderateScale(10) }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.itemBox,
                          {
                            width: itemWidth,
                            backgroundColor: category?.color,
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
                    )}
                  />
                )}
            </View>
          ))}

          {categories?.length > 0 && (
            <>
              <View
                style={{
                  width: '100%',
                  height: verticalScale(35),
                  backgroundColor: 'black',
                  marginTop: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: verticalScale(10),
                }}
              >
                <Text
                  style={{
                    fontSize: verticalScale(18),
                    color: 'white',

                    fontFamily: FONT.BOLD,
                  }}
                >
                  Categories
                </Text>
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
  
      {/* {products?.length <= 0 && <Loader visible={loading} />} */}
      {loading && products?.length === 0 && <Loader visible />}
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

  itemBox: {
    marginHorizontal: moderateScale(3),
    marginVertical: moderateScale(3),
    marginLeft: 4,
    height: moderateScale(45),
    backgroundColor: '#f4c69f',
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingRight: moderateScale(5),
  },
});

export default React.memo(Home);
