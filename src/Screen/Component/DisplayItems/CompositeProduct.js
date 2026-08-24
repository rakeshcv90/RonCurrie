import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  onLinkedProductChange,
  styles,
}) => {
  const [allSelectedCompositeOptions, setAllSelectedCompositeOptions] =
    useState({});

  // ── Derived values (mirror EposProductPage.jsx logic) ─────────────────────
  const compositeLinks = useMemo(
    () => productsList?.composite_links || [],
    [productsList],
  );

  // Set of option_ids belonging to the shell's own options tree
  const compositeOptionIds = useMemo(
    () => new Set((productsList?.options || []).map(o => o.option_id)),
    [productsList],
  );

  // The composite tree's own display order (Type, then Timber Section, …)
  // — parent → child hierarchy. Mirrors compositeOptionOrder in EposProductPage.jsx.
  const compositeOptionOrder = useMemo(
    () => (productsList?.options || []).map(o => o.option_id),
    [productsList],
  );

  // Resolve exactly one linked_product when all composite picks match
  const linkedProduct = useMemo(() => {
    if (!compositeLinks.length) return null;

    const matches = compositeLinks.filter(
      link =>
        link.options?.length > 0 &&
        link.options.every(o => {
          const sel = allSelectedCompositeOptions[o.option_id];
          return sel && Number(sel.option_value_id) === o.option_value_id;
        }),
    );

    if (matches.length !== 1) return null;
    return matches[0].linked_product || null;
  }, [compositeLinks, allSelectedCompositeOptions]);

  // Per composite option_id, the set of option_value_ids that have at least one
  // active (is_linked: 1) combination consistent with the ANCESTOR composite
  // options already picked. Later ("child") picks never filter an earlier option.
  // Mirrors EposProductPage.jsx exactly.
  const compositeValidValuesByOptionId = useMemo(() => {
    const map = new Map();

    compositeOptionIds.forEach(optionId => {
      const optionIndex = compositeOptionOrder.indexOf(optionId);

      // Only selections from options that appear BEFORE this one (ancestors)
      const ancestorSelections = Object.values(
        allSelectedCompositeOptions,
      ).filter(
        sel =>
          compositeOptionIds.has(sel.option_id) &&
          sel.option_id !== optionId &&
          compositeOptionOrder.indexOf(sel.option_id) < optionIndex,
      );

      const validLinks = compositeLinks.filter(
        link =>
          link.is_linked === 1 &&
          ancestorSelections.every(sel =>
            link.options?.some(
              o =>
                o.option_id === sel.option_id &&
                o.option_value_id === Number(sel.option_value_id),
            ),
          ),
      );

      map.set(
        optionId,
        new Set(
          validLinks
            .flatMap(link => link.options || [])
            .filter(o => o.option_id === optionId)
            .map(o => o.option_value_id),
        ),
      );
    });

    return map;
  }, [
    compositeOptionIds,
    compositeOptionOrder,
    compositeLinks,
    allSelectedCompositeOptions,
  ]);

  // ── Preselect from preselect_options on mount / productsList change ─────────
  useEffect(() => {
    const preselect = productsList?.preselect_options || {};
    const seeded = {};

    (productsList?.options || []).forEach(option => {
      option.option_values?.forEach(val => {
        if (
          String(val.product_option_id) in preselect &&
          String(preselect[val.product_option_id]) ===
            String(val.product_option_value_id)
        ) {
          seeded[option.option_id] = {
            option_id: option.option_id,
            option_value_id: val.option_value_id,
            option_name: option.option_descriptions?.name || null,
            option_value_name: val.option_values_name?.[0]?.name || null,
            product_option_id: val.product_option_id,
            product_option_value_id: val.product_option_value_id,
          };
        }
      });
    });

    setAllSelectedCompositeOptions(seeded);
  }, [productsList]);

  // ── Notify parent whenever linkedProduct or selections change ──────────────
  useEffect(() => {
    onLinkedProductChange?.(linkedProduct);
  }, [linkedProduct, onLinkedProductChange]);

  // ── FlatList data from linkedProduct (empty while unresolved) ─────────────
  const tableOptionValues = useMemo(() => {
    if (!linkedProduct) return [];
    const nonMinorOptions = (linkedProduct?.options || []).filter(
      opt => opt.minor === 0,
    );
    return nonMinorOptions.length > 0
      ? nonMinorOptions[0]?.option_values ?? []
      : [];
  }, [linkedProduct]);

  // ── FlatList render helpers ───────────────────────────────────────────────
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

  const options = productsList?.options || [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={localStyles.outerContainer}>
      {/* ── Composite shell dropdowns ── */}
      {options.map((option, index) => {
        const optionName =
          option?.option_descriptions?.name || `Option ${index + 1}`;

        const validValueIds = compositeValidValuesByOptionId.get(
          option.option_id,
        );

        const dropdownData = (option?.option_values || [])
          .filter(
            val => !validValueIds || validValueIds.has(val.option_value_id),
          )
          .map(item => ({
            label: decodeHtml(
              item?.option_values_name?.[0]?.name || item?.name || 'No Name',
            ),
            value: item?.option_value_id,
            original: item,
          }));

        const currentValue =
          allSelectedCompositeOptions[option?.option_id]?.option_value_id ??
          null;

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
                setAllSelectedCompositeOptions(prev => ({
                  ...prev,
                  [option.option_id]: {
                    option_id: option.option_id,
                    option_value_id: item.value,
                    option_name: option.option_descriptions?.name || null,
                    option_value_name:
                      item.original?.option_values_name?.[0]?.name || null,
                    product_option_id: item.original?.product_option_id,
                    product_option_value_id:
                      item.original?.product_option_value_id,
                  },
                }));
              }}
              renderItem={dropItem => (
                <View style={localStyles.itemContainer}>
                  <Text style={localStyles.itemText}>{dropItem.label}</Text>
                </View>
              )}
            />
          </View>
        );
      })}

      {/* ── Linked-product option name heading — same style as DisplayItems non-composite ── */}
      {linkedProduct?.options?.length > 0 && (
        <View
          style={[
            styles.headerRow,
            { alignItems: 'center', gap: moderateScale(15) },
          ]}
        >
          <Text style={[styles.headerText, { color: '#8B0000', flex: 0 }]}>
            {(
              linkedProduct.options.find(o => o.minor === 0) ??
              linkedProduct.options[0]
            )?.option_descriptions?.name || ''}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: moderateScale(15),
            }}
          >
            {/* {linkedProduct?.model ? (
              <Text
                style={{
                  fontSize: moderateScale(14),
                  fontWeight: '700',
                  color: '#555',
                }}
              >
                Model: {linkedProduct.model}
              </Text>
            ) : null} */}

            {/* {linkedProduct?.options?.[0]?.bespoke_factor_val &&
            parseFloat(linkedProduct.options[0].bespoke_factor_val) > 0 ? (
              <Text
                style={{
                  fontSize: moderateScale(14),
                  fontWeight: '700',
                  color: '#555',
                }}
              >
                £
                {parseFloat(
                  linkedProduct.options[0].bespoke_factor_val,
                ).toFixed(2)}
                /m
              </Text>
            ) : null} */}
          </View>
        </View>
      )}

      {/* ── Options table driven by resolved linkedProduct ── */}
      <View style={styles.tableContainer}>
        <View
          style={
            tableOptionValues.length === 0 ? styles.emptyContentContainer : {}
          }
        >
          {tableOptionValues.length === 0 ? (
            <View style={styles.emptyContainer}>
              {linkedProduct === null ? (
                // Still selecting composite dropdowns — show a hint
                <Text style={styles.emptyText}>
                  Please select all options above
                </Text>
              ) : Platform.OS === 'android' ? (
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
            tableOptionValues.map((item, index) => (
              <React.Fragment
                key={item.id || item.product_option_value_id || index}
              >
                {renderRow({ item, index })}
              </React.Fragment>
            ))
          )}
        </View>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  outerContainer: {
    paddingVertical: moderateScale(0),
  },
  dropdownContainer: {
    marginBottom: moderateScale(15),
    paddingHorizontal: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#8B0000',
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
  optionHeadingContainer: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(4),
  },
  optionHeading: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#555',
  },
});

export default CompositeProduct;
