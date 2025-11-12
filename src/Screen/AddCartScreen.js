import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Animated,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { MMKVStorage } from '../utility/MmkvStore';
// import { fetchCartData } from '../Redux/Slice/CartDataShowSlice';
import { Api } from '../utility/api';
import { deleteData, putData } from '../utility/ApiCall';
import { showToast } from '../utility/showToast';
import CartComponent from '../Component/CartComponent';
import RenderItem from '../Component/RenderItem';
import { CommonActions } from '@react-navigation/native';

const AddCartScreen = ({ navigation }) => {
  const [searchActive, setSearchActive] = useState(false);
  const logoAnim = useRef(new Animated.Value(1)).current;
  const searchAnim = useRef(new Animated.Value(-300)).current;
  const [title, setTitle] = useState('');
  const [misAmount, SetMisAMount] = useState(0);
  const dispatch = useDispatch();

  const { cartList, loading, error, refreshKey, skipAutoBack } = useSelector(
    state => state.cartListData,
  );
  const [cashTendered, setCashTendered] = useState(null);
  const [miscList, setMiscList] = useState([{ description: '', price: '' }]);

  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);

  useEffect(() => {
    if (skipAutoBack) return;
    if (cartList?.length === 0 && !hasNavigatedBack) {
      setHasNavigatedBack(true);
      navigation.goBack();
    } else if (cartList?.length > 0 && hasNavigatedBack) {
      setHasNavigatedBack(false);
    }
  }, [cartList, navigation]);
  const handleAddMisc = () => {
    setMiscList([...miscList, { description: '', price: '' }]);
  };

  const handleChange = (index, field, value) => {
    const updatedList = [...miscList];
    updatedList[index][field] = value;
    setMiscList(updatedList);
  };
  const calculateMatrixPrice = item => {
    const { matrix, additional_option, cart_quantity, cart_id } = item;
    const additionalOptionArray = JSON.parse(additional_option || '[]');

    if (!matrix || matrix?.length === 0) {
      let customOptionPrice = 0;
      let parsedOption;

      try {
        parsedOption = JSON.parse(additional_option || '[]');
      } catch {
        parsedOption = [];
      }

      // Case 1: parsedOption is object(custome length)
      if (
        parsedOption &&
        !Array.isArray(parsedOption) &&
        Object.keys(parsedOption).length > 0
      ) {
        const firstValue = Object.values(parsedOption)[0];
        if (typeof firstValue === 'string' && firstValue?.includes('#')) {
          const parts = firstValue?.split('#');

          customOptionPrice = Number(parts[2]) || 0;
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;

          customOptionPrice = Number(price) * cart_quantity || 0;
        }
      }
      // Case 2: parsedOption is array (like [])
      else if (Array.isArray(parsedOption) && parsedOption?.length === 0) {
        customOptionPrice = Number(item?.price) * cart_quantity || 0;
      }

      return customOptionPrice;
    }

    let optionData = {};
    try {
      optionData = JSON.parse(additional_option);
    } catch (e) {
      parsedOption = [];
      // return Number(item.price) * (cart_quantity || 1);
    }

    const values = Object.values(optionData)
      .map(Number)
      .filter(v => !isNaN(v));

    const [width, height] = values;

    let matched = matrix.find(m => m.width === width && m.height === height);

    if (!matched) {
      const largerMatches = matrix.filter(
        m => m.width >= width && m.height >= height,
      );

      if (largerMatches.length > 0) {
        matched = largerMatches.sort(
          (a, b) =>
            a.width -
            width +
            (a.height - height) -
            (b.width - width + (b.height - height)),
        )[0];
      } else {
        matched = matrix.sort(
          (a, b) => b.width - a.width || b.height - a.height,
        )[0];
      }
    }

    const matrixPrice = Number(matched?.price || 0);

    return matrixPrice * (cart_quantity || 1);
  };
  const getTotalPrice = () => {
    if (!cartList || cartList.length === 0) return '0.00';
    const subTotal = cartList?.reduce((sum, item) => {
      const price = calculateMatrixPrice(item);

      // If mode is 1 or 2, subtract price; otherwise, add
      if (item.mode === 1 || item.mode === 2) {
        return sum - price;
      } else {
        return sum + price;
      }
    }, 0);
    const miscTotal = miscList.reduce((sum, misc) => {
      const amt = parseFloat(misc?.price) || 0;
      return sum + amt;
    }, 0);
    const total = subTotal + miscTotal;
    return total.toFixed(2);
  };
  const handleDeleteMisc = index => {
    if (miscList.length === 1) {
      return;
    }

    const updatedList = miscList.filter((_, i) => i !== index);
    setMiscList(updatedList);
  };
  useEffect(() => {
    if (cartList?.length === 0) {
      navigation.goBack();
    }
  }, [cartList, navigation]);
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
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.leftContainer}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
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
            <Text style={styles.groupText}>{cartList?.length} Items,</Text>
            <Text>{cartList?.length} Groups</Text>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1, marginBottom: moderateScale(20) }}
          showsVerticalScrollIndicator={false}
        >
          <FlatList
            data={cartList}
            keyExtractor={(item, index) => String(item.cart_id ?? index)}
            renderItem={({ item }) => (
              <RenderItem item={item} navigation={navigation} />
            )}
          />

          {miscList?.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: moderateScale(10),
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.totalLabel}>TITLE</Text>
                <View style={styles.cashBox}>
                  <View style={styles.cashInputRow}>
                    <TextInput
                      style={styles.cashInput1}
                      placeholder="Enter title"
                      value={item.description}
                      onChangeText={text =>
                        handleChange(index, 'description', text)
                      }
                    />
                  </View>
                </View>
              </View>
              <View>
                <Text style={styles.cashLabel}>AMOUNT</Text>
                <View style={styles.cashBox}>
                  <View style={styles.cashInputRow}>
                    <Text style={styles.cashSymbol}>£</Text>
                    <TextInput
                      style={styles.cashInput1}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={item.price}
                      onChangeText={text => handleChange(index, 'price', text)}
                    />
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={{ marginTop: moderateScale(20), zIndex: 10 }}
                onPress={() => handleDeleteMisc(index)}
              >
                <Ionicons name="trash-outline" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.miscBtn} onPress={handleAddMisc}>
            <Text style={styles.miscText}>Add Miscellaneous Charges</Text>
          </TouchableOpacity>
          <View style={styles.totalContainer}>
            <View>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>
                {Number(getTotalPrice()) < 0
                  ? `- £ ${Math.abs(Number(getTotalPrice())).toFixed(2)}`
                  : `£ ${Number(getTotalPrice()).toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.cashBox}>
              <Text style={styles.cashLabel}>CASH TENDERED</Text>
              <View style={styles.cashInputRow}>
                <Text style={styles.cashSymbol}>£</Text>
                <TextInput
                  style={styles.cashInput}
                  keyboardType="numeric"
                  value={cashTendered}
                  placeholder="0.00"
                  onChangeText={setCashTendered}
                />
              </View>
              {cashTendered && (
                <Text style={styles.changeText}>
                  Change To Give:{' '}
                  <Text style={styles.changeValue}>
                    £
                    {(
                      parseFloat(cashTendered || 0) -
                      parseFloat(getTotalPrice() || 0)
                    ).toFixed(2)}
                  </Text>
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
        <View style={styles.bottomBtn}>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();

              setTimeout(() => {
                navigation.navigate('CustomerDetails', { addCost: miscList });
              }, 100);
            }}
            style={{
              width: '50%',
              height: moderateScale(40),
              backgroundColor: Color.RED,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'flex-end',
              borderRadius: 4,
            }}
          >
            <Text style={styles.bottomBtnText}>Customer Information</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: { width: '80%', height: moderateScale(40) },
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
  tab: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(5) },

  cartRowWrapper: {
    // marginBottom: 10,
    justifyContent: 'center',
    padding: moderateScale(10),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  productName: {
    fontSize: 16,
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qtyButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: moderateScale(15),
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  qtyCount: {
    paddingHorizontal: moderateScale(20),

    fontSize: 14,
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  priceContainer: {
    flexDirection: 'row',
    // flex:1,
    marginLeft: moderateScale(5),
  },
  priceBox: {
    backgroundColor: '#fff',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(25),
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: moderateScale(1),
    borderRadius: 4,
  },
  priceText: {
    fontSize: 14,
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },

  miscBtn: {
    backgroundColor: '#3D3D3D',
    padding: 12,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  miscText: { color: '#fff', fontWeight: '600' },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: moderateScale(15),
  },
  totalLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  cashBox: { alignItems: 'flex-end' },
  cashLabel: { fontSize: 14, fontFamily: FONT.SEMIBOLD, color: Color.GRAY4 },
  cashInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(5),
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashSymbol: { fontSize: 16, marginRight: 5 },
  cashInput: { fontSize: 16, width: moderateScale(60) },
  cashInput1: { fontSize: 16, width: moderateScale(130) },
  changeText: { fontSize: 14 },
  changeValue: { color: 'red', fontWeight: '600' },

  bottomBtn: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(10),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Color.GRAY2,
  },
  bottomBtnText: {
    color: Color.WHITE,
    fontSize: 14,
    fontFamily: FONT.SEMIBOLD,
  },
  groupText: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
    lineHeight: moderateScale(24),
  },

  headerRow: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: '20@s',
  },
  inStock: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
    textAlign: 'left',
  },
  inStock1: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
    textAlign: 'right',
  },
});

export default AddCartScreen;
