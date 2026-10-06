/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Color } from '../../../Component/Image';
import decodeHtml from '../../../utility/decodeHtml';
import { getStockColorHex, getStockColorTextHex } from '../../../utility/Color';

const SingleItemTable = ({
  productsList,
  selectedTab,
  rowQuantities,
  handleDecrease,
  handleIncrease,
  handleSingleTyping,
  handleSingleFinal,
  styles,
  showTotalStock,
}) => {
  const quantity = productsList?.quantity ?? 0;
  const hasStockRule =
    productsList?.stock_rule_linked === true ||
    productsList?.stock_rule_linked === 1 ||
    productsList?.stock_rule_linked === 'true' ||
    productsList?.stock_rule_linked === '1';
  const hasAvailableQty =
    productsList?.available_quantity !== null &&
    productsList?.available_quantity !== undefined &&
    productsList?.available_quantity !== '';
  const showDetailedStock = showTotalStock && hasStockRule && hasAvailableQty;

  const effectiveStock =
    hasStockRule && hasAvailableQty
      ? Number(productsList?.available_quantity) || 0
      : Number(productsList?.quantity) || 0;

  const isDisabled = effectiveStock === 0 && selectedTab === 'Sales';

  return (
    <View style={styles.tableContainer}>
      <View
        style={[styles.tableRow, styles.greyRow, { backgroundColor: '#fff' }]}
      >
        {/* NAME / SKU */}
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

        <View style={styles.priceCell}>
          <Text style={[styles.cellText, styles.priceLink]}>
            £{parseFloat(productsList?.price ?? 0).toFixed(2)}
          </Text>
        </View>

        {/* STOCK */}
        <View
          style={[
            styles.stockCell,
            productsList?.physical_colour &&
            getStockColorHex(productsList.physical_colour)
              ? {
                  backgroundColor: getStockColorHex(
                    productsList.physical_colour,
                  ),
                }
              : null,
          ]}
        >
          {showDetailedStock &&
          quantity !== productsList?.available_quantity ? (
            <View style={styles.detailedStockContainer}>
              <View style={styles.stockSubRow}>
                <Text
                  style={[
                    styles.stockText,
                    styles.stockTextSmall,
                    quantity === 0 ? styles.redQty : styles.blackQty,
                    productsList?.physical_colour &&
                    getStockColorTextHex(productsList.physical_colour)
                      ? {
                          color: getStockColorTextHex(
                            productsList.physical_colour,
                          ),
                        }
                      : null,
                  ]}
                >
                  P: {quantity}
                </Text>
              </View>
              <View style={styles.stockDivider} />
              <View style={styles.stockSubRow}>
                <Text
                  style={[
                    styles.stockText,
                    styles.stockTextSmall,
                    styles.blackQty,
                    productsList?.physical_colour &&
                    getStockColorTextHex(productsList.physical_colour)
                      ? {
                          color: getStockColorTextHex(
                            productsList.physical_colour,
                          ),
                        }
                      : null,
                  ]}
                >
                  A: {productsList?.available_quantity}
                </Text>
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.stockText,
                quantity === 0 ? styles.redQty : styles.blackQty,
                productsList?.physical_colour &&
                getStockColorTextHex(productsList.physical_colour)
                  ? {
                      color: getStockColorTextHex(productsList.physical_colour),
                    }
                  : null,
              ]}
            >
              {quantity}
            </Text>
          )}
        </View>

        {/* MINUS BUTTON */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={isDisabled}
            style={[
              styles.iconContainer,
              isDisabled
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
          {effectiveStock === 0 && selectedTab === 'Sales' ? (
            <Text style={styles.nsText}>NS</Text>
          ) : (
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={(rowQuantities.single?.qty ?? 0).toString()}
              onChangeText={v => handleSingleTyping(v)}
              onEndEditing={() => handleSingleFinal(effectiveStock)}
              maxLength={4}
            />
          )}
        </View>

        {/* PLUS BUTTON */}
        <View style={styles.iconCell}>
          <TouchableOpacity
            disabled={isDisabled}
            style={[
              styles.iconContainer,
              isDisabled
                ? styles.iconDisabled
                : [styles.iconActive, { backgroundColor: Color.GREEN2 }],
            ]}
            onPress={() => handleIncrease('single', effectiveStock)}
          >
            <Text style={styles.iconSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(SingleItemTable);
