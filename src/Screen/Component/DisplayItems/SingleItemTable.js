/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Color } from '../../../Component/Image';

const SingleItemTable = ({
  productsList,
  rowQuantities,
  handleDecrease,
  handleIncrease,
  handleSingleTyping,
  handleSingleFinal,
  styles,
}) => {
  const quantity = productsList?.quantity ?? 0;

  return (
    <View style={styles.tableContainer}>
      <View
        style={[
          styles.tableRow,
          styles.greyRow,
          { backgroundColor: '#fff' },
        ]}
      >
        {/* NAME / SKU */}
        <View style={styles.sizeCell}>
          <Text style={styles.cellText}>
            {productsList?.sku ? productsList?.sku : productsList?.model}
          </Text>
        </View>

        <View style={styles.priceCell}>
          <Text style={[styles.cellText, styles.priceLink]}>
            £{parseFloat(productsList?.price ?? 0).toFixed(2)}
          </Text>
        </View>

        {/* STOCK */}
        <View style={styles.stockCell}>
          <Text
            style={[
              styles.stockText,
              quantity === 0 ? styles.redQty : styles.blackQty,
            ]}
          >
            {quantity}
          </Text>
        </View>

        {/* MINUS BUTTON */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={quantity === 0}
            style={[
              styles.iconContainer,
              quantity === 0
                ? styles.iconDisabled
                : [styles.iconActive, { backgroundColor: Color.RED }],
            ]}
            onPress={() => handleDecrease('single')}
          >
            <Text style={styles.iconSymbol}>−</Text>
          </TouchableOpacity>
        </View>

        {/* QTY / NS */}
        <View style={styles.qtyCellFixed}>
          {quantity === 0 ? (
            <Text style={[styles.qtyText, styles.nsText]}>NS</Text>
          ) : (
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={(rowQuantities.single?.qty ?? 0).toString()}
              onChangeText={v => handleSingleTyping(v)}
              onEndEditing={() => handleSingleFinal(quantity)}
              maxLength={4}
            />
          )}
        </View>

        {/* PLUS BUTTON */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={quantity === 0}
            style={[
              styles.iconContainer,
              quantity === 0
                ? styles.iconDisabled
                : [styles.iconActive, { backgroundColor: Color.GREEN2 }],
            ]}
            onPress={() => handleIncrease('single', quantity)}
          >
            <Text style={styles.iconSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(SingleItemTable);
