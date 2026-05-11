import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import CartComponent from '../Component/CartComponent';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../Component/Image';
import { Api, ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import SearchComponent from './Component/SearchComponent';
import { useDispatch } from 'react-redux';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { getData } from '../utility/ApiCall';
import Loader from '../Component/Loader';
import decodeHtml from '../utility/decodeHtml';

const SubProductList = ({ route }) => {
  const listData = route?.params?.itemData;
  const [productData, setProductData] = useState([]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [listproduct, setListProduct] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [loader, setLoader] = useState(false);
  const searchRef = useRef(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  useEffect(() => {
    getProductList(listData);
  }, [route?.params?.itemData]);
  const getProductList = async dataItem => {
    setLoader(true);
    try {
      const res = await getData(
        `${Api.EPOS_PRODUCTLIST_PAGE}?name=${encodeURIComponent(
          dataItem?.slug,
        )}`,
      );
      if (res?.success == true && res?.responseCode == 200) {
        setListProduct(res?.data?.categoryList);
      } else {
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
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
  const renderItem = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('SubProductList2', { listDAta: item })
        }
        activeOpacity={0.8}
      >
        <View style={styles.imageWrapper}>
          {imageUrl && !hasError ? (
            <FastImage
              style={styles.image}
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
        </View>

        <Text
          style={styles.productName}
          numberOfLines={2} // 👈 breaks into next line
          ellipsizeMode="tail" // 👈 ...
        >
          {decodeHtml(item.name)}
        </Text>
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
          <View
            style={{
              flexDirection: 'row',
              padding: moderateScale(10),
              alignItems: 'center',
              gap: moderateScale(10),
            }}
          >
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons
                name="home"
                size={moderateScale(20)}
                color={Color.GRAY}
              />
            </TouchableOpacity>

            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={Color.GRAY}
            />
            <Text
              style={{
                fontSize: verticalScale(16),
                color: Color.GRAY,
                fontFamily: FONT.SEMIBOLD,
              }}
            >
              {decodeHtml(listData?.name)}
            </Text>
          </View>

          <FlatList
            data={listproduct}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{
              paddingHorizontal: moderateScale(12),
              paddingBottom: moderateScale(20),
            }}
          />
        </>
      )}
      <CartComponent />
      <Loader visible={loader} />
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

  row: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(12),
  },

  card: {
    width: '32%', // slightly larger than 31
    marginBottom: moderateScale(12),
    marginRight: moderateScale(6),
  },

  imageWrapper: {
    width: '100%',
    height: moderateScale(150),
    borderRadius: moderateScale(6),
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  productName: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: '#333',
    lineHeight: moderateScale(16),
  },

  productPrice: {
    marginTop: moderateScale(2),
    fontSize: moderateScale(12),
    color: '#666',
    fontFamily: FONT.MEDIUM,
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
export default SubProductList;
