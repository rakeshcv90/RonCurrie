/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Color } from '../../../Component/Image';
import { verticalScale } from 'react-native-size-matters';
import { showToast } from '../../../utility/showToast';

const BespokeCalculator = ({
  customLength,
  productsList,
  rowQuantities,
  bespokeFactor,
  handleCustomLengthChange,
  handleDecrease,
  handleIncrease,
  handleCustomTyping,
  handleCustomFinal,
  styles,
}) => {
  return (
    <View style={[styles.tableContainer, { top: verticalScale(-10) }]}>
      <View
        style={[styles.tableRow, styles.greyRow, { backgroundColor: '#fff' }]}
      >
        {/* LENGTH */}
        <View style={styles.sizeCell}>
          <TextInput
            style={[styles.qtyInput, { width: '100%', textAlign: 'left' }]}
            placeholder="Length"
            value={customLength}
            onChangeText={val =>
              handleCustomLengthChange(val, productsList?.quantity)
            }
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* PRICE */}
        <View style={styles.priceCell}>
          <Text style={[styles.cellText, styles.priceLink]}>
            £
            {customLength === ''
              ? '0.00'
              : rowQuantities?.custom?.price ?? bespokeFactor.toFixed(2)}
          </Text>
        </View>

        {/* STOCK / CALCULATED PRICE */}
        <View style={styles.stockCell}>
          <Text style={[styles.stockText, styles.blackQty]}>-</Text>
        </View>

        {/* MINUS */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              customLength === '' ? styles.iconDisabled : styles.iconActive,
              customLength === '' ? {} : { backgroundColor: Color.RED },
            ]}
            onPress={() => {
              if (customLength !== '') {
                handleDecrease('custom');
              } else {
                showToast(
                  'danger',
                  'No items selected',
                  'Please enter length for custom item',
                );
              }
            }}
          >
            <Text style={styles.iconSymbol}>−</Text>
          </TouchableOpacity>
        </View>

        {/* QTY */}
        <View style={styles.qtyCellFixed}>
          <TextInput
            style={[
              styles.qtyInput,
              customLength === '' ? { color: '#aaa' } : {},
            ]}
            keyboardType="numeric"
            value={(rowQuantities.custom?.qty ?? 0).toString()}
            editable={customLength !== ''}
            onChangeText={text => {
              if (customLength !== '') {
                handleCustomTyping(text);
              } else {
                showToast(
                  'danger',
                  'No items selected',
                  'Please enter length for custom item',
                );
              }
            }}
            onEndEditing={() => {
              if (customLength !== '') {
                handleCustomFinal();
              }
            }}
          />
        </View>

        {/* PLUS */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              customLength === '' ? styles.iconDisabled : styles.iconActive,
              customLength === '' ? {} : { backgroundColor: Color.GREEN2 },
            ]}
            onPress={() => {
              if (customLength !== '') {
                handleIncrease('custom');
              } else {
                showToast(
                  'danger',
                  'No items selected',
                  'Please enter length for custom item',
                );
              }
            }}
          >
            <Text style={styles.iconSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(BespokeCalculator);
