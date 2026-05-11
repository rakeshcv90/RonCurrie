/* eslint-disable react-native/no-inline-styles */
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  fetchCartData,
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import { showToast } from '../utility/showToast';
import Loader from './Loader';
import decodeHtml from '../utility/decodeHtml';
import debounce from 'lodash.debounce';
const RenderItem = ({ item, navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loader, setLoader] = useState(false);
  const [inputQty, setInputQty] = useState('');

  // --- Optimistic local quantity with debounced API ---
  const [localQty, setLocalQty] = useState(item?.cart_quantity ?? 1);
  const debounceTimerRef = useRef(null);
  const latestQtyRef = useRef(localQty);

  // Sync localQty when server data (item.cart_quantity) changes
  useEffect(() => {
    setLocalQty(item?.cart_quantity ?? 1);
    latestQtyRef.current = item?.cart_quantity ?? 1;
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

    // const values = Object?.values(optionData)
    //   .map(Number)
    //   .filter(v => !isNaN(v));

    const values = Object.values(optionData || {})
      .map(Number)
      .filter(v => !isNaN(v));

    const [width, height] = values.map(v => Math.floor(parseFloat(v)));

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
      dispatch(triggerCartRefresh());
      dispatch(triggerMiscRefresh());
      if (response?.status == 200) {
        // showToast('success', 'Success!', response?.data?.message);
      } else {
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error('Error updating quantity:', error);
    }
  };
  // --- Debounced API call: fires 500ms after user stops tapping ---
  const debouncedApiCall = useCallback(
    (newQty, cartId, mode) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (newQty <= 0) {
          // Delete item from cart
          const itemData = {
            customer_id: userData?.customer_id,
            cart_id: cartId,
            ...(mode && { mode: mode }),
          };
          try {
            const response = await deleteData(Api.DELETE_CART, itemData);
            dispatch(fetchCartData(userData.customer_id));
          } catch (error) {
            console.error('Error deleting cart item:', error);
            // Rollback on error
            setLocalQty(item?.cart_quantity ?? 1);
            setInputQty(String(item?.cart_quantity ?? 1));
          }
        } else {
          // Update quantity
          const itemData = {
            customer_id: userData?.customer_id,
            quantity: newQty,
            mode: mode,
          };
          try {
            const end_point = `${Api.UPDATE_CART}/${cartId}`;
            const response = await putData(end_point, itemData);
            dispatch(fetchCartData(userData.customer_id));
            if (response?.status !== 200) {
              // Rollback on failure
              setLocalQty(item?.cart_quantity ?? 1);
              setInputQty(String(item?.cart_quantity ?? 1));
            }
          } catch (error) {
            console.error('Error updating quantity:', error);
            // Rollback on error
            setLocalQty(item?.cart_quantity ?? 1);
            setInputQty(String(item?.cart_quantity ?? 1));
          }
        }
      }, 500);
    },
    [userData, item, dispatch],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleIncrement = (item, type) => {
    let availableQty = 0;

    if (type == 'no_option') {
      availableQty = item?.quantity || 0;
    } else if (type == 'custom') {
      availableQty = item?.quantity || 0;
    } else if (type == 'matrix') {
      availableQty = item?.quantity || 0;
    } else {
      availableQty = item?.options?.[0]?.values?.[0]?.quantity || 0;
    }

    const currentQty = latestQtyRef.current;

    if (availableQty > currentQty) {
      const newQty = currentQty + 1;
      // Update locally immediately
      setLocalQty(newQty);
      setInputQty(String(newQty));
      latestQtyRef.current = newQty;
      // Schedule debounced API call
      debouncedApiCall(newQty, item?.cart_id, item?.mode);
    }
  };

  const handleDecrement = item => {
    const currentQty = latestQtyRef.current;
    const newQty = currentQty - 1;

    // Update locally immediately
    setLocalQty(Math.max(newQty, 0));
    setInputQty(String(Math.max(newQty, 1)));
    latestQtyRef.current = Math.max(newQty, 0);
    // Schedule debounced API call
    debouncedApiCall(newQty, item?.cart_id, item?.mode);
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

    console.log('Blurred with text:', qty, item?.quantity);
    // if (qty > item?.quantity) {
    //   showToast('danger', 'Cart Update Failed', 'Out of stock');
    //   qty = item?.quantity;
    //   // setInputQty(String(qty));
    //   return
    // }

    if (qty > item?.quantity) {
      showToast('danger', 'Cart Update Failed', 'Out of stock');

      // ✅ reset to actual available or previous cart qty
      const validQty = item?.cart_quantity;

      setInputQty(String(validQty)); // ✅ update UI immediately
      return;
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
      } else {
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };
  const getBespokeQty = additional_option => {
    if (!additional_option) return null;

    try {
      const parsed = JSON.parse(additional_option);

      const bespokeValue = Object.values(parsed).find(v =>
        v.startsWith('bespoke_option'),
      );

      return bespokeValue ? bespokeValue.split('#')[1] : null;
    } catch (e) {
      return null;
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
                <Ionicons name="trash-outline" size={22} color="#4472c4" />
              </TouchableOpacity>
            </View>

            {item?.options?.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  top: -6,
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: verticalScale(12),
                    color: '#4F4F4F',
                    fontFamily: FONT.REGULAR,
                  }}
                >
                  {item?.options[0]?.option_descriptions?.name}:{' '}
                  {item?.options[0]?.values[0]?.option_values_name[0]?.name}
                </Text>
                {item?.options?.length >= 2 && (
                  <Text
                    style={{
                      fontSize: verticalScale(12),
                      color: '#4F4F4F',
                      fontFamily: FONT.REGULAR,
                    }}
                  >
                    {item?.options[1]?.option_descriptions?.name}:{' '}
                    {item?.options[1]?.values[0]?.option_values_name[0]?.name}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.inlineRow}>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>In-Stock:</Text>
                <Text
                  style={[
                    styles.stockValue,
                    item?.options[0]?.values[0]?.quantity <= 10 && {
                      color: Color.RED2,
                    },
                  ]}
                >
                  {item?.options[0]?.values[0]?.quantity}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={[styles.sidePanel, { backgroundColor: Color.GREEN2 }]}
                  onPress={() => handleDecrement(item)}
                >
                  <View
                    style={[styles.qtyBtnCircle, { backgroundColor: 'white' }]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.GREEN2 }]}>
                      -
                    </Text>
                  </View>
                </TouchableOpacity>

                <TextInput
                  style={styles.qtyInput}
                  value={inputQty}
                  keyboardType="numeric"
                  maxLength={5}
                  onChangeText={text => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setInputQty(cleaned);
                  }}
                  onBlur={() => handleQtyBlur(inputQty, optionType)}
                />

                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    {
                      borderLeftWidth: 1,
                      borderLeftColor: '#ddd',
                      backgroundColor: Color.RED,
                    },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.RED }]}>
                      +
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £
                    {parseFloat(item?.options[0]?.values[0]?.price) === 0
                      ? parseFloat(item?.price).toFixed(2)
                      : parseFloat(
                          item?.options[0]?.values[0]?.price || 0,
                        ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text
                    style={[
                      styles.priceText,
                      {
                        color:
                          item?.mode === 1 || item?.mode === 2
                            ? Color.RED2
                            : Color.BLACK,
                      },
                    ]}
                  >
                    £ {(item?.mode === 1 || item?.mode === 2) && '-'}
                    {(
                      (Number(item?.options?.[0]?.values?.[0]?.price) > 0
                        ? Number(item?.options?.[0]?.values?.[0]?.price)
                        : Number(item?.price)) * Number(localQty || 0)
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
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="#4472c4" />
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
                  style={[styles.sidePanel, { backgroundColor: Color.GREEN2 }]}
                  onPress={() => handleDecrement(item)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.GREEN2 }]}>
                      -
                    </Text>
                  </View>
                </TouchableOpacity>

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
                    {
                      borderLeftWidth: 1,
                      borderLeftColor: '#ddd',
                      backgroundColor: Color.RED,
                    },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.RED }]}>
                      +
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £{parseFloat(item?.price || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text
                    style={[
                      styles.priceText,
                      {
                        color:
                          item?.mode === 1 || item?.mode === 2
                            ? Color.RED2
                            : Color.BLACK,
                      },
                    ]}
                  >
                    £ {(item?.mode === 1 || item?.mode === 2) && '-'}
                    {(parseFloat(item?.price || 0) * localQty).toFixed(2)}
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
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="#4472c4" />
              </TouchableOpacity>
            </View>

            {item?.options?.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  top: -6,
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: verticalScale(10),
                    color: '#4F4F4F',
                    fontFamily: FONT.REGULAR,
                  }}
                >
                  {item?.options[0]?.option_descriptions?.name}:{' '}
                  {getBespokeQty(item?.additional_option)}
                </Text>
                {item?.options?.length >= 2 && (
                  <Text
                    style={{
                      fontSize: verticalScale(10),
                      color: '#4F4F4F',
                      fontFamily: FONT.REGULAR,
                    }}
                  >
                    {item?.options[1]?.option_descriptions?.name}:{' '}
                    {item?.options[1]?.values[0]?.option_values_name[0]?.name}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.inlineRow}>
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
                  style={[styles.sidePanel, { backgroundColor: Color.GREEN2 }]}
                  onPress={() => handleDecrement(item)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.GREEN2 }]}>
                      -
                    </Text>
                  </View>
                </TouchableOpacity>

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
                    {
                      borderLeftWidth: 1,
                      borderLeftColor: '#ddd',
                      backgroundColor: Color.RED,
                    },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.RED }]}>
                      +
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}

              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>
                    x £{additionalOptionPrice.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text
                    style={[
                      styles.priceText,
                      {
                        color:
                          item?.mode === 1 || item?.mode === 2
                            ? Color.RED2
                            : Color.BLACK,
                      },
                    ]}
                  >
                    £ {(item?.mode === 1 || item?.mode === 2) && '-'}
                    {(
                      parseFloat(
                        secondValue * item?.options?.[0]?.bespoke_factor_val ||
                          0,
                      ) * localQty
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
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('DisplayItems', { itemData: item })
                }
              >
                <Text style={styles.productName}>{decodeHtml(item?.isbn)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item)}>
                <Ionicons name="trash-outline" size={22} color="#4472c4" />
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: 'row', gap: verticalScale(10), top: -5 }}
            >
              <Text
                style={{
                  fontSize: verticalScale(12),
                  color: '#4F4F4F',
                  fontFamily: FONT.REGULAR,
                }}
              >
                Width (mm):{middleValue}
              </Text>
              <Text
                style={{
                  fontSize: verticalScale(12),
                  color: '#4F4F4F',
                  fontFamily: FONT.REGULAR,
                }}
              >
                Height (mm):{secondValue}
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
                <TouchableOpacity
                  style={[styles.sidePanel, { backgroundColor: Color.GREEN2 }]}
                  onPress={() => handleDecrement(item)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.GREEN2 }]}>
                      -
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.qtyNumber}>{localQty}</Text>

                <TouchableOpacity
                  style={[
                    styles.sidePanel,
                    {
                      borderLeftWidth: 1,
                      borderLeftColor: '#ddd',
                      backgroundColor: Color.RED,
                    },
                  ]}
                  onPress={() => handleIncrement(item, optionType)}
                >
                  <View
                    style={[
                      styles.qtyBtnCircle,
                      { backgroundColor: Color.WHITE },
                    ]}
                  >
                    <Text style={[styles.qtyBtnText, { color: Color.RED }]}>
                      +
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* PRICE GROUP */}
              <View style={styles.priceGroup}>
                <View style={styles.priceHalf}>
                  <Text style={styles.priceText}>-</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceHalf}>
                  <Text
                    style={[
                      styles.priceText,
                      {
                        color:
                          item?.mode === 1 || item?.mode === 2
                            ? Color.RED2
                            : Color.BLACK,
                      },
                    ]}
                  >
                    £ {(item?.mode === 1 || item?.mode === 2) && '-'}
                    {parseFloat(price).toFixed(2)}
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
