import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Color, ImageData } from '../../../Component/Image';
import decodeHtml from '../../../utility/decodeHtml';
import { getStockColorHex, getStockColorTextHex } from '../../../utility/Color';

const OptionRowItem = React.memo(
  ({
    item,
    index,
    qty,
    selectedTab,
    showTotalStock,
    handleDecrease,
    handleIncrease,
    handleQtyTyping,
    handleFinalQty,
    styles,
  }) => {
    const inStock = item?.quantity ?? 0;
    const hasStockRule =
      item?.stock_rule_linked === true ||
      item?.stock_rule_linked === 1 ||
      item?.stock_rule_linked === 'true' ||
      item?.stock_rule_linked === '1';
    const hasAvailableQty =
      item?.available_quantity !== null &&
      item?.available_quantity !== undefined &&
      item?.available_quantity !== '';
    const showDetailedStock = showTotalStock && hasStockRule && hasAvailableQty;

    // Depend on A quantity if available (stock_rule_linked + available_quantity), otherwise depend on P quantity (item.quantity)
    const effectiveStock =
      hasStockRule && hasAvailableQty
        ? Number(item?.available_quantity) || 0
        : Number(item?.quantity) || 0;

    const isDisabled = effectiveStock === 0 && selectedTab === 'Sales';

    return (
      <View style={[styles.tableRow, index % 2 !== 0 && styles.greyRow]}>
        <View style={styles.sizeCell}>
          <Text style={styles.cellText}>
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

        <View
          style={[
            styles.stockCell,
            item?.physical_colour && getStockColorHex(item.physical_colour)
              ? { backgroundColor: getStockColorHex(item.physical_colour) }
              : null,
          ]}
        >
          {showDetailedStock && inStock !== item?.available_quantity ? (
            <View style={styles.detailedStockContainer}>
              <View style={styles.stockSubRow}>
                <Text
                  style={[
                    styles.stockText,
                    styles.stockTextSmall,
                    inStock === 0 ? styles.redQty : styles.blackQty,
                    item?.physical_colour &&
                    getStockColorTextHex(item.physical_colour)
                      ? { color: getStockColorTextHex(item.physical_colour) }
                      : null,
                  ]}
                >
                  P: {inStock}
                </Text>
              </View>
              <View style={styles.stockDivider} />
              <View style={styles.stockSubRow}>
                <Text
                  style={[
                    styles.stockText,
                    styles.stockTextSmall,
                    styles.blackQty,
                    item?.physical_colour &&
                    getStockColorTextHex(item.physical_colour)
                      ? { color: getStockColorTextHex(item.physical_colour) }
                      : null,
                  ]}
                >
                  A: {item?.available_quantity}
                </Text>
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.stockText,
                inStock === 0 ? styles.redQty : styles.blackQty,
                item?.physical_colour &&
                getStockColorTextHex(item.physical_colour)
                  ? { color: getStockColorTextHex(item.physical_colour) }
                  : null,
              ]}
            >
              {inStock}
            </Text>
          )}
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
          {effectiveStock === 0 && selectedTab === 'Sales' ? (
            <Text style={styles.nsText}>NS</Text>
          ) : (
            <TextInput
              style={styles.qtyInput}
              value={String(qty)}
              keyboardType="numeric"
              onChangeText={v => handleQtyTyping(index, v)}
              onEndEditing={() => handleFinalQty(index, effectiveStock)}
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
            onPress={() => handleIncrease(index, effectiveStock)}
          >
            <Text style={styles.iconSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const OptionsTable = ({
  productsList,
  selectedTab,
  rowQuantities,
  handleDecrease,
  handleIncrease,
  handleQtyTyping,
  handleFinalQty,
  handleSingleTyping,
  handleSingleFinal,
  styles,
  showTotalStock,
}) => {
  const optionValues = productsList?.options?.[0]?.option_values ?? [];
  const hasDirectAdd =
    productsList?.direct_add_available === true ||
    productsList?.direct_add_available === 1 ||
    productsList?.direct_add_available === 'true' ||
    productsList?.direct_add_available === '1';

  const isBespoke =
    productsList?.options?.[0]?.display === 1 &&
    productsList?.options?.[0]?.bespoke_value_req_epos === 1;

  if (isBespoke && optionValues.length === 0 && !hasDirectAdd) {
    return null;
  }

  const parentStock =
    Number(productsList?.available_quantity ?? productsList?.quantity ?? 0) ||
    0;
  const isParentDisabled = parentStock === 0 && selectedTab === 'Sales';

  const renderRow = useCallback(
    ({ item, index }) => {
      const qty = rowQuantities[index] ?? 0;
      const rowIndex = hasDirectAdd ? index + 1 : index;
      return (
        <OptionRowItem
          item={item}
          index={rowIndex}
          qty={qty}
          selectedTab={selectedTab}
          showTotalStock={showTotalStock}
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
      showTotalStock,
      hasDirectAdd,
      handleDecrease,
      handleIncrease,
      handleQtyTyping,
      handleFinalQty,
      styles,
    ],
  );

  const itemKeyExtractor = useCallback((_item, index) => index.toString(), []);

  return (
    <View style={styles.tableContainer}>
      <View
        style={
          optionValues.length === 0 && !hasDirectAdd
            ? styles.emptyContentContainer
            : {}
        }
      >
        {/* Extra Top Row for Direct Add (Parent Product) */}
        {hasDirectAdd && (
          <View style={[styles.tableRow, { backgroundColor: '#fff' }]}>
            {/* NAME */}
            <View style={styles.sizeCell}>
              <Text style={styles.cellText}>
                {decodeHtml(
                  productsList?.isbn ||
                    productsList?.name ||
                    productsList?.sku ||
                    productsList?.model ||
                    '',
                )}
              </Text>
            </View>

            {/* PRICE */}
            <View style={styles.priceCell}>
              <Text style={styles.cellText}>
                {parseFloat(productsList?.price ?? 0) === 0
                  ? ''
                  : `£${parseFloat(productsList?.price).toFixed(2)}`}
              </Text>
            </View>

            {/* STOCK */}
            <View style={styles.stockCell}>
              <Text
                style={[
                  styles.stockText,
                  parentStock === 0 ? styles.redQty : styles.blackQty,
                ]}
              >
                {parentStock}
              </Text>
            </View>

            {/* MINUS BUTTON */}
            <View style={styles.iconCell}>
              <TouchableOpacity
                disabled={isParentDisabled}
                style={[
                  styles.iconContainer,
                  isParentDisabled
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
              {parentStock === 0 && selectedTab === 'Sales' ? (
                <Text style={styles.nsText}>NS</Text>
              ) : (
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={(rowQuantities.single?.qty ?? 0).toString()}
                  onChangeText={v => handleSingleTyping?.(v)}
                  onEndEditing={() => handleSingleFinal?.(parentStock)}
                  maxLength={4}
                />
              )}
            </View>

            {/* PLUS BUTTON */}
            <View style={styles.iconCell}>
              <TouchableOpacity
                disabled={isParentDisabled}
                style={[
                  styles.iconContainer,
                  isParentDisabled
                    ? styles.iconDisabled
                    : [styles.iconActive, { backgroundColor: Color.GREEN2 }],
                ]}
                onPress={() => handleIncrease('single', parentStock)}
              >
                <Text style={styles.iconSymbol}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {optionValues.length === 0 && !hasDirectAdd ? (
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
            <React.Fragment
              key={item.id || item.product_option_value_id || index}
            >
              {renderRow({ item, index })}
            </React.Fragment>
          ))
        )}
      </View>
    </View>
  );
};

export default React.memo(OptionsTable);
