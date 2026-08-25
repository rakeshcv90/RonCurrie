import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Color from '../../../Theme/Color';
import { FONT } from '../../../Theme/Font';

const CartOrderSummary = ({ deliveryType, totalPrice }) => {
  if (!deliveryType) return null;

  const getTotal = (price, price2) => {
    const cleanPrice2 = Number(price2?.replace('£', '') || 0);
    const cleanPrice = Number(price);
    const total = cleanPrice + cleanPrice2;
    return total.toFixed(2);
  };

  return (
    <>
      <View style={styles.summaryBox}>
        <View style={styles.row}>
          <Text style={styles.label}>Sub-Total:</Text>
          <Text style={styles.value}>£{totalPrice}</Text>
        </View>
        <View style={styles.row}>
          <View style={{ width: 200 }}>
            <Text numberOfLines={1} style={styles.label}>
              Local Date {deliveryType?.name}:
            </Text>
          </View>
          <Text style={styles.value}>{deliveryType?.price}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rowCentered}>
          <Text style={styles.label}>Preferred Date:</Text>
          <Text style={styles.value}>{deliveryType?.date}</Text>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>
          £{getTotal(totalPrice, deliveryType?.price)}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  summaryBox: {
    width: '100%',
    height: moderateScale(116),
    backgroundColor: Color.GRAY3,
    borderRadius: moderateScale(4),
    alignItems: 'center',
    marginVertical: moderateScale(16),
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  rowCentered: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    color: Color.GRAY,
    fontFamily: FONT.BOLD,
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    color: Color.BLACK,
    fontFamily: FONT.BOLD,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Color.GRAY5,
    marginTop: 10,
  },
  totalContainer: {
    width: '100%',
    height: moderateScale(60),
    backgroundColor: Color.WHITE,
    borderTopWidth: 1,
    borderTopColor: Color.GRAY3,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    flexDirection: 'row',
    marginBottom: moderateScale(20),
  },
  totalLabel: {
    color: Color.BLACK,
    fontFamily: FONT.BOLD,
    fontSize: 20,
    lineHeight: 24,
  },
  totalValue: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: 20,
    lineHeight: 24,
  },
});

export default CartOrderSummary;
