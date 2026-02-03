import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

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
  setSkipAutoBack,
} from '../Redux/Slice/CartDataShowSlice';
import { showToast } from '../utility/showToast';

const CartComponent = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { cartList, loading, error, refreshKey } = useSelector(
    state => state.cartListData,
  );

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
    }
  }, [dispatch, userData, refreshKey]);
  useFocusEffect(
    React.useCallback(() => {
      dispatch(setSkipAutoBack(false));
    }, []),
  );

  const calculateMatrixPrice = item => {
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
        // if (firstValue && firstValue?.includes('#')) {
        //   const parts = firstValue?.split('#');

        //   customOptionPrice = Number(parts[2]) || 0;
        // }

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
      return Number(item.price) * (cart_quantity || 1);
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

  const getPrice = () => {
    if (!cartList || cartList?.length === 0) return '0.00';

    const subTotal = cartList?.reduce((sum, item) => {
      const price = calculateMatrixPrice(item);

      if (item.mode === 1 || item.mode === 2) {
        return sum - price;
      } else {
        return sum + price;
      }
    }, 0);

    return subTotal?.toFixed(2);
  };

  const getItemCount = () => {
    const subTotal = cartList?.reduce(
      (sum, item) => sum + item?.cart_quantity,
      0,
    );

    return Number(subTotal);
  };
  return (
    <View style={styles.bottomWrapper}>
      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.circleLeft}
          onPress={() => {
            Keyboard.dismiss();
            if (cartList?.length > 0) {
              setTimeout(() => {
                navigation.navigate('AddCartScreen');
              }, 80);
            } else {
              showToast(
                'warning',
                'Warning!',
                'Your cart is empty. Please add items before proceeding.',
              );
            }
          }}
        >
          <View style={styles.circleLeft1}>
            <MaterialDesignIcons name="cart" color={Color.WHITE} size={20} />
          </View>
          <Text style={{ color: 'white', fontSize: 16 }}>
            {Number(getPrice()) < 0
              ? `£ -${Math.abs(Number(getPrice())).toFixed(2)}`
              : `£ ${Number(getPrice()).toFixed(2)}`}
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
            <Text style={{ color: 'white', fontSize: 10 }}>
              {cartList?.length} Groups
            </Text>
            <Text style={{ color: 'white', fontSize: 10 }}>
              {getItemCount()} Items
            </Text>
          </View>
        </TouchableOpacity>
        <View
          style={{
            height: 30,
            width: 3,
            backgroundColor: '#D1D1D1',
            borderRadius: 2,
          }}
        />
        <TouchableOpacity
          style={styles.circleRight}
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => {
              navigation.navigate('BarCodeReader');
            }, 80);
          }}
        >
          <View
            style={{
              width: verticalScale(35),
              height: verticalScale(35),
              borderRadius: verticalScale(35),
              backgroundColor: '#B71C1C',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialDesignIcons
              name="barcode-scan"
              color={Color.WHITE}
              size={verticalScale(20)}
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
    height: verticalScale(40),
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
    height: verticalScale(38),
    borderRadius: 50,
    backgroundColor: '#3D3D3D',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  circleLeft1: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
