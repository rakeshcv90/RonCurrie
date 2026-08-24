/* eslint-disable no-unused-vars */
import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Color } from './Image';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MMKVStorage } from '../utility/MmkvStore';
import {
  fetchCartData,
  fetchMiscData,
  setSkipAutoBack,
} from '../Redux/Slice/CartDataShowSlice';
import { showToast } from '../utility/showToast';

const CartComponent = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    cartList,
    loading,
    error,
    refreshKey,
    miscList: reduxMiscList,
  } = useSelector(state => state.cartListData);

  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData?.customer_id) {
      dispatch(fetchCartData(userData.customer_id));
      dispatch(fetchMiscData(userData?.customer_id));
    }
  }, [dispatch, userData, refreshKey]);
  useFocusEffect(
    React.useCallback(() => {
      dispatch(setSkipAutoBack(false));
    }, []),
  );

  const calculateMatrixPrice = useCallback(item => {
    const { matrix, additional_option, cart_quantity, cart_id, mode } = item;
    const additionalOptionArray = JSON.parse(additional_option || '[]');

    if (!matrix || matrix?.length === 0) {
      let customOptionPrice = 0;
      let parsedOption;

      try {
        parsedOption = JSON.parse(additional_option || '[]');
      } catch {
        parsedOption = [];
      }

      if (
        parsedOption &&
        !Array.isArray(parsedOption) &&
        Object.keys(parsedOption).length > 0
      ) {
        const firstValue = Object.values(parsedOption)[0];

        if (typeof firstValue === 'string' && firstValue.includes('#')) {
          const parts = firstValue.split('#');

          const middleValue = firstValue.split('#')[2];
          const secondValue = firstValue.split('#')[1];
          const totalPriceNumber =
            (Number(secondValue) || 0) *
            (Number(item?.options?.[0]?.bespoke_factor_val) || 0) *
            (Number(item?.cart_quantity) || 0);
          customOptionPrice = totalPriceNumber || 0;
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;
          const basePrice = item?.price;

          const finalPrice = price > 0 ? price : basePrice;
          // console.log('Custome Prive', price);
          customOptionPrice = Number(finalPrice) * cart_quantity || 0;
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
      return Number(item.price) * (cart_quantity || 1);
    }

    const values = Object.values(optionData)
      .map(Number)
      .filter(v => !isNaN(v));

    // const [width, height] = values;
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
        matched = matrix?.sort(
          (a, b) => b.width - a.width || b.height - a.height,
        )[0];
      }
    }

    const matrixPrice = Number(matched?.price || 0);

    return matrixPrice * (cart_quantity || 1);
  }, []);

  const getPrice = useMemo(() => {
    if (!cartList || cartList.length === 0) return '0.00';

    const subTotal = cartList.reduce((sum, item) => {
      const price = calculateMatrixPrice(item);

      return item.mode === 1 || item.mode === 2 ? sum - price : sum + price;
    }, 0);

    const miscTotal = (reduxMiscList?.miscellaneous || []).reduce(
      (sum, item) => sum + Number(item.misc_value || 0),
      0,
    );

    const finalTotal = subTotal + miscTotal;

    return finalTotal.toFixed(2);
  }, [cartList, reduxMiscList]);
  const itemCount = useMemo(() => {
    const subTotal = cartList?.reduce(
      (sum, item) => sum + (item?.cart_quantity || 0),
      0,
    );

    return Number(subTotal) || 0;
  }, [cartList]);

  const cartTimeoutRef = useRef(null);
  const barcodeTimeoutRef = useRef(null);

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, []);

  const handleCartPress = useCallback(() => {
    Keyboard.dismiss();
    if (cartList?.length > 0) {
      cartTimeoutRef.current = setTimeout(() => {
        navigation.navigate('AddCartScreen');
      }, 80);
    } else {
      showToast(
        'warning',
        'Warning!',
        'Your cart is empty. Please add items before proceeding.',
      );
    }
  }, [cartList?.length, navigation]);

  const handleBarcodePress = useCallback(() => {
    Keyboard.dismiss();
    barcodeTimeoutRef.current = setTimeout(() => {
      navigation.navigate('BarCodeReader');
    }, 80);
  }, [navigation]);
  return (
    <View style={styles.bottomWrapper}>
      <View style={styles.bottomCard}>
        <TouchableOpacity style={styles.circleLeft} onPress={handleCartPress}>
          <View style={styles.circleLeft1}>
            <MaterialDesignIcons name="cart" color={Color.WHITE} size={25} />
          </View>
          <Text style={{ color: 'white', fontSize: 16 }}>
            {Number(getPrice) < 0
              ? `£ -${Math.abs(Number(getPrice)).toFixed(2)}`
              : `£ ${Number(getPrice).toFixed(2)}`}
          </Text>
          <View
            style={{
              height: 20,
              width: 2,
              backgroundColor: Color.GRAY,
              borderRadius: 2,
            }}
          />
          <View style={{ marginRight: 5 }}>
            <Text style={{ color: 'white', fontSize: 11 }}>
              {(cartList?.length || 0) +
                (reduxMiscList?.miscellaneous?.length || 0)}{' '}
              Groups
            </Text>
            <Text style={{ color: 'white', fontSize: 11 }}>
              {itemCount} Items
            </Text>
          </View>
        </TouchableOpacity>
        <View
          style={{
            height: 40,
            width: 3,
            backgroundColor: '#D1D1D1',
            borderRadius: 2,
          }}
        />
        <TouchableOpacity
          style={styles.circleRight}
          onPress={handleBarcodePress}
        >
          <View
            style={{
              width: verticalScale(45),
              height: verticalScale(45),
              borderRadius: verticalScale(45),
              backgroundColor: Color.RED,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialDesignIcons
              name="barcode-scan"
              color={Color.WHITE}
              size={verticalScale(25)}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = ScaledSheet.create({
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    height: verticalScale(50),
    flexDirection: 'row',
    backgroundColor: Color.WHITE,
    borderRadius: 40,
    elevation: 5,

    alignItems: 'center',
    padding: '2@ms',
    gap: 5,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  circleLeft: {
    height: verticalScale(45),
    borderRadius: 50,
    backgroundColor: '#3D3D3D',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  circleLeft1: {
    width: 45,
    height: 45,
    borderRadius: 45,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '3@ms',
  },
  circleRight: {
    // width: '20%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom:
      Platform.OS === 'ios' ? moderateScale(20) : moderateScale(10),
  },
});

export default React.memo(CartComponent);
