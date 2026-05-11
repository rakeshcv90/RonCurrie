import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
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
import { useWindowDimensions, Linking } from 'react-native';
import { decode } from 'html-entities';
import WebScreen from './WebScreen';
import decodeHtml from '../../utility/decodeHtml';

const CategoryPage = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const catData = route?.params.listDAta;

  const { width } = useWindowDimensions();
  const [loader, setLoader] = useState(false);
  const [listproduct, setListProduct] = useState([]);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [searchNoResults, setSearchNoResults] = useState(false);
  const searchRef = useRef(null);
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
  const decodedHtml = decode(catData?.data?.description?.description || '');

  const rewriteLinksForInApp = html => {
    if (!html) return '';
    return html.replace(
      /href="([^"]+)"/g,
      (match, url) => `href="inapp://${encodeURIComponent(url)}"`,
    );
  };

  const safeHtml = rewriteLinksForInApp(decodedHtml);
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
        <ScrollView
          style={{ flex: 1, padding: verticalScale(10) }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(100) }}
        >
          <View
            style={{
              flexDirection: 'row',

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
              {decodeHtml(catData?.data?.description?.name)}
            </Text>
          </View>

          <RenderHTML
            contentWidth={width}
            source={{ html: safeHtml }}
            tagsStyles={{
              p: {
                marginBottom: 10,
                fontSize: 14,
                fontWeight: '500',
                lineHeight: 20,
                color: '#333',
              },
              b: { fontWeight: '700', lineHeight: 20 },
              a: { color: 'red', textDecorationLine: 'underline' },
            }}
            renderers={{
              img: ({ tnode }) => {
                // 🔍 find parent <a> href
                const parentAnchor = tnode.parent?.attributes?.href;

                return (
                  <Pressable
                    onPress={() => {
                      if (!parentAnchor) return;

                      if (parentAnchor.startsWith('inapp://')) {
                        const realUrl = decodeURIComponent(
                          parentAnchor.replace('inapp://', ''),
                        );

                        navigation.navigate('WebScreen', {
                          url: realUrl,
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: tnode.attributes.src }}
                      style={{
                        width: width - 40,
                        height: 180,
                        borderRadius: moderateScale(6),
                        marginVertical: verticalScale(8),
                        alignSelf: 'center',
                      }}
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              },
            }}
            onLinkPress={(event, href) => {
              if (!href) return false;

              if (href.startsWith('inapp://')) {
                const realUrl = decodeURIComponent(
                  href.replace('inapp://', ''),
                );

                navigation.navigate('WebScreen', {
                  url: realUrl,
                });
              }

              return false; // 🚫 stop default behavior
            }}
          />
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

export default CategoryPage;
