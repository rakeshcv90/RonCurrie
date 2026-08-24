import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Color, ImageData } from '../../../Component/Image';
import decodeHtml from '../../../utility/decodeHtml';

const OptionRowItem = React.memo(({
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
    <View
      style={[
        styles.tableRow,
        index % 2 !== 0 && styles.greyRow,
      ]}
    >
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
});

const OptionsTable = ({
  productsList,
  selectedTab,
  rowQuantities,
  handleDecrease,
  handleIncrease,
  handleQtyTyping,
  handleFinalQty,
  styles,
}) => {
  const optionValues = productsList?.options?.[0]?.option_values ?? [];

  const renderRow = useCallback(({ item, index }) => {
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
  }, [rowQuantities, selectedTab, handleDecrease, handleIncrease, handleQtyTyping, handleFinalQty, styles]);

  const itemKeyExtractor = useCallback((_item, index) => index.toString(), []);

  return (
    <View style={styles.tableContainer}>
      <View
        style={optionValues.length === 0 ? styles.emptyContentContainer : {}}
      >
        {optionValues.length === 0 ? (
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
        ) : (
          optionValues.map((item, index) => (
            <React.Fragment key={item.id || item.product_option_value_id || index}>
              {renderRow({ item, index })}
            </React.Fragment>
          ))
        )}
      </View>
    </View>
  );
};

export default React.memo(OptionsTable);
