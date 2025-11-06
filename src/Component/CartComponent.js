import { View, Text, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import { ScaledSheet, moderateScale } from 'react-native-size-matters';

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Color } from './Image';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MMKVStorage } from '../utility/MmkvStore';
import {
  clearcartProducts,
  fetchCartData,
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
        if (firstValue && firstValue.includes('#')) {
          const parts = firstValue.split('#');

          customOptionPrice = Number(parts[2]) || 0;
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;

          customOptionPrice = Number(price) * cart_quantity || 0;
        }
      }
      // Case 2: parsedOption is array (like [])
      else if (Array.isArray(parsedOption) && parsedOption.length === 0) {
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
  const getPrice = () => {
    if (!cartList || cartList?.length === 0) return '0.00';
    const subTotal = cartList?.reduce((sum, item) => {
      const price = calculateMatrixPrice(item);

      return sum + price;
    }, 0);

    return subTotal?.toFixed(2);
  };
  const getItemCount = () => {
    const subTotal = cartList?.reduce(
      (sum, item) => sum + item?.cart_quantity,
      0,
    );

    return subTotal.toFixed(2);
  };
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.circleLeft}
          onPress={() => {
            if (cartList?.length > 0) {
              navigation.navigate('AddCartScreen');
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
          <Text style={{ color: 'white', fontSize: 16 }}>£ {getPrice()}</Text>
          <View
            style={{
              height: 20,
              width: 2,
              backgroundColor: Color.GRAY,
              borderRadius: 2,
            }}
          />
          <View>
            <Text style={{ color: 'white', fontSize: 10 }}>
              {getItemCount()}
            </Text>
            <Text style={{ color: 'white', fontSize: 10 }}>
              ITEMS ({cartList?.length})
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
            navigation.navigate('BarCodeReader');
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#B71C1C', // red
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialDesignIcons
              name="barcode-scan"
              color={Color.WHITE}
              size={25}
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
    width: '75%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: Color.WHITE,
    borderRadius: 40,
    // overflow: 'hidden',
    elevation: 5,
    left: '12.5%',
    alignItems: 'center',
    padding: '5@ms',
    gap: 5,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  circleLeft: {
    width: '75%',
    height: 45,
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
    width: '20%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CartComponent;
