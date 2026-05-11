// WebViewScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StatusBar,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import SearchComponent from '../Component/SearchComponent';
import { ImageBaseUrl } from '../../utility/api';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../../Component/Image';
import CartComponent from '../../Component/CartComponent';
import decodeHtml from '../../utility/decodeHtml';
import { clearProducts } from '../../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';

const WebScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const data = route?.params?.url;
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const searchRef = useRef(null);
  const webViewRef = useRef(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
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
  const injectedJS = `
(function() {
  // Remove logo images
  const logos = document.querySelectorAll("img[alt*='Ron'], img[src*='logo'], img[style*='1954']");
  logos.forEach(el => el.remove());

  // Remove home icons
  const homeIcons = document.querySelectorAll(
    "img[alt*='Home'], img[src*='home'], i[class*='home'], svg[class*='home'], a[href*='home']"
  );
  homeIcons.forEach(el => el.remove());

  // Remove search bar / search form
  const searchElements = document.querySelectorAll("input[type='search'], form[action*='search'], div[class*='search']");
  searchElements.forEach(el => el.remove());

  // Remove menu navigation
  const menuElements = document.querySelectorAll("nav, ul[class*='menu'], div[class*='menu'], header");
  menuElements.forEach(el => el.remove());

  // Remove product cards / grid items
  const cards = document.querySelectorAll("div[class*='card'], div[class*='product'], div[class*='grid']");
  cards.forEach(el => el.remove());

  // Handle custom button click (optional)
  const btn2 = Array.from(document.querySelectorAll("button, a")).find(el =>
    el.innerText.includes("Product Page")
  );
  if (btn2) {
    btn2.addEventListener("click", function(e) {
      e.preventDefault();
      window.ReactNativeWebView.postMessage("GO_BACK_PRODUCT_PAGE");
    });
  }
})();
true;
`;

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

              alignItems: 'center',
              gap: moderateScale(10),
              padding: verticalScale(10),
              marginBottom: verticalScale(20),
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
            ></Text>
          </View>
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 10 }}>Loading...</Text>
            </View>
          )}
          {data && (
            <WebView
              ref={webViewRef}
              source={{ uri: data }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
              cacheEnabled={true}
              injectedJavaScript={injectedJS}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => {
                setLoading(false);

                webViewRef.current?.injectJavaScript(injectedJS);
              }}
              style={{ flex: 1 }}
            />
          )}
        </>
      )}
      <CartComponent />
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
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', // optional
    zIndex: 999,
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
export default WebScreen;
