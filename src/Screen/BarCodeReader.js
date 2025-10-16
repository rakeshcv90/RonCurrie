import {
  View,
  Text,
  StatusBar,
  TextInput,
  Animated,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { usePermissions } from '../Component/usePermissions';
import {
  Camera,
  getCameraDevice,
  useCameraDevices,
  useCodeScanner,
} from 'react-native-vision-camera';
import { MMKVStorage } from '../utility/MmkvStore';
import { createProduct } from '../Redux/Slice/BarCodeDataSlice';
import { useDispatch } from 'react-redux';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const BarCodeReader = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Sales');
  const [barcode, setBarcode] = useState(null);
  const [lastScanned, setLastScanned] = useState(null); // track last scanned code
  const [scanningEnabled, setScanningEnabled] = useState(true); // control scanner
  const [userData, setUserData] = useState(null);
  const { hasPermission } = usePermissions();
  const [message, setMessage] = useState(null);

  const camera = useRef(null);
  const devices = Camera.getAvailableCameraDevices();

  const [currentCamera, setCurrentCamera] = useState('back');
  const [cameraReady, setCameraReady] = useState(false);
  const device = getCameraDevice(devices, currentCamera);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);

  const onCameraReady = () => {
    setCameraReady(true);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (!scanningEnabled) return;

      const firstCode = codes[0]?.value;
      if (!firstCode) return;

      if (firstCode === lastScanned) {
        return;
      }

      setBarcode(firstCode);
      setLastScanned(firstCode);
      setScanningEnabled(false);

    
      handleSubmitBarcode(firstCode);
    },
  });
  const handleSubmitBarcode = async barcodeValue => {
    if (!barcodeValue) return;
    const payloadData = {
      customer_id: userData?.customer_id,
      bar_code: barcode,
      order_mode: selectedTab == 'Sales' ? 'add' : 'refund',
    };

    try {
      const response = await postData(Api.BAR_CODE_SCANNER, payloadData);

      if (
        response?.data?.success == true &&
        response?.data?.data?.data?.length > 0
      ) {
        setMessage({ type: 'success' });
        setBarcode(null);
        setLastScanned(null);
        setScanningEnabled(true);
        setTimeout(() => {
          navigation.navigate('AddCartScreen');
        }, 2000);
      } else {
        setMessage({ type: 'error' });
        setBarcode(null);
        setLastScanned(null);
        setScanningEnabled(true);
      }
      setTimeout(() => {
        setMessage(null);
        navigation.navigate('AddCartScreen');
      }, 3000);
    } catch (error) {
      setBarcode(null);
      setLastScanned(null);
      setScanningEnabled(true);
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.headerContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={IconData.Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('SearchScreen');
              }}
              style={styles.iconButton}
            >
              <Image source={IconData.Search} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AccountProfile');
              }}
              style={{
                width: moderateScale(40),
                height: moderateScale(40),
                borderRadius: moderateScale(40),
                borderWidth: 1,
                borderColor: Color.GRAY5,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
      
              <Ionicons name={'menu'} size={moderateScale(25)} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name={'arrow-back'}
              size={moderateScale(20)}
              color={Color.GRAY}
            />
          </TouchableOpacity>

          <View style={styles.tab}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Sales' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Sales')}
            >
              <Text style={styles.textStyle}>Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Refund' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Refund')}
            >
              <Text style={styles.textStyle}>Refund</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cameraContainer}>
          {!hasPermission ? (
            <Text style={{ color: 'red', textAlign: 'center' }}>
              Camera permission is required
            </Text>
          ) : device ? (
            <Camera
              ref={camera}
          
              style={{ flex: 1 }}
              device={device}
              isActive={true}
              photo={true}
              codeScanner={codeScanner}
              onInitialized={onCameraReady}
            />
          ) : (
            <Text>Loading camera...</Text>
          )}
        </View>

        <ScrollView
          scrollEnabled={hasPermission} 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputSection}>
            <Text style={styles.label}>ENTER BARCODE MANUALLY</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter barcode"
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>

          {message?.type == 'error' && (
            <View style={styles.messageContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: moderateScale(10),
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={IconData.Error}
                  style={{ width: 24, height: 24 }}
                />
                <Text style={styles.errorText}>Item not found!</Text>
              </View>
              <Text style={styles.errorText2}>
                Barcode scanned is not of a listed product, please try again
                with a different barcode.
              </Text>
            </View>
          )}
          {message?.type == 'success' && (
            <View style={styles.messageContainer1}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: moderateScale(10),
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                <MaterialDesignIcons
                  name="cart"
                  color={Color.GREEN}
                  size={24}
                />
                <Text style={styles.succText}>Item added to cart!</Text>
              </View>
              <Text style={styles.succText2}>
                Item associated with the scanned barcode has been added to the
                cart successfully!
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchInput: {
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logo: {
    width: '90%',
    height: moderateScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
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

  // Tabs
  tab: {
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabButton: {
    paddingHorizontal: moderateScale(15), // capsule hugs text
    height: '80%',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: Color.RED, // red capsule
  },
  textStyle: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },

  cameraContainer: {
    width: '94%',
    aspectRatio: 1.5,
    alignSelf: 'center',
    marginTop: 20,

    overflow: 'hidden',
  },
  inputSection: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
    marginBottom: verticalScale(20),
  },
  input: {
    height: moderateScale(45),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: moderateScale(14),
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
  },
  messageContainer: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: moderateScale(4),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FFBBBB',
    backgroundColor: '#FFDADA',
  },
  errorText: {
    fontSize: moderateScale(16),
    fontFamily: FONT.SEMIBOLD,
    lineHeight: moderateScale(24),
    color: '#940000',
  },
  errorText2: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    lineHeight: moderateScale(20),
    color: '#4F4F4F',
    marginTop: 10,
  },
  messageContainer1: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: moderateScale(4),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0FFBB',
    backgroundColor: '#F0FFE8',
  },
  succText: {
    fontSize: moderateScale(16),
    fontFamily: FONT.SEMIBOLD,
    lineHeight: moderateScale(24),
    color: Color.GREEN,
  },
  succText2: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    lineHeight: moderateScale(20),
    color: '#4F4F4F',
    marginTop: 10,
  },
});

export default BarCodeReader;
