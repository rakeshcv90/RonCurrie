import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../../../Component/Image';
import decodeHtml from '../../../utility/decodeHtml';
import FastImage from 'react-native-fast-image';

const OptionRowItem = React.memo(
  ({
    item,
    index,
    qty,
    selectedTab,
    handleDecrease,
    handleIncrease,
    handleQtyTyping,
    handleFinalQty,
    styles,
  }) => {
    const inStock = item?.quantity ?? 0;
    const isDisabled = inStock === 0 && selectedTab === 'Sales';

    return (
      <View style={[styles.tableRow, index % 2 !== 0 && styles.greyRow]}>
        <View style={styles.sizeCell}>
          <Text style={styles.cellText} numberOfLines={2}>
            {decodeHtml(item?.option_values_name?.[0]?.name)}
          </Text>
        </View>

        <View style={styles.priceCell}>
          <Text style={styles.cellText}>
            {parseFloat(item?.price ?? 0) === 0
              ? ''
              : `£${parseFloat(item?.price).toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.stockCell}>
          <Text
            style={[
              styles.stockText,
              inStock === 0 ? styles.redQty : styles.blackQty,
            ]}
          >
            {inStock}
          </Text>
        </View>

        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={isDisabled}
            style={[
              styles.iconContainer,
              isDisabled
                ? styles.iconDisabled
                : [styles.iconActive, { backgroundColor: Color.RED }],
            ]}
            onPress={() => handleDecrease(index)}
          >
            <Text style={styles.iconSymbol}>−</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qtyCellFixed}>
          {inStock === 0 && selectedTab === 'Sales' ? (
            <Text style={styles.nsText}>NS</Text>
          ) : (
            <TextInput
              style={styles.qtyInput}
              value={String(qty)}
              keyboardType="numeric"
              onChangeText={v => handleQtyTyping(index, v)}
              onEndEditing={() => handleFinalQty(index, inStock)}
            />
          )}
        </View>

        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={isDisabled}
            style={[
              styles.iconContainer,
              isDisabled
                ? styles.iconDisabled
                : [styles.iconActive, { backgroundColor: Color.GREEN2 }],
            ]}
            onPress={() => handleIncrease(index, inStock)}
          >
            <Text style={styles.iconSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
const CompositeProduct = ({
  productsList,
  selectedTab,
  rowQuantities,
  handleDecrease,
  handleIncrease,
  handleQtyTyping,
  handleFinalQty,
  styles,
}) => {
  const [selectedValues, setSelectedValues] = useState({});
  console.log('ItemDataproductsList', productsList);
  const options = productsList?.options || [];
  const optionValues = productsList?.options?.[0]?.option_values ?? [];
  const renderRow = useCallback(
    ({ item, index }) => {
      const qty = rowQuantities[index] ?? 0;
      return (
        <OptionRowItem
          item={item}
          index={index}
          qty={qty}
          selectedTab={selectedTab}
          handleDecrease={handleDecrease}
          handleIncrease={handleIncrease}
          handleQtyTyping={handleQtyTyping}
          handleFinalQty={handleFinalQty}
          styles={styles}
        />
      );
    },
    [
      rowQuantities,
      selectedTab,
      handleDecrease,
      handleIncrease,
      handleQtyTyping,
      handleFinalQty,
      styles,
    ],
  );

  const itemKeyExtractor = useCallback((_item, index) => index.toString(), []);
  return (
    <View style={localStyles.container}>
      {options.map((option, index) => {
        const optionName =
          option?.option_descriptions?.name || `Option ${index + 1}`;

        const optionValues1 = option?.option_values || [];

        console.log(
          `Dropdown [${optionName}] optionValues length:`,
          optionValues1.length,
        );

        const dropdownData = optionValues1.map(item => ({
          label: decodeHtml(
            item?.option_values_name?.[0]?.name || item?.name || 'No Name',
          ),
          value: item?.option_value_id || item?.id || Math.random().toString(),
          original: item,
        }));

        console.log(`Dropdown [${optionName}] dropdownData:`, dropdownData);

        const currentValue = selectedValues[option?.product_option_id];

        const renderItem = item => {
          return (
            <View style={localStyles.itemContainer}>
              <Text style={localStyles.itemText}>{item.label}</Text>
            </View>
          );
        };

        return (
          <View
            key={option?.product_option_id || index}
            style={localStyles.dropdownContainer}
          >
            <Text style={localStyles.label}>{optionName}</Text>
            <Dropdown
              style={localStyles.dropdown}
              placeholderStyle={localStyles.placeholderStyle}
              selectedTextStyle={localStyles.selectedTextStyle}
              iconStyle={localStyles.iconStyle}
              data={dropdownData}
              maxHeight={verticalScale(150)}
              labelField="label"
              valueField="value"
              placeholder={`Select ${optionName}`}
              value={currentValue}
              onChange={item => {
                setSelectedValues(prev => ({
                  ...prev,
                  [option?.product_option_id]: item.value,
                }));
              }}
              renderItem={renderItem}
            />
          </View>
        );
      })}
      <View style={styles.tableContainer}>
        <FlatList
          data={optionValues}
          keyExtractor={itemKeyExtractor}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {Platform.OS === 'android' ? (
                <FastImage
                  source={ImageData.NoData}
                  style={styles.gif}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ) : (
                <Text style={styles.emptyText}>No items available</Text>
              )}
            </View>
          }
          contentContainerStyle={
            optionValues.length === 0 ? styles.emptyContentContainer : {}
          }
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(0),
  },
  dropdownContainer: {
    marginBottom: moderateScale(15),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#8B0000', // Dark red color matching the image
    marginBottom: moderateScale(6),
  },
  dropdown: {
    height: verticalScale(35),
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: moderateScale(8),
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: moderateScale(14),
    color: '#555',
  },
  selectedTextStyle: {
    fontSize: moderateScale(14),
    color: '#333',
  },
  iconStyle: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  itemContainer: {
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(8),
    height: verticalScale(35),
    justifyContent: 'center',
  },
  itemText: {
    fontSize: moderateScale(14),
    color: '#333',
  },
  tableContainer1: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: 2,
    overflow: 'hidden', // important for clean edges

    margin: 0,
  },
});

export default CompositeProduct;
