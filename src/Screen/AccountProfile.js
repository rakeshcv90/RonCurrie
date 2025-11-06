import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import LogoutModal from './Component/LogoutModal';
import { MMKVStorage } from '../utility/MmkvStore';
import * as Keychain from 'react-native-keychain';
import { CommonActions } from '@react-navigation/native';

const links = [
  {
    title: 'Bespoke Timber Window Options',
    url: 'https://roncurrie.co.uk/bespoke-window-options',
  },
  {
    title: 'Instructions for Accepting Deliveries',
    url: 'https://roncurrie.co.uk/instructions-for-accepting-deliveries',
  },
  {
    title: 'Treatment Guide',
    url: 'https://roncurrie.co.uk/treatment-instructions',
  },
  {
    title: 'Delivery Services',
    url: 'https://roncurrie.co.uk/delivery-options',
  },
  {
    title: 'Terms & Conditions',
    url: 'https://roncurrie.co.uk/terms-and-conditions',
  },
  {
    title: 'Contact Us',
    url: 'https://roncurrie.co.uk/index.php?route=information/contact',
  },
  {
    title: 'Site Map',
    url: 'https://roncurrie.co.uk/index.php?route=information/sitemap',
  },
  {
    title: 'Christmas Information',
    url: 'https://stagerc.co.uk/christmas-info',
  },
  {
    title: 'Fire Escape Windows',
    url: 'https://roncurrie.co.uk/index.php?route=information/information&information_id=67',
  },
  { title: 'Opening Times', url: 'https://roncurrie.co.uk/opening-times' },
  {
    title: 'Problems With Website',
    url: 'https://roncurrie.co.uk/training%20video%20cache',
  },
  { title: 'About Us', url: 'https://roncurrie.co.uk/about-us' },
  { title: 'Privacy Policy', url: 'https://roncurrie.co.uk/privacy-policy' },
  { title: 'Vacancies', url: 'https://roncurrie.co.uk/Vacancies' },
  {
    title: 'Returns',
    url: 'https://roncurrie.co.uk/index.php?route=account/return/add',
  },
];

const AccountProfile = ({ navigation }) => {
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View style={styles.headerContainer}>
      <TouchableOpacity
               style={styles.leftContainer}
               onPress={() => {
                 navigation.dispatch(
                   CommonActions.reset({
                     index: 0,
                     routes: [{ name: 'Home' }], // 👈 this becomes the new root
                   }),
                 );
               }}
             >
          <Image
            source={IconData.Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: moderateScale(30) }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, padding: moderateScale(10) }}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Image
              source={ImageData.Profile}
              style={{
                width: moderateScale(80),
                height: moderateScale(80),
              }}
              resizeMode="contain"
            />
            {/* <TouchableOpacity activeOpacity={0.7} style={styles.editIcon}>
              <MaterialDesignIcons
                name="pencil"
                color={Color.BLACK}
                size={20}
              />
            </TouchableOpacity> */}
          </View>

          <View>
            <Text style={styles.userName}>
              {userData?.firstname} {userData?.lastname}
            </Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            <Text style={styles.userPhone}>{userData?.telephone}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('ResetPassword');
            }}
          >
            <Text style={styles.btnText}>Reset Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.orderBtn}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('OrderHistory');
            }}
          >
            <Text style={styles.btnText}>Order History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickLinks}>
          <Text style={styles.quickTitle}>Quick Links</Text>
          <Text style={styles.quickDesc}>Lorem Ipsum jafoie.</Text>

          {links.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkItem}
              activeOpacity={0.7}
              onPress={() => {
                if (item?.url) {
                  navigation.navigate('WebViewScreen', { urlData: item });
                } else {
                  alert('URL not available for this link');
                }
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
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.7}
        onPress={() => setLogoutVisible(true)}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
    padding: moderateScale(10),
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
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: Color.GRAY6,

    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
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
});

export default AccountProfile;
