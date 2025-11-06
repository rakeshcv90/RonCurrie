import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Color, FONT } from './Image';
import { MMKVStorage } from '../utility/MmkvStore';
import { Api } from '../utility/api';
import { deleteData, putData } from '../utility/ApiCall';
import { useDispatch } from 'react-redux';
import { fetchCartData } from '../Redux/Slice/CartDataShowSlice';
import { showToast } from '../utility/showToast';
const RenderItem = ({ item }) => {
  const [userData, setUserData] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);
  const findDataType = item => {
    const { matrix, additional_option, cart_quantity, cart_id } = item;

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
        if (firstValue && firstValue.includes('#')) {
          const parts = firstValue.split('#');

          customOptionPrice = 'custom';
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;

          customOptionPrice = 'normal';
        }
      }
      // Case 2: parsedOption is array (like [])
      else if (Array.isArray(parsedOption) && parsedOption.length === 0) {
        customOptionPrice = 'no_option';
      }

      return customOptionPrice;
    }

    let optionData = {};
    try {
      optionData = JSON.parse(additional_option);
    } catch (e) {
      parsedOption = [];
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

    return 'matrix';
  };

  const getPrice = data => {
    const { matrix, additional_option, cart_quantity, cart_id } = data;
    let parsedOption;
    let optionData = {};
    try {
      optionData = JSON.parse(additional_option);
    } catch (e) {
      parsedOption = [];
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

  const removeItem = async item => {
    const itemData = {
      customer_id: userData?.customer_id,
      cart_id: item?.cart_id,
      ...(item?.mode && { mode: item?.mode }),
    };

    try {
      const response = await deleteData(Api.DELETE_CART, itemData);

      dispatch(fetchCartData(userData.customer_id));

      if (response?.status == 200) {
        showToast('success', 'Success!', response?.data?.message);
      } else {
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };
  const handleIncrement = async (item, type) => {
    let availableQty = 0;

    const currentQty = item?.cart_quantity || 0;
    if (type == 'no_option') {
      availableQty = item?.quantity || 0;
    } else if (type == 'custom') {
      availableQty = item?.quantity || 0;
    } else if (type == 'matrix') {
      availableQty = item?.quantity || 0;
    } else {
      availableQty = item?.options?.[0]?.values?.[0]?.quantity || 0;
    }

    if (availableQty > currentQty) {
      const newQty = currentQty + 1;
      const itemData = {
        customer_id: userData?.customer_id,
        quantity: newQty,
      };

      try {
        const end_point = `${Api.UPDATE_CART}/${item?.cart_id}`;
        const response = await putData(end_point, itemData);

        dispatch(fetchCartData(userData.customer_id));
        if (response?.status == 200) {
          showToast('success', 'Success!', 'Cart update successfully');
        } else {
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    } else {
      // Toast.show({
      //   type: 'error',
      //   text1: 'Out of Stock',
      //   text2: `Only ${availableQty} item(s) available.`,
      // });
    }
  };

  const handleDecrement = async (item, type) => {
    const currentQty = Number(item?.cart_quantity) || 0;
    const newQty = currentQty - 1;

    if (newQty > 0) {
      const itemData = {
        customer_id: userData?.customer_id,
        quantity: newQty,
      };

      try {
        const end_point = `${Api.UPDATE_CART}/${item?.cart_id}`;
        const response = await putData(end_point, itemData);

        dispatch(fetchCartData(userData.customer_id));
        if (response?.status == 200) {
          showToast('success', 'Success!', 'Cart update successfully');
        } else {
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    } else {
      const itemData = {
        customer_id: userData?.customer_id,
        cart_id: item?.cart_id,
        ...(item?.mode && { mode: item?.mode }), // ✅ only adds 'mode' if it exists
      };

      try {
        const response = await deleteData(Api.DELETE_CART, itemData);

        dispatch(fetchCartData(userData.customer_id));

        if (response?.status == 200) {
          showToast('success', 'Success!', response?.data?.message);
        } else {
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  };
  const { matrix, additional_option, cart_quantity, cart_id } = item;
  let parsedOption;
  let middleValue = 0;
  let secondValue = 0;

  try {
    parsedOption = JSON.parse(additional_option || '[]');
  } catch {
    parsedOption = [];
  }

  const optionType = findDataType(item);
  if (optionType == 'custom') {
    const firstValue = Object.values(parsedOption)[0];

    middleValue = firstValue.split('#')[2];
    secondValue = firstValue.split('#')[1];
  } else if (optionType == 'matrix') {
    middleValue = Object.values(parsedOption)[0];
    secondValue = Object.values(parsedOption)[1];
  }
  const price = getPrice(item);

  return (
    <>
      {optionType == 'normal' && (
        <View style={styles.cartRowWrapper}>
          <View style={[styles.topRow, { marginBottom: moderateScale(10) }]}>
            <Text
              style={styles.productName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item?.isbn}
       
            </Text>
            <TouchableOpacity onPress={() => removeItem(item)}>
              <Ionicons name="trash-outline" size={20} color="gray" />
            </TouchableOpacity>
          </View>
          <View style={styles.cartRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleDecrement(item)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{item?.cart_quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleIncrement(item)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  x £
                  {parseFloat(
                    item?.options?.[0]?.values?.[0]?.price || 0,
                  ).toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  - x £
                  {(
                    parseFloat(item?.options?.[0]?.values?.[0]?.price || 0) *
                    item?.cart_quantity
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ paddingRight: moderateScale(10), marginTop: 5 }}>
            <Text style={styles.inStock}>
              In-Stock:{item?.options[0]?.values[0]?.quantity}
            </Text>
          </View>
        </View>
      )}
      {optionType == 'no_option' && (
        <View style={styles.cartRowWrapper}>
          <View style={[styles.topRow, { marginBottom: moderateScale(10) }]}>
            <Text style={styles.productName}>{item?.isbn}</Text>
            <TouchableOpacity onPress={() => removeItem(item, optionType)}>
              <Ionicons name="trash-outline" size={20} color="gray" />
            </TouchableOpacity>
          </View>
          <View style={styles.cartRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleDecrement(item, optionType)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{item?.cart_quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleIncrement(item, optionType)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  x £{parseFloat(item?.price || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  - x £
                  {(parseFloat(item?.price || 0) * item?.cart_quantity).toFixed(
                    2,
                  )}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ paddingRight: moderateScale(10), marginTop: 5 }}>
            <Text style={styles.inStock}>In-Stock:{item?.quantity}</Text>
          </View>
        </View>
      )}
      {optionType == 'custom' && (
        <View style={styles.cartRowWrapper}>
          <View style={[styles.topRow, { marginBottom: moderateScale(10) }]}>
            <Text style={styles.productName}>{item?.isbn}</Text>
            <TouchableOpacity onPress={() => removeItem(item, optionType)}>
              <Ionicons name="trash-outline" size={20} color="gray" />
            </TouchableOpacity>
          </View>
          <View style={styles.cartRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleDecrement(item, optionType)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{item?.cart_quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleIncrement(item, optionType)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  x £
                  {parseFloat(
                    item?.options[0]?.bespoke_factor_val || 0,
                  ).toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>
                  - x £
                  {(
                    parseFloat(
                      secondValue * item?.options?.[0]?.bespoke_factor_val || 0,
                    ) * item?.cart_quantity
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ paddingRight: moderateScale(10), marginTop: 5 }}>
            <Text style={styles.inStock}>In-Stock : {item?.quantity}</Text>
          </View>
          <View style={{ paddingRight: moderateScale(10), marginTop: 5 }}>
            <Text style={[styles.inStock1, { top: -moderateScale(20) }]}>
              Bespoke Value : {item?.options?.[0]?.bespoke_factor_val}
            </Text>
          </View>
        </View>
      )}
      {optionType == 'matrix' && (
        <>
          <View style={styles.cartRowWrapper}>
            <View style={[styles.topRow, { marginBottom: moderateScale(10) }]}>
              <Text style={styles.productName}>{item?.isbn}</Text>
              <TouchableOpacity onPress={() => removeItem(item, optionType)}>
                <Ionicons name="trash-outline" size={20} color="gray" />
              </TouchableOpacity>
            </View>
            <View style={styles.cartRow}>
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleDecrement(item, optionType)}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyCount}>{item?.cart_quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceContainer}>
                <View
                  style={[
                    styles.priceBox,
                    { paddingHorizontal: moderateScale(10) },
                  ]}
                >
                  <Text style={styles.priceText}>{middleValue}</Text>
                </View>
                <View
                  style={[
                    styles.priceBox,
                    { paddingHorizontal: moderateScale(10) },
                  ]}
                >
                  <Text style={styles.priceText}>{secondValue}</Text>
                </View>
                <View
                  style={[
                    styles.priceBox,
                    { paddingHorizontal: moderateScale(10) },
                  ]}
                >
                  <Text style={styles.priceText}>
                    - x £{parseFloat(price).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                paddingRight: moderateScale(10),
                marginTop: 5,
              }}
            >
              <Text style={styles.inStock}>In-Stock:{item?.quantity}</Text>
            </View>
          </View>
        </>
      )}
    </>
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

    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK,
    flexShrink: 1,
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
    paddingHorizontal: moderateScale(10),
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
export default RenderItem;
