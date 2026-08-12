/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useDispatch, useSelector } from 'react-redux';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  clearProducts,
  fetchProductsList,
} from '../Redux/Slice/ProductListSlice';
import { Api, ImageBaseUrl } from '../utility/api';
import ProductModal from './Component/ProductModal';
import ProductHeader from './Component/DisplayItems/ProductHeader';
import ActionButtons from './Component/DisplayItems/ActionButtons';
import SingleItemTable from './Component/DisplayItems/SingleItemTable';
import BespokeCalculator from './Component/DisplayItems/BespokeCalculator';
import OptionsTable from './Component/DisplayItems/OptionsTable';
import MatrixCalculator from './Component/DisplayItems/MatrixCalculator';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { postData } from '../utility/ApiCall';
import { MMKVStorage } from '../utility/MmkvStore';
import FastImage from 'react-native-fast-image';
import CartComponent from '../Component/CartComponent';
import {
  triggerCartRefresh,
  triggerMiscRefresh,
} from '../Redux/Slice/CartDataShowSlice';
import SearchComponent from './Component/SearchComponent';
import { Dropdown } from 'react-native-element-dropdown';
import decodeHtml from '../utility/decodeHtml';
import CompositeProduct from './Component/DisplayItems/CompositeProduct';

const DisplayItems = ({ navigation, route }) => {
  const ItemData = route.params.itemData;

  const dispatch = useDispatch();
  const { productsList, loading } = useSelector(state => state.productsList);
  console.log('ItemDataproductsList', productsList);
  const [selectedTab, setSelectedTab] = useState('Sales');
  const [customLength, setCustomLength] = useState('');
  const [visibleModal, setVisibleModaL] = useState(false);
  const [rowQuantities, setRowQuantities] = useState({});
  const [userData, setUserData] = useState(null);
  const [width, setWidth] = useState(null);
  const [length, setLength] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(null);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const loadingMore = false;
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [payload, setPayload] = useState(null);
  const [matchedMatrix, setMatchedMatrix] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const searchRef = useRef(null);
  const [value, setValue] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  useEffect(() => {
    if (quantity >= 1 && width && length && productsList?.matrix?.length > 0) {
      calculatePrice();
    }
  }, [quantity, width, length, productsList]);
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }, [isFirstLoad]),
  );
  useEffect(() => {
    if (userData && ItemData) {
      setPayload({
        customer_id: userData?.customer_id || 0,
        customer_name: userData?.firstname + '' + userData?.lastname,
        product_id: ItemData?.product_id || ItemData?.id,
        epos_user: userData?.epos_user || '',
        customer_email: userData?.email || '',
        is_logged: 1,
        from_app: 1,
      });
    }
  }, [userData, ItemData]);
  const bespokeFactor =
    Number(productsList?.options?.[0]?.bespoke_factor_val) || 0;

  useEffect(() => {
    const fetchUserData = async () => {
      // dispatch(clearProducts());
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };

    fetchUserData();
  }, []);
  useFocusEffect(
    useCallback(() => {
      dispatch(clearProducts());
      // dispatch(fetchProductsList(ItemData?.slug));
      dispatch(
        fetchProductsList({
          slug: ItemData?.slug,
          clicked_product_id:
            ItemData?.clicked_product_id || ItemData?.product_id,
        }),
      );
      // dispatch(
      //   fetchProductsList('made-to-measure-solid-boarded-garage-doors-pair'),
      // );
      return () => {
        dispatch(clearProducts());
      };
    }, [dispatch, ItemData]),
  );

  useEffect(() => {
    if (Array.isArray(productsList?.matrix) && productsList.matrix.length > 0) {
      const minW = Math.min(
        ...productsList.matrix.map(item => item?.width || Infinity),
      );
      const minH = Math.min(
        ...productsList.matrix.map(item => item?.height || Infinity),
      );
      const lowestItem = productsList?.matrix.find(
        item => item.width === minW && item.height === minH,
      );
      setWidth(String(minW));
      setLength(String(minH));
      setPrice(String(lowestItem?.price || '0.00'));
    }
  }, [productsList]);

  const handleIncrease = useCallback(
    (index, stock = 0) => {
      setRowQuantities(prev => {
        if (index === 'custom') {
          if (customLength === '') return prev;
          const qty = (prev.custom?.qty || 0) + 1;
          const customLen = Number(customLength) || 1;
          const computedPrice = (customLen * bespokeFactor * qty).toFixed(2);
          const price2 = (customLen * bespokeFactor).toFixed(2);

          return {
            ...prev,
            custom: { qty, length: customLen, price: computedPrice, price2 },
          };
        } else if (index === 'single') {
          const qty =
            selectedTab === 'Sales'
              ? Math.min((prev.single?.qty || 0) + 1, stock)
              : (prev.single?.qty || 0) + 1;

          return { ...prev, single: { qty } };
        } else {
          const qty =
            selectedTab === 'Sales'
              ? Math.min((prev[index] || 0) + 1, stock) // stock check
              : (prev[index] || 0) + 1; // ignore stock

          return { ...prev, [index]: qty };
        }
      });
    },
    [selectedTab, bespokeFactor, customLength],
  );

  const handleDecrease = index => {
    setRowQuantities(prev => {
      if (index === 'custom') {
        if (customLength === '') return prev;
        const qty = Math.max((prev.custom?.qty || 0) - 1, 0);
        const customLen = Number(customLength) || 1;
        const computedPrice = (customLen * bespokeFactor * qty).toFixed(2);
        const price2 = (customLen * bespokeFactor).toFixed(2);

        return {
          ...prev,
          custom: { qty, length: customLen, price: computedPrice, price2 },
        };
      } else if (index === 'single') {
        const qty = Math.max((prev.single?.qty || 0) - 1, 0);
        return { ...prev, single: { qty } };
      } else {
        const qty = Math.max((prev[index] || 0) - 1, 0);

        return { ...prev, [index]: qty };
      }
    });
  };

  const handleCustomLengthChange = val => {
    setCustomLength(val);

    if (val === '') {
      setRowQuantities(prev => {
        return {
          ...prev,
          custom: { qty: 0, length: 0, price: '0.00', price2: '0.00' },
        };
      });
      return;
    }

    const lengthNum = parseFloat(val) || 0;

    setRowQuantities(prev => {
      const qty = prev.custom?.qty || 1;
      const computedPrice = (lengthNum * bespokeFactor * qty).toFixed(2);
      const price2 = (lengthNum * bespokeFactor).toFixed(2);
      return {
        ...prev,
        custom: { qty, length: lengthNum, price: computedPrice, price2 },
      };
    });
  };

  const handleQtyTyping = (index, text) => {
    setRowQuantities(prev => ({
      ...prev,
      [index]: text,
    }));
  };

  const handleFinalQty = (index, stock) => {
    const raw = rowQuantities[index];

    let num = parseInt(raw, 10);
    if (isNaN(num) || num <= 0) num = 1;
    if (num > stock) num = stock;

    setRowQuantities(prev => ({
      ...prev,
      [index]: num,
    }));
  };
  const handleSingleTyping = text => {
    setRowQuantities(prev => ({
      ...prev,
      single: { qty: text },
    }));
  };

  const handleSingleFinal = stock => {
    let raw = rowQuantities.single?.qty;

    let num = parseInt(raw, 10);
    if (isNaN(num) || num <= 0) num = 1;
    if (num > stock) num = stock;

    setRowQuantities(prev => ({
      ...prev,
      single: { qty: num },
    }));
  };
  const handleCustomTyping = text => {
    setRowQuantities(prev => ({
      ...prev,
      custom: { qty: text },
    }));
  };

  const handleCustomFinal = () => {
    let raw = rowQuantities.custom?.qty;

    let qty = parseInt(raw, 10);
    if (isNaN(qty) || qty <= 0) qty = 1;

    const customLen = Number(customLength) || 1;
    const computedPrice = (customLen * bespokeFactor * qty).toFixed(2);
    const price2 = (customLen * bespokeFactor).toFixed(2);

    setRowQuantities(prev => ({
      ...prev,
      custom: { qty, length: customLen, price: computedPrice, price2 },
    }));
  };

  const addToBasket = async () => {
    let items = [];

    if (productsList?.options?.[0]?.option_values?.length > 0) {
      items = productsList.options[0].option_values
        .map((item, index) => {
          const rowQty = rowQuantities[index] ?? 0;
          if (rowQty === 0) return null;

          let optionParts = [];

          // main option
          optionParts.push(
            `'${item.product_option_id}':'${item.product_option_value_id}'`,
          );

          // extra option (only if exists)
          if (
            selectedValue?.original?.product_option_id &&
            selectedValue?.original?.product_option_value_id
          ) {
            optionParts.push(
              `'${selectedValue.original.product_option_id}':'${selectedValue.original.product_option_value_id}'`,
            );
          }

          const optionString = `{${optionParts.join(',')}}`;

          let modeObj = {};
          if (selectedTab === 'Refund') modeObj.mode = 1;
          else if (selectedTab === 'Refund - No Stock') modeObj.mode = 2;

          return {
            customer_id: userData?.customer_id,
            product_id: item.product_id,
            option: optionString,
            quantity: rowQty,
            ...modeObj,
          };
        })
        .filter(Boolean);
    }

    if (rowQuantities?.custom?.qty > 0) {
      const custom = rowQuantities.custom;

      let optionParts = [];

      // main bespoke option
      optionParts.push(
        `'${productsList?.options?.[0]?.product_option_id}':'bespoke_option#${custom.length}#${custom.price2}'`,
      );

      // extra selected option (only if exists)
      if (selectedValue) {
        optionParts.push(
          `'${selectedValue.original.product_option_id}':'${selectedValue.original.product_option_value_id}'`,
        );
      }

      const customItem = {
        customer_id: userData?.customer_id,
        product_id: productsList?.product_id,
        option: `{${optionParts.join(',')}}`, // ✅ same format
        quantity: custom.qty,
      };

      if (selectedTab === 'Refund') customItem.mode = 1;
      else if (selectedTab === 'Refund - No Stock') customItem.mode = 2;

      items.push(customItem);
    }

    if (productsList?.options?.length === 0 && rowQuantities?.single?.qty > 0) {
      const singleItem = {
        customer_id: userData?.customer_id,
        product_id: productsList?.product_id,
        option: '[]',
        quantity: rowQuantities.single.qty,
      };

      if (selectedTab === 'Refund') singleItem.mode = 1;
      else if (selectedTab === 'Refund - No Stock') singleItem.mode = 2;

      items.push(singleItem);
    }

    if (items.length === 0) {
      showToast(
        'danger',
        'No items selected',
        'Please select at least one item to add.',
      );
      return;
    }
    // if (optionError) {
    //   showToast(
    //     'danger',
    //     'Selection required',
    //     'Please select the required option before continuing.',
    //   );

    //   return;
    // }

    try {
      const response = await postData(Api.ADD_CART, { items });

      const resData = response?.data;
      if (resData?.success && resData?.responseCode === 200) {
        // showToast(
        //   'success',
        //   'Success',
        //   resData.message || 'Items added to cart successfully.',
        // );
        navigation.replace('Home');
        setRowQuantities({});
        setCustomLength('');
        dispatch(triggerCartRefresh());
        dispatch(triggerMiscRefresh());
        setSelectedValue(null);
      } else {
        // showToast(
        //   'danger',
        //   'Failed',
        //   resData?.message || 'Something went wrong.',
        // );
      }
      // dispatch(triggerCartRefresh());
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    }
  };

  const calculatePrice = () => {
    const w = Math.floor(Number(width));
    const h = Math.floor(Number(length));
    if (!w || !h) {
      return; // Don't show toast here
    }
    const matched =
      productsList?.matrix?.find(
        item =>
          Number(item.width) === Number(w) && Number(item.height) === Number(h),
      ) ||
      productsList?.matrix
        ?.filter(
          item =>
            Number(item.width) >= Number(w) && Number(item.height) >= Number(h),
        )
        ?.reduce((nearest, current) => {
          const distCurrent =
            Math.pow(current.width - w, 2) + Math.pow(current.height - h, 2);

          const distNearest = nearest
            ? Math.pow(nearest.width - w, 2) + Math.pow(nearest.height - h, 2)
            : Infinity;

          return distCurrent < distNearest ? current : nearest;
        }, null);

    // 🚫 No price found
    if (!matched || !matched?.price) {
      showToast(
        'danger',
        'Not Available',
        'No price available for the selected size',
      );
      setPrice('0.00');
      setMatchedMatrix(null);
      return;
    }

    const matchedPrice = Number(matched.price);
    const qty = Number(quantity);

    if (isNaN(matchedPrice) || isNaN(qty)) {
      showToast('danger', 'Error', 'Invalid price or quantity');
      setPrice('0.00');
      return;
    }

    const total = (matchedPrice * qty).toFixed(2);
    setPrice(total);
    setMatchedMatrix(matched);
  };

  const matrixAddToBasket = async () => {
    let items = [];
    if (!width || !length) {
      showToast('danger', 'Error', 'Please enter both width and length.');
      return;
    }
    if (!matchedMatrix) {
      showToast(
        'danger',
        'Not Available',
        'Please calculate price for a valid size before adding to basket.',
      );
      return; // 🚫 STOP HERE
    }

    if (Number(price) <= 0) {
      showToast(
        'danger',
        'Invalid Price',
        'Cannot add item without a valid price.',
      );
      return;
    }
    const optionData = {};
    productsList?.options?.forEach(opt => {
      const name = opt?.option_descriptions?.name?.toLowerCase();

      if (name?.includes('height')) {
        optionData[opt.product_option_id] = length;
      } else if (name?.includes('width')) {
        optionData[opt.product_option_id] = width;
      }
    });

    const optionString = `{${Object.entries(optionData)
      .map(([key, val]) => `'${key}':'${val}'`)
      .join(',')}}`;
    const singleItem = {
      customer_id: userData?.customer_id,
      product_id: productsList?.product_id,
      option: optionString,
      quantity: quantity,
    };

    if (selectedTab === 'Refund') {
      singleItem.mode = 1;
    } else if (selectedTab === 'Refund - No Stock') {
      singleItem.mode = 2;
    }

    items.push(singleItem);
    console.log('SDdsfdsfdsfdsf', items);
    try {
      const response = await postData(Api.ADD_CART, { items });

      const resData = response?.data;
      if (resData?.success && resData?.responseCode === 200) {
        // showToast(
        //   'success',
        //   'Success',
        //   resData.message || 'Items added to cart successfully.',
        // );

        setRowQuantities({});
        setCustomLength('');
        dispatch(triggerCartRefresh());
        navigation.goBack();
      } else {
        dispatch(triggerCartRefresh());
        // showToast(
        //   'danger',
        //   'Failed',
        //   resData?.message || 'Something went wrong.',
        // );
      }
    } catch (error) {
      console.log('Error adding to basket:', error);
      // showToast('danger', 'Error', error.message || 'Something went wrong.');
    }
  };

  const handleItemPress = useCallback(
    item => {
      setPayload(prev => ({ ...prev, product_id: item?.id }));
      // dispatch(fetchProductsList(item?.slug));
      dispatch(
        fetchProductsList({
          slug: item?.slug,
          clicked_product_id: item?.product_id,
        }),
      );
      setResults([]);
      setTimeout(() => {
        searchRef.current?.clearSearch();
      }, 200);
    },
    [dispatch],
  );
  const handleImageError = useCallback(id => {
    setImageErrorMap(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }, []);

  const renderItem1 = useCallback(
    ({ item }) => {
      const hasError = imageErrorMap[item.id] || false;

      const imageSource =
        !item?.image || hasError
          ? ImageData.NOIMAGE
          : {
              uri: ImageBaseUrl + item.image,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            };
      return (
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => handleItemPress(item)}
        >
          <FastImage
            style={styles.itemImage}
            source={imageSource}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => handleImageError(item.id)}
          />

          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>
              {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
            </Text>
            <Text style={styles.itemPrice}>
              £ {Number(item.price).toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [imageErrorMap],
  );

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      // Re-fetch your products or any data
      dispatch(clearProducts());
      // dispatch(fetchProductsList(ItemData?.slug));
      dispatch(
        fetchProductsList({
          slug: ItemData?.slug,
          clicked_product_id:
            ItemData?.clicked_product_id || ItemData?.product_id,
        }),
      );
    } catch (error) {
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }

    setRefreshing(false);
  };

  const renderItem3 = item => {
    return (
      <View style={styles.item}>
        <Text style={styles.textItem}>{item?.label}</Text>
        {item.value === value && (
          <FastImage
            style={styles.icon}
            source={IconData?.SAFTY}
            resizeMode={FastImage.resizeMode.contain}
            // onError={handleError}
          />
        )}
      </View>
    );
  };
  const optionValues =
    Array.isArray(productsList?.options) &&
    productsList.options.length > 1 &&
    Array.isArray(productsList.options[1]?.option_values)
      ? productsList.options[1].option_values
      : [];

  const dropdownData = useMemo(() => {
    return optionValues.map(item => ({
      label: item?.option_values_name?.[0]?.name ?? '',
      value: item?.option_value_id,
      original: item,
    }));
  }, [optionValues]);
  return (
    <SafeAreaView style={styles.container}>
      <SearchComponent
        ref={searchRef}
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
        onNoResults={setSearchNoResults}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, marginVertical: verticalScale(10) }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {results?.length <= 0 && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.back}
              onPress={() => {
                navigation.goBack();
                dispatch(clearProducts());
              }}
            >
              <Ionicons
                name={'arrow-back'}
                size={moderateScale(20)}
                color={Color.GRAY}
              />
            </TouchableOpacity>

            <View style={styles.tab}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === 'Sales' && styles.selectedTab,
                ]}
                onPress={() => setSelectedTab('Sales')}
              >
                <Text style={styles.textStyle}>SM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === 'Refund' && styles.selectedTab,
                ]}
                onPress={() => setSelectedTab('Refund')}
              >
                <Text style={styles.textStyle}>RS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === 'Refund - No Stock' && styles.selectedTab,
                ]}
                onPress={() => setSelectedTab('Refund - No Stock')}
              >
                <Text style={styles.textStyle}>RNS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {results?.length > 0 ? (
          <>
            <FlatList
              data={results}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) =>
                `${item.id || item.product_id || index}`
              }
              renderItem={renderItem1}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingBottom: moderateScale(120),
              }}
              //  keyExtractor={(item, index) => index.toString()}
              onEndReached={() => loadMoreFunc && loadMoreFunc()}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={true}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={7}
              updateCellsBatchingPeriod={50}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loadingMore && (
                  <Text style={{ textAlign: 'center' }}>Loading...</Text>
                )
              }
            />
          </>
        ) : searchNoResults ? (
          <View style={styles.emptyContainer1}>
            <FastImage
              source={ImageData.NORESULT}
              style={styles.gif}
              resizeMode={FastImage.resizeMode.contain}
            />
            <Text style={styles.noResultText}>
              No result Found for "{searchNoResults}"
            </Text>
            <Text style={styles.noResultSubText}>
              Try adjusting your search term and search again
            </Text>
          </View>
        ) : (
          <>
            {loading ? (
              <Loader visible={true} />
            ) : !productsList || Object.keys(productsList).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No product found</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[Color.RED]}
                    tintColor={Color.RED}
                  />
                }
              >
                <ProductHeader
                  productsList={productsList}
                  setVisibleModal={setVisibleModaL}
                  styles={styles}
                />

                <ActionButtons
                  navigation={navigation}
                  payload={payload}
                  productsList={productsList}
                  selectedTab={selectedTab}
                  addToBasket={addToBasket}
                  matrixAddToBasket={matrixAddToBasket}
                  styles={styles}
                />

                {productsList?.matrix?.length <= 0 &&
                productsList?.allow_calculator === 0 ? (
                  productsList?.is_composite !== 0 ? (
                    <>
                      <CompositeProduct
                        productsList={productsList}
                        selectedTab={selectedTab}
                        rowQuantities={rowQuantities}
                        handleDecrease={handleDecrease}
                        handleIncrease={handleIncrease}
                        handleQtyTyping={handleQtyTyping}
                        handleFinalQty={handleFinalQty}
                        styles={styles}
                      />
                    </>
                  ) : (
                    <>
                      {productsList?.options?.length > 0 &&
                        productsList?.has_option !== 0 && (
                          <View style={styles.headerRow}>
                            <Text style={styles.headerText}>
                              {
                                productsList?.options?.[0]?.option_descriptions
                                  ?.name
                              }
                            </Text>
                          </View>
                        )}

                      {productsList?.has_option !== 0 &&
                      productsList?.options?.length > 0 ? (
                        <OptionsTable
                          productsList={productsList}
                          selectedTab={selectedTab}
                          rowQuantities={rowQuantities}
                          handleDecrease={handleDecrease}
                          handleIncrease={handleIncrease}
                          handleQtyTyping={handleQtyTyping}
                          handleFinalQty={handleFinalQty}
                          styles={styles}
                        />
                      ) : (
                        <SingleItemTable
                          productsList={productsList}
                          rowQuantities={rowQuantities}
                          handleDecrease={handleDecrease}
                          handleIncrease={handleIncrease}
                          handleSingleTyping={handleSingleTyping}
                          handleSingleFinal={handleSingleFinal}
                          styles={styles}
                        />
                      )}

                      {productsList?.options?.[0]?.display === 1 &&
                        productsList?.options?.[0]?.bespoke_value_req_epos ===
                          1 && (
                          <BespokeCalculator
                            customLength={customLength}
                            productsList={productsList}
                            rowQuantities={rowQuantities}
                            bespokeFactor={bespokeFactor}
                            handleCustomLengthChange={handleCustomLengthChange}
                            handleDecrease={handleDecrease}
                            handleIncrease={handleIncrease}
                            handleCustomTyping={handleCustomTyping}
                            handleCustomFinal={handleCustomFinal}
                            styles={styles}
                          />
                        )}

                      {productsList?.has_option !== 0 &&
                        productsList?.options?.length >= 2 && (
                          <>
                            <View
                              style={{
                                flexDirection: 'row',
                                flex: 1,
                                paddingHorizontal: 10,
                                alignItems: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: FONT.SEMIBOLD,
                                  color: Color.RED,
                                  flex: 0.3,
                                }}
                              >
                                {
                                  productsList?.options[1]?.option_descriptions
                                    ?.name
                                }
                              </Text>

                              <Dropdown
                                style={[styles.dropdown, { flex: 0.7 }]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                iconStyle={styles.iconStyle}
                                data={dropdownData}
                                search={false}
                                maxHeight={verticalScale(150)}
                                labelField="label"
                                valueField="value"
                                placeholder="Select item"
                                searchPlaceholder="Search..."
                                value={value}
                                onChange={item => {
                                  setValue(item.value);
                                  setSelectedValue(item);
                                }}
                                renderItem={renderItem3}
                              />
                            </View>
                          </>
                        )}
                    </>
                  )
                ) : (
                  <MatrixCalculator
                    width={width}
                    setWidth={setWidth}
                    length={length}
                    setLength={setLength}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    price={price}
                    calculatePrice={calculatePrice}
                    styles={styles}
                  />
                )}

                {productsList?.options?.[0]?.option_values?.length > 4 &&
                  productsList?.matrix?.length <= 0 && (
                    <ActionButtons
                      navigation={navigation}
                      payload={payload}
                      productsList={productsList}
                      selectedTab={selectedTab}
                      addToBasket={addToBasket}
                      matrixAddToBasket={matrixAddToBasket}
                      styles={styles}
                    />
                  )}
              </ScrollView>
            )}
          </>
        )}
      </KeyboardAvoidingView>
      <CartComponent />
      <ProductModal
        visible={visibleModal}
        onClose={() => setVisibleModaL(false)}
        product={productsList}
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: verticalScale(10),
  },
  back: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tab: {
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabButton: {
    paddingHorizontal: moderateScale(15), // capsule hugs text
    height: '80%',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: Color.RED, // red capsule
  },
  textStyle: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },
  productContainer: {
    flexDirection: 'row',

    paddingHorizontal: verticalScale(10),
    paddingVertical: verticalScale(5),
    alignItems: 'center',
  },
  productImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    marginRight: verticalScale(20),
  },
  productTitle: {
    fontSize: moderateScale(16),
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
  },
  productModel: { fontSize: moderateScale(16), color: Color.GRAY },
  viewDesc: {
    color: Color.RED,
    textDecorationLine: 'underline',
    fontSize: moderateScale(14),
    marginTop: moderateScale(4),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: verticalScale(10),
    paddingVertical: verticalScale(5),
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#3D3D3D',
    padding: moderateScale(12),
    borderRadius: 6,
    marginRight: 10,
  },
  editText: {
    textAlign: 'center',
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },
  addBtn: {
    flex: 1,
    backgroundColor: Color.RED,
    padding: moderateScale(12),
    borderRadius: 6,
  },
  addText: {
    textAlign: 'center',
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },

  headerRow: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: '20@s',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    flex: 0.4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: verticalScale(10),
    paddingVertical: verticalScale(0),
    // padding: '10@s',
    gap: 0,
  },

  pricePerM: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
  },

  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gif: {
    width: 200,
    height: 200,
  },

  priceContainer1: {
    alignItems: 'flex-end',
  },
  priceLine1: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  priceValue1: {
    color: '#8B0000',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  vatText1: {
    fontSize: moderateScale(12),
    color: '#777',
  },

  container1: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },

  labelRow: {
    flexDirection: 'row',
    gap: verticalScale(25),
    paddingHorizontal: 5,
    marginBottom: 6,
  },

  redLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Color.RED,
  },

  bigBoxRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    height: verticalScale(35),
    alignItems: 'center',
  },

  boxInput: {
    flex: 1,
    height: '100%',

    fontSize: 12,
    textAlign: 'center',
  },

  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
  },

  iconBtn: {
    width: verticalScale(45),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#888888',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  qtyBox: {
    width: verticalScale(45),
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },

  calcButton1: {
    backgroundColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
  },

  calcText1: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  qtyInput: {
    width: 45,
    height: 32,
    textAlign: 'center',
    fontSize: 12,
    color: '#000',
    paddingVertical: 0,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
    gap: moderateScale(5),
  },
  itemImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  itemName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: moderateScale(13),
    color: '#555',
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: moderateScale(5),
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#D1D1D1',
  },

  greyRow: {
    backgroundColor: '#F6F6F6',
  },

  cell: {
    flex: 1,
    height: verticalScale(35),
    paddingVertical: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  cellText: {
    fontSize: 12,
    color: '#4F4F4F',
    fontFamily: FONT.MEDIUM,
  },

  priceLink: {
    color: '#4F4F4F',
  },

  stockText: {
    fontSize: 12,
    fontFamily: FONT.BOLD,
  },

  qtyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },

  iconActive: { backgroundColor: '#888888' },
  iconDisabled: { backgroundColor: '#D1D1D1' },

  iconSymbol: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  redQty: { color: Color.RED },
  blackQty: { color: '#4F4F4F' },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: 2,
    overflow: 'hidden', // important for clean edges

    margin: 5,
  },

  qtyCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    paddingVertical: 0, // remove extra space
  },

  nsText: {
    fontSize: 14,
    color: '#999',
  },
  sizeCell: {
    flex: 1,
    height: verticalScale(35),
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  priceCell: {
    width: verticalScale(65),
    height: verticalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  stockCell: {
    width: verticalScale(40),
    height: verticalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  iconCell: {
    width: verticalScale(40),
    height: verticalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  qtyCellFixed: {
    width: verticalScale(45),
    height: verticalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },

  dropdown: {
    height: verticalScale(35),
    borderColor: '#D9D9D9',
    // borderColor: 'gray',
    borderWidth: 1,

    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
    width: 18,
    height: 18,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textItem: {
    flex: 1,
    fontSize: 16,
  },

  noResultText: {
    fontSize: '20@s',
    fontFamily: FONT.SEMIBOLD,
  },
  noResultSubText: {
    fontSize: '14@s',
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
  },
  emptyContainer1: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
// export default DisplayItems;
export default React.memo(DisplayItems);
