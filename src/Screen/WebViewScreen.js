import { View, Text, StatusBar, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
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

const WebViewScreen = ({ navigation, route }) => {
  const urlData = route?.params?.urlData;

  const [token, setToken] = useState(null);


  useEffect(() => {
    const fetchToken = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          setToken(credentials.password); // This is your saved token
        }
      } catch (err) {
        console.log('Error fetching token', err);
      }
    };

    fetchToken();
  }, [route]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.headerContainer}>
        <View style={styles.header} activeOpacity={0.7}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name={'arrow-back'}
              size={moderateScale(20)}
              color={Color.GRAY}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.leftContainer}>
          <Image
            source={IconData.Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          marginBottom: verticalScale(20),
          marginTop: verticalScale(10),
        }}
      >
        <Text
          style={{
            fontSize: moderateScale(18),
            color: Color.BLACK,
            fontFamily: FONT.SEMIBOLD,
          }}
        >
          {urlData?.title}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          //   alignItems: 'center',
          //   marginBottom: verticalScale(20),
          //   marginTop: verticalScale(10),
        }}
      >
        {/* <WebView
          source={{ uri: urlData?.url }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
        /> */}

        {/* <WebView
          source={{
            uri: urlData?.url,
            headers: {
              Authorization: 'Bearer YOUR_TOKEN_HERE',
            },
          }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
        /> */}

        {token && urlData?.url && (
          <WebView
            source={{
              uri: urlData?.url,
            //   headers: {
            //     Authorization: `Bearer ${token}`,
            //   },
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            injectedJavaScript={`
          // Remove header
          const header = document.querySelector('header');
          if(header) header.style.display='none';

          // Remove menu
          const menu = document.querySelector('.menu'); // replace '.menu' with actual class/id
          if(menu) menu.style.display='none';

          // Remove footer (optional)
          const footer = document.querySelector('footer');
          if(footer) footer.style.display='none';
          true;
        `}
          />
        )}
      </View>
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
});
