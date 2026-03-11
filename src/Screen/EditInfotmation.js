import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CommonActions } from '@react-navigation/native';
import { MMKVStorage } from '../utility/MmkvStore';
import Loader from '../Component/Loader';
import { postData } from '../utility/ApiCall';
import { Api, ImageBaseUrl } from '../utility/api';
import { showToast } from '../utility/showToast';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';
import FastImage from 'react-native-fast-image';
import CartComponent from '../Component/CartComponent';
import decodeHtml from '../utility/decodeHtml';
const EditInfotmation = ({ navigation }) => {
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('Singh');
  const [email, setEmail] = useState();
  const [phone, setPhone] = useState();
  const [loader, setLoader] = useState(false);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [defaultValues, setDefaultValues] = useState({
    firstname: '',
    lastname: '',
    telephone: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setDefaultValues({
        firstname: data?.firstname,
        lastname: data?.lastname,
        // email: data?.email,
        telephone: data?.telephone,
      });

      setFirstName(data?.firstname);
      setLastName(data?.lastname);
      setEmail(data?.email);
      setPhone(data?.telephone);
    };

    fetchUserData();
  }, []);

  const handleSubmit = async () => {
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!firstName.trim()) {
      Alert.alert('Please enter first name');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Please enter last name');
      return;
    }

    if (!phone.trim() || !phoneRegex.test(phone)) {
      Alert.alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoader(true);
      const payload = {
        firstname: firstName,
        lastname: lastName,
        email: email,
        telephone: phone,
      };
      const response = await postData(Api.ACCOUNT_UPDATE, payload);

      if ((response?.status === 200, response)) {
        await MMKVStorage.setItem('User_Data', response?.data?.data);
        setLoader(false);
        showToast('success', 'Success', 'Profile update successfully');
      } else {
        setLoader(false);
        Alert.alert('Error', response?.message || 'Something went wrong');
      }
    } catch (error) {
      setLoader(false);
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };
  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
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
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: moderateScale(10),
              backgroundColor: '#fff',
            }}
          >
            <Text style={styles.title}>My Account Information</Text>

            <Text style={styles.sectionText}>Your Personal Details</Text>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  placeholder="First Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  placeholder="Last Name"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                value={email}
                // onChangeText={setEmail}
                editable={false}
                selectTextOnFocus={false}
                showSoftInputOnFocus={false}
                caretHidden={true}
                style={styles.input}
                placeholder="Email"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroupFull}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="Phone"
                maxLength={15}
                keyboardType="number-pad"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setFirstName(defaultValues.firstname);
                  setLastName(defaultValues.lastname);
                  //   setEmail(defaultValues.email);
                  setPhone(defaultValues.telephone);
                }}
              >
                <Text style={styles.backText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  handleSubmit();
                }}
              >
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
  <View>
            <CartComponent />
          </View>

      <Loader visible={loader} />
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
    gap: 20,
    padding: moderateScale(10),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: '90%',
    height: moderateScale(45),
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

  title: {
    fontSize: '24@s',
    fontWeight: '700',
    color: '#7A0A0A',
    marginBottom: '20@s',
  },
  sectionText: {
    fontSize: '16@s',
    color: '#777',
    marginBottom: '20@s',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '10@s',
  },

  inputGroup: {
    flex: 1,
  },

  inputGroupFull: {
    width: '100%',
    marginTop: '15@s',
  },

  label: {
    fontFamily: FONT.BOLD,
    fontSize: moderateScale(16),
    color: Color.GRAY,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '6@s',
    padding: '12@s',
    fontSize: '16@s',
    backgroundColor: '#fafafa',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '30@s',
  },

  backBtn: {
    backgroundColor: '#888',
    paddingVertical: '12@s',
    paddingHorizontal: '50@s',
    borderRadius: '6@s',
  },
  backText: {
    color: '#fff',
    fontSize: '16@s',
    fontFamily: FONT.SEMIBOLD,
  },

  submitBtn: {
    backgroundColor: '#8B1A1A',
    paddingVertical: '12@s',
    paddingHorizontal: '50@s',
    borderRadius: '6@s',
  },
  submitText: {
    color: '#fff',
    fontSize: '16@s',
    fontFamily: FONT.SEMIBOLD,
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

export default EditInfotmation;
