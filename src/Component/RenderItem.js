import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Color, FONT } from './Image';
import { MMKVStorage } from '../utility/MmkvStore';
import { Api } from '../utility/api';
import { deleteData, putData } from '../utility/ApiCall';
import { useDispatch } from 'react-redux';
import { fetchCartData } from '../Redux/Slice/CartDataShowSlice';
import { showToast } from '../utility/showToast';
import Loader from './Loader';
const RenderItem = ({ item, navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loader, setLoader] = useState(false);
  const [inputQty, setInputQty] = useState('');
  useEffect(() => {
    setInputQty(String(item?.cart_quantity ?? 1));
  }, [item?.cart_quantity]);
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
        if (typeof firstValue === 'string' && firstValue.includes('#')) {
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
    setLoader(true);
    try {
      const response = await deleteData(Api.DELETE_CART, itemData);

      dispatch(fetchCartData(userData.customer_id));

      if (response?.status == 200) {
        showToast('success', 'Success!', response?.data?.message);
      } else {
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
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
        mode: item?.mode,
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
        mode: item?.mode,
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

  const additionalOptionPrice = (() => {
    const opt = item?.additional_option;

    if (!opt) return 0;

    let value = '';

    if (typeof opt === 'object' && !Array.isArray(opt)) {
      value = Object.values(opt)[0];
    } else if (typeof opt === 'string') {
      value = opt;
    }

    if (!value || typeof value !== 'string') return 0;

    const parts = value.split('#');
    return parseFloat(parts[2]) || 0;
  })();

  const handleQtyBlur = async (text, type) => {
    let qty = Number(text);

    // ✅ fallback
    if (!qty || qty <= 0) qty = 1;

    // ✅ stock check
    if (qty > item?.stock) {
      toast.show('Out of stock');
      qty = item?.stock;
    }

    // ✅ update input + UI
    setInputQty(String(qty));

    // ✅ CALL API HERE
    // await updateCartQtyFromInput(item, qty, type);

    const itemData = {
      customer_id: userData?.customer_id,
      quantity: qty,
      mode: item?.mode,
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
  };
  return (
    <>
      {optionType == 'normal' && (
        <>
          <View style={styles.cartRowWrapper}>
            <View style={styles.topRow}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="gray" />
              </TouchableOpacity>
            </View>

            <View style={styles.inlineRow}>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>In-Stock:</Text>
                <Text
                  style={[
                    styles.stockValue,
                    item?.options[0]?.values[0]?.quantity <= 10 && {
                      color: Color.RED,
                    },
                  ]}
                >
                  {item?.options[0]?.values[0]?.quantity}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.sidePanel}
                  onPress={() => handleDecrement(item)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </View>
                </TouchableOpacity>

                {/* <Text style={styles.qtyNumber}>{item?.cart_quantity}</Text> */}
                <TextInput
                  style={styles.qtyInput}
                  value={inputQty}
                  keyboardType="numeric"
                  maxLength={3}
                  onChangeText={text => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setInputQty(cleaned);
                  }}
                  onBlur={() => handleQtyBlur(inputQty, optionType)}
                />

                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    { borderLeftWidth: 1, borderLeftColor: '#ddd' },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}
              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £
                    {parseFloat(
                      item?.options[0]?.values[0]?.price || 0,
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    {(item?.mode === 1 || item?.mode === 2) && '-'} £
                    {(
                      parseFloat(item?.options[0]?.values[0]?.price || 0) *
                      item?.cart_quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
      {optionType == 'no_option' && (
        <>
          <View style={styles.cartRowWrapper}>
            <View style={styles.topRow}>
              {/* <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text> */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="gray" />
              </TouchableOpacity>
            </View>

            {/* INLINE ROW FIXED */}
            <View style={styles.inlineRow}>
              {/* STOCK */}
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>In-Stock:</Text>
                <Text
                  style={[
                    styles.stockValue,
                    item?.quantity <= 10 && {
                      color: Color.RED,
                    },
                  ]}
                >
                  {item?.quantity}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                {/* MINUS BUTTON */}
                <TouchableOpacity
                  style={styles.sidePanel}
                  onPress={() => handleDecrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </View>
                </TouchableOpacity>

                {/* NUMBER */}
                {/* <Text style={styles.qtyNumber}>{item?.cart_quantity}</Text> */}

                {/* PLUS BUTTON */}

                <TextInput
                  style={styles.qtyInput}
                  value={inputQty}
                  keyboardType="numeric"
                  maxLength={3}
                  onChangeText={text => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setInputQty(cleaned);
                  }}
                  onBlur={() => handleQtyBlur(inputQty, optionType)}
                />
                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    { borderLeftWidth: 1, borderLeftColor: '#ddd' },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}
              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £{parseFloat(item?.price || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    £
                    {(
                      parseFloat(item?.price || 0) * item?.cart_quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
      {optionType == 'custom' && (
        <>
          <View style={styles.cartRowWrapper}>
            <View style={styles.topRow}>
              {/* <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text> */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="gray" />
              </TouchableOpacity>
            </View>

            {/* INLINE ROW FIXED */}
            <View style={styles.inlineRow}>
              {/* STOCK */}
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>In-Stock:</Text>
                <Text
                  style={[
                    styles.stockValue,
                    item?.quantity <= 10 && {
                      color: Color.RED,
                    },
                  ]}
                >
                  {item?.quantity}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                {/* MINUS BUTTON */}
                <TouchableOpacity
                  style={styles.sidePanel}
                  onPress={() => handleDecrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </View>
                </TouchableOpacity>

                {/* NUMBER */}
                {/* <Text style={styles.qtyNumber}>{item?.cart_quantity}</Text> */}
                <TextInput
                  style={styles.qtyInput}
                  value={inputQty}
                  keyboardType="numeric"
                  maxLength={3}
                  onChangeText={text => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setInputQty(cleaned);
                  }}
                  onBlur={() => handleQtyBlur(inputQty, optionType)}
                />

                {/* PLUS BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    { borderLeftWidth: 1, borderLeftColor: '#ddd' },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}

              <View style={styles.priceGroup}>
                {/* <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £
                    {parseFloat(
                      item?.options[0]?.bespoke_factor_val || 0,
                    ).toFixed(2)}
                  </Text>
                </View> */}

                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £{additionalOptionPrice.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    £
                    {(
                      parseFloat(
                        secondValue * item?.options?.[0]?.bespoke_factor_val ||
                          0,
                      ) * item?.cart_quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
      {optionType == 'matrix' && (
        <>
          <View style={styles.cartRowWrapper}>
            <View style={styles.topRow}>
              {/* <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text> */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="gray" />
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: 'row', gap: verticalScale(10), top: -5 }}
            >
              <Text
                style={{
                  fontSize: verticalScale(14),
                  color: '#4F4F4F',
                  fontFamily: FONT.MEDIUM,
                }}
              >
                Width (mm):{middleValue}
              </Text>
              <Text
                style={{
                  fontSize: verticalScale(14),
                  color: '#4F4F4F',
                  fontFamily: FONT.MEDIUM,
                }}
              >
                Length (mm):{secondValue}
              </Text>
            </View>
            {/* INLINE ROW FIXED */}
            <View style={styles.inlineRow}>
              {/* STOCK */}
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>In-Stock:</Text>
                <Text
                  style={[
                    styles.stockValue,
                    item?.quantity <= 10 && {
                      color: Color.RED,
                    },
                  ]}
                >
                  {item?.quantity}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                {/* MINUS BUTTON */}
                <TouchableOpacity
                  style={styles.sidePanel}
                  onPress={() => handleDecrement(item)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </View>
                </TouchableOpacity>

                {/* NUMBER */}
                <Text style={styles.qtyNumber}>{item?.cart_quantity}</Text>

                {/* <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={String(item?.cart_quantity)}
                  onChangeText={text => {
                    if (text === '') {
                      // allow user to type empty for a moment
                      updateCartQtyFromInput(item, '', item?.mode);
                      return;
                    }

                    const num = Number(text);
                    if (!isNaN(num)) {
                      updateCartQtyFromInput(item, num, item?.mode);
                    }
                  }}
                  onEndEditing={() => {
                    if (!item?.cart_quantity || item?.cart_quantity <= 0) {
                      updateCartQtyFromInput(item, 1, item?.mode);
                    }
                  }}
                /> */}

                {/* PLUS BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    { borderLeftWidth: 1, borderLeftColor: '#ddd' },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View style={styles.qtyBtnCircle}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}
              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    {/* x £
                    {parseFloat(
                      item?.options[0]?.values[0]?.price || 0,
                    ).toFixed(2)} */}
                    -
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    £{parseFloat(price).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
      <Loader visible={loader} />
    </>
  );
};

const styles = ScaledSheet.create({
  cartRowWrapper: {
    flex: 1,
    paddingVertical: 5,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  productName: {
    fontSize: 16,
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK,
    flexShrink: 1,
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  /* STOCK INLINE */
  stockRow: {
    // flexDirection: 'row',
    alignItems: 'center',
    width: '15%',
  },

  stockLabel: {
    fontSize: 12,
    fontFamily: FONT.MEDIUM,
    color: '#6D6D6D',
  },

  stockValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D6D6D',
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
    height: verticalScale(40),
    width: verticalScale(130),
    backgroundColor: '#fff',
  },

  sidePanel: {
    width: verticalScale(45),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },

  qtyBtnCircle: {
    height: verticalScale(28),
    width: verticalScale(28),
    borderRadius: verticalScale(14),
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  qtyNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6D6D6D',
  },

  /* PRICE BOXES */
  priceGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#fff',
    width: verticalScale(130),
    height: verticalScale(40),

    alignItems: 'center',
  },

  priceHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    width: 1,
    backgroundColor: '#ccc',
    height: '100%',
    // marginVertical: 5,
  },

  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D6D6D',
  },
  qtyInput: {
    textAlign: 'center',

    width: verticalScale(40),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',

    borderRightColor: '#ddd',

    fontSize: 14,
    fontWeight: '600',
    color: '#6D6D6D',
  },
});

export default RenderItem;
