import { View, Text, StatusBar, Image, ActivityIndicator, FlatList } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { WebView } from 'react-native-webview';
import * as Keychain from 'react-native-keychain';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import { clearProducts, fetchProductsList } from '../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';
import SearchComponent from './Component/SearchComponent';

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

  const injectedJS = `
  (function() {
    const logo = document.querySelector("img[alt*='Ron'], img[src*='logo'], img[style*='1954']");
    if (logo) logo.remove();

    
       const homeIcon = document.querySelector("img[alt*='Home'], img[src*='home'], i[class*='home'], svg[class*='home'], a[href*='home']");
    if (homeIcon) homeIcon.remove();
     
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
          <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
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
        <>
      
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 10 }}>Loading...</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ uri: 'https://roncurry.co.uk/epos/index.php' }}
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
                form.action = 'https://roncurry.co.uk/epos/index.php';

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
              if (event.nativeEvent.data === 'GO_BACK_PRODUCT_PAGE') {
             
                navigation1.goBack();
              } else {
                
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
});
