/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import React, { useRef, useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';

import { WebView } from 'react-native-webview';

import { useNavigation } from '@react-navigation/native';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';
import SearchComponent from './Component/SearchComponent';
import decodeHtml from '../utility/decodeHtml';

const WebViewScreen = ({ navigation, route }) => {
  const navigation1 = useNavigation();
  const urlData = route?.params?.payload;
  const webViewRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const dispatch = useDispatch();
  const searchRef = useRef(null);
  const [searchNoResults, setSearchNoResults] = useState(false);

  const injectedJS = `
(function() {
  if (window.__RN_HANDLERS_INSTALLED__) return;
  window.__RN_HANDLERS_INSTALLED__ = true;

  // Delegated, capture-phase listener: attaches immediately on inject,
  // so it always wins the race against the anchor's real href navigation
  // (no more waiting on a poller before the R icon becomes clickable).
  document.addEventListener("click", function(e) {
    const clickable = e.target.closest("a, button, img");
    if (!clickable) return;

    // Check if the clicked element is an image, or contains an image
    const img = clickable.tagName && clickable.tagName.toLowerCase() === "img" ? clickable : clickable.querySelector("img");
    
    if (img) {
      const src = (img.getAttribute("src") || "").toLowerCase();
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      // Match ricon, logo, r.png, or r icon
      if (src.includes("ricon") || src.includes("logo") || src.includes("r.png") || src.includes("r_icon") || src.includes("r icon") || alt === "logo" || alt === "home") {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage("GO_TO_APP_HOME");
        return;
      }
    }

    const anchor = e.target.closest("a, button");
    if (anchor) {
      const hrefAbsolute = anchor.href || ""; // This gets the resolved absolute URL
      const hrefLower = hrefAbsolute.toLowerCase();
      
      // If the link goes to the storefront homepage, we intercept it
      if (
        anchor.classList.contains("navbar-brand") || 
        hrefLower === "https://roncurrie.co.uk/" || 
        hrefLower === "https://roncurrie.co.uk" || 
        hrefLower === "http://roncurrie.co.uk/" || 
        hrefLower === "https://www.roncurrie.co.uk/" || 
        hrefLower === "https://www.roncurrie.co.uk" ||
        hrefLower.includes("route=common/home")
      ) {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage("GO_TO_APP_HOME");
        return;
      }

      // PRODUCT PAGE BUTTON -> return to the product page inside the app
      const text = anchor.innerText || "";
      if (text.includes("Product Page") || text.includes("Back To Product Page")) {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage("GO_BACK_PRODUCT_PAGE");
        return;
      }
    }
  }, true);

  function hideHomeIcon() {
    const homeIcon = document.querySelector("img[alt*='Home'], img[src*='home'], i[class*='home'], svg[class*='home'], a[href*='home']");
    if (homeIcon) {
      homeIcon.style.display = "none";
    }
  }

  hideHomeIcon();
  setInterval(hideHomeIcon, 1000);

})();
true;
`;

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
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 10 }}>Loading...</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ uri: 'https://roncurrie.co.uk/epos/index.php' }}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            cacheEnabled={true}
            injectedJavaScript={injectedJS}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              setLoading(false);

              // Re-inject JS to attach listener again in case page re-renders
              webViewRef.current?.injectJavaScript(injectedJS);

              if (urlData && !submitted) {
                const postForm = `
              (function() {
                if (window.__RN_POST_SUBMITTED__) return;
                window.__RN_POST_SUBMITTED__ = true;

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://roncurrie.co.uk/epos/index.php';

                const fields = ${JSON.stringify(urlData)};
                for (const key in fields) {
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = key;
                  input.value = fields[key];
                  form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
              })();
              true;
              `;

                webViewRef.current?.injectJavaScript(postForm);
                setSubmitted(true);
              }
            }}
            onMessage={event => {
              const message = event.nativeEvent.data;
              if (message === 'GO_TO_APP_HOME') {
                navigation1.navigate('Home');
              } else if (message === 'GO_BACK_PRODUCT_PAGE') {
                navigation1.goBack();
              }
            }}
            style={{ flex: 1 }}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default WebViewScreen;

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    marginTop: verticalScale(5),
  },
  leftContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: '70%',
    height: moderateScale(40),
  },
  header: {
    padding: moderateScale(5),
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
