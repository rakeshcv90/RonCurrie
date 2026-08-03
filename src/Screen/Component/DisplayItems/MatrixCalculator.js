/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Color } from '../../../Component/Image';
import { verticalScale } from 'react-native-size-matters';

const windowHeight = Dimensions.get('window').height;

const MatrixCalculator = ({
  width,
  setWidth,
  length,
  setLength,
  quantity,
  setQuantity,
  price,
  calculatePrice,
  styles,
}) => {
  return (
    <View style={styles.container1}>
      <View
        style={[
          styles.labelRow,
          {
            gap:
              windowHeight > 1100
                ? verticalScale(100)
                : verticalScale(25),
          },
        ]}
      >
        <Text style={styles.redLabel}>Width (mm)</Text>
        <Text style={styles.redLabel}>Height(mm)</Text>
      </View>

      <View style={styles.bigBoxRow}>
        {/* Width */}
        <TextInput
          style={[
            styles.boxInput,
            { textAlign: width ? 'center' : 'left' },
          ]}
          placeholder="Width"
          keyboardType="numeric"
          value={width}
          onChangeText={setWidth}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Length */}
        <TextInput
          style={[
            styles.boxInput,
            { textAlign: length ? 'center' : 'left' },
          ]}
          placeholder="Length"
          keyboardType="numeric"
          value={length}
          selection={length ? undefined : { start: 0, end: 0 }}
          onChangeText={setLength}
        />

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.iconBtn}>
          <TouchableOpacity
            style={[styles.buttonBox, { backgroundColor: Color.RED }]}
            onPress={() => {
              setQuantity(prev => Math.max(1, Number(prev || 1) - 1));
            }}
          >
            <Text style={styles.iconText}>−</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.qtyBox}>
          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            value={String(quantity)}
            onChangeText={text => {
              if (text === '') {
                setQuantity('');
                return;
              }
              const num = Number(text);
              if (isNaN(num)) return;
              setQuantity(num);
            }}
            onEndEditing={() => {
              if (quantity === '') setQuantity(1);
            }}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.iconBtn}>
          <TouchableOpacity
            style={[styles.buttonBox, { backgroundColor: Color.GREEN2 }]}
            onPress={() => {
              setQuantity(Number(quantity || 1) + 1);
              calculatePrice();
            }}
          >
            <Text style={styles.iconText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow1}>
        <TouchableOpacity
          style={styles.calcButton1}
          onPress={calculatePrice}
        >
          <Text style={styles.calcText1}>Calculate Price</Text>
        </TouchableOpacity>

        <View style={styles.priceContainer1}>
          <Text style={styles.priceLine1}>
            Price: <Text style={styles.priceValue1}>£{price}</Text>
          </Text>
          <Text style={styles.vatText1}>inc VAT</Text>
        </View>
      </View>
    </View>
  );
};

export default React.memo(MatrixCalculator);
