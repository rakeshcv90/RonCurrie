import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getData } from '../../utility/ApiCall';
import { Api, ImageBaseUrl } from '../../utility/api';
import { showToast } from '../../utility/showToast';
import Loader from '../../Component/Loader';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

import CartComponent from '../../Component/CartComponent';
import { clearProducts } from '../../Redux/Slice/ProductListSlice';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../../Component/Image';
import SearchComponent from '../Component/SearchComponent';
import RenderHTML from 'react-native-render-html';
import { decode } from 'html-entities';
import decodeHtml from '../../utility/decodeHtml';
const CategoryList = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const catData = route?.params.listDAta;

  const [loader, setLoader] = useState(false);
  const [listproduct, setListProduct] = useState([]);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});

  const getProductList = async dataItem => {
    setLoader(true);
    try {
      const res = await getData(
        `${Api.EPOS_PRODUCTLIST_PAGE}?name=${encodeURIComponent(
          dataItem?.slug,
        )}`,
      );

      if (res?.success == true && res?.responseCode == 200) {
        if (res?.data?.pageName == 'productList') {
          navigation.navigate('CategoryData', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'categoryList') {
          navigation.navigate('CategoryList', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'categoryPage') {
          navigation.navigate('CategoryPage', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'productPage') {
       
          // navigation.navigate('DisplayItems', { itemData: item });
        }
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
  //     .replace(/<[^>]*>/g, '') // remove HTML tags
  //     .replace(/\s+/g, ' ') // clean extra spaces

  //     .trim();
  // };
  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
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
        activeOpacity={0.8}
        onPress={() => {
          getProductList(item);
        }}
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
              resizeMode={FastImage.resizeMode.contain}
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
        <View style={{ width: '100%', backgroundColor: '#F5F5F5', padding: 2 }}>
          <Text
            style={styles.productName}
            numberOfLines={2} // 👈 breaks into next line
            ellipsizeMode="tail" // 👈 ...
          >
            {decodeHtml(item.name)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  const renderItem2 = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
           
              navigation.navigate('DisplayItems', { itemData: item });
          // getProductList(item);
        }}
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
              resizeMode={FastImage.resizeMode.contain}
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
        <View style={{ width: '100%', backgroundColor: '#F5F5F5', padding: 2 }}>
          <Text
            style={styles.productName}
            numberOfLines={2} // 👈 breaks into next line
            ellipsizeMode="tail" // 👈 ...
          >
            {decodeHtml(item.name)}
          </Text>
          <Text
            style={[
              styles.productName,
              { textAlign: 'center', color: Color.RED, fontFamily: FONT.BOLD },
            ]}
            numberOfLines={2} // 👈 breaks into next line
            ellipsizeMode="tail" // 👈 ...
          >
            {item?.has_option === 1 && 'From'} £ {Number(item.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const decodedHtml = decode(
    catData?.categoryDescription?.description?.description || '',
  );

  // Rewrite links
  const rewriteLinksForInApp = html => {
    if (!html) return '';
    return html.replace(
      /href="([^"]+)"/g,
      (match, url) => `href="inapp://${encodeURIComponent(url)}"`,
    );
  };

  // 🔥 REMOVE EMPTY TAGS COMPLETELY
  const cleanHtml = decodedHtml
    .replace(/<p>\s*(<br\s*\/?>|\s|&nbsp;)*\s*<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .trim();

  const safeHtml = rewriteLinksForInApp(cleanHtml);

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
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(30) }}
        >
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
              {decodeHtml(catData?.pageTitle)}
            </Text>
          </View>
          <View style={{ padding: verticalScale(10) }}>
            <RenderHTML
              contentWidth={width}
              source={{ html: safeHtml }}
              tagsStyles={{
                p: {
                  fontSize: 14,
                  lineHeight: 22,
                  color: '#333',
                },
                b: { fontWeight: '700' },
                a: { color: 'red', textDecorationLine: 'underline' },
              }}
              enableExperimentalMarginCollapsing={true}
            />
          </View>

          <View style={{ flex: 0.5 }}>
            <FlatList
              data={catData?.categoryList}
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
          </View>
          <View style={{ flex: 0.5 }}>
            <FlatList
              data={catData?.productList}
              keyExtractor={item => item.id.toString()}
              renderItem={renderItem2}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.row}
              contentContainerStyle={{
                paddingHorizontal: moderateScale(12),
                paddingBottom: moderateScale(20),
              }}
            />
          </View>
        </ScrollView>
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
    marginBottom: moderateScale(12),
  },

  card: {
    width: '31%',
    marginRight: moderateScale(10),
    // marginHorizontal: moderateScale(6),
  },

  imageWrapper: {
    width: '100%',
    height: moderateScale(120),
    borderRadius: moderateScale(6),
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
    fontFamily: FONT.BOLD,
    color: '#333',
    lineHeight: moderateScale(16),
  },

  productPrice: {
    marginTop: moderateScale(2),
    fontSize: moderateScale(12),
    color: '#666',
    fontFamily: FONT.MEDIUM,
  },
});
export default CategoryList;
