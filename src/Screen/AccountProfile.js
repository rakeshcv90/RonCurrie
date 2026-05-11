import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';

import LogoutModal from './Component/LogoutModal';
import { MMKVStorage } from '../utility/MmkvStore';
import * as Keychain from 'react-native-keychain';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import SearchComponent from './Component/SearchComponent';
import CartComponent from '../Component/CartComponent';
import decodeHtml from '../utility/decodeHtml';

const links = [
  {
    id: 1,
    title: 'Edit Account Information',
  },
  {
    id: 2,
    title: 'Change Password',
  },
  {
    id: 3,
    title: 'Order History',
  },
  {
    id: 4,
    title: 'Return Requests',
  },
  // {
  //   id: 5,
  //   title: 'Transactions',
  // },
];

const AccountProfile = ({ navigation, route }) => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const dispatch = useDispatch();
  const [userData, setUserData] = useState(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const searchRef = useRef(null);
  const firstInitial = userData?.firstname
    ? userData.firstname.charAt(0).toUpperCase()
    : '';
  const lastInitial = userData?.lastname
    ? userData.lastname.charAt(0).toUpperCase()
    : '';
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const data = await MMKVStorage.getItem('User_Data');
        setUserData(data);
      };

      fetchUserData();
      return () => {};
    }, []),
  );

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
    setTimeout(() => {
      searchRef.current?.clearSearch();
    }, 200);
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
  const renderItem = ({ item }) => {
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
          <ScrollView
            contentContainerStyle={{ paddingBottom: moderateScale(30) }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, paddingHorizontal: verticalScale(10) }}
          >
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstInitial}
                  {lastInitial}
                </Text>
              </View>

              <View>
                <Text style={styles.userName}>
                  {userData?.firstname} {userData?.lastname}
                </Text>
                <Text style={styles.userEmail}>{userData?.email}</Text>
                <Text style={styles.userPhone}>{userData?.telephone}</Text>
              </View>
            </View>

            <View style={styles.quickLinks}>
              <Text style={styles.quickTitle}>Quick Links</Text>
              <Text style={styles.quickDesc}>
                Use these quick options to manage your account easily.
              </Text>

              {links.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.linkItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item?.id == 1) {
                      navigation.navigate('EditInfotmation');
                    } else if (item?.id == 2) {
                      navigation.navigate('ResetPassword');
                    } else if (item?.id == 3) {
                      navigation.navigate('OrderHistory');
                    } else if (item?.id == 4) {
                      navigation.navigate('ProductReturns');
                    }
                    //  else if (item?.id == 5) {
                    //   alert('URL not available for this link');
                    // }
                  }}
                >
                  <Text style={styles.linkText}>{item?.title}</Text>
                  <Ionicons
                    name="link-outline"
                    size={moderateScale(18)}
                    color={Color.BLACK2}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View>
            <CartComponent />
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={() => setLogoutVisible(true)}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}

      <LogoutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={async () => {
          await MMKVStorage.clearAllData();
          await Keychain.resetGenericPassword();

          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          setLogoutVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    gap: 10,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: '70%',
    height: moderateScale(40),
  },
  header: {
    padding: moderateScale(10),
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
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: moderateScale(15),
    alignItems: 'center',
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),

    backgroundColor: Color.RED,

    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(5),
    // marginBottom: moderateScale(10),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    padding: moderateScale(4),
    borderWidth: 1,
    borderColor: Color.GRAY2,
  },
  userName: {
    fontSize: moderateScale(18),
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    marginTop: moderateScale(0),
  },
  userEmail: {
    fontSize: moderateScale(14),
    fontFamily: FONT.MEDIUM,
    color: Color.BLACK,
    marginTop: moderateScale(4),
  },
  userPhone: {
    fontSize: moderateScale(14),
    fontFamily: FONT.MEDIUM,
    color: Color.RED,
    marginTop: moderateScale(4),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginTop: moderateScale(15),
  },
  resetBtn: {
    flex: 1,
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(10),
    borderRadius: moderateScale(4),
    alignItems: 'center',
  },
  orderBtn: {
    flex: 1,
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(4),
    alignItems: 'center',
  },
  btnText: {
    color: Color.WHITE,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
  quickLinks: {
    marginTop: moderateScale(20),
  },
  quickTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT.BOLD,
    color: Color.RED,
  },
  quickDesc: {
    fontSize: moderateScale(14),
    color: Color.BLACK2,
    marginBottom: moderateScale(12),
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.GRAY3,
    padding: moderateScale(15),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    fontFamily: FONT.REGULAR,
    borderColor: Color.GRAY5,
    marginBottom: moderateScale(10),
  },
  linkText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(24),
    color: Color.BLACK2,
    fontFamily: FONT.REGULAR,
  },
  logoutBtn: {
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(12),
    marginHorizontal: moderateScale(20),
    borderRadius: moderateScale(4),
    alignItems: 'center',
    // marginTop: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  logoutText: {
    color: Color.WHITE,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
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

  avatarText: {
    color: '#fff',
    fontSize: moderateScale(30),
    fontWeight: 'bold',
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

export default AccountProfile;
