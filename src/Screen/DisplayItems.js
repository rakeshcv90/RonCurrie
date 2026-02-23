import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import React, {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

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
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { postData } from '../utility/ApiCall';
import { MMKVStorage } from '../utility/MmkvStore';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import CartComponent from '../Component/CartComponent';
import { triggerCartRefresh } from '../Redux/Slice/CartDataShowSlice';
import SearchComponent from './Component/SearchComponent';
import { Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
const windowHeight = Dimensions.get('window').height;

const DisplayItems = ({ navigation, route }) => {
  const ItemData = route.params.itemData;

  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();
  const { productsList, loading, error } = useSelector(
    state => state.productsList,
  );

  const [selectedTab, setSelectedTab] = useState('Sales');
  const [customLength, setCustomLength] = useState('');
  const [visibleModal, setVisibleModaL] = useState(false);
  const [rowQuantities, setRowQuantities] = useState({});
  const [userData, setUserData] = useState(null);

  // For Mattix
  const [width, setWidth] = useState(null);
  const [length, setLength] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(null);
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [payload, setPayload] = useState(null);
  const [matchedMatrix, setMatchedMatrix] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [value, setValue] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [optionError, setOptionError] = useState(false);
  const isRequired = productsList?.options?.[1]?.required === 1;

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
      dispatch(fetchProductsList(ItemData?.slug));

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
    if (isRequired && !selectedValue) {
      setOptionError(true);
    }
  }, [productsList]);

  // const handleIncrease = (index, stock = 0) => {
  //   setRowQuantities(prev => {
  //     if (index === 'custom') {
  //       const qty = (prev.custom?.qty || 0) + 1;
  //       const length = Number(customLength) || 1;
  //       const price = (length * bespokeFactor * qty).toFixed(2);
  //       const price2 = (length * bespokeFactor).toFixed(2);

  //       return { ...prev, custom: { qty, length, price, price2 } };
  //     } else if (index === 'single') {
  //       // const qty = Math.min((prev.single?.qty || 0) + 1, stock);
  //       // return { ...prev, single: { qty } };
  //       const qty =
  //         selectedTab === 'Sales'
  //           ? Math.min((prev.single?.qty || 0) + 1, stock) // Sales → check stock
  //           : (prev.single?.qty || 0) + 1; // Not Sales → ignore stock

  //       return { ...prev, single: { qty } };
  //     } else {
  //       // const qty = Math.min((prev[index] || 0) + 1, stock);
  //       const qty =
  //         selectedTab === 'Sales'
  //           ? Math.min((prev[index] || 0) + 1, stock) // stock check
  //           : (prev[index] || 0) + 1; // ignore stock

  //       return { ...prev, [index]: qty };
  //     }
  //   });
  // };

  const handleIncrease = useCallback(
    (index, stock = 0) => {
      setRowQuantities(prev => {
        if (index === 'custom') {
          const qty = (prev.custom?.qty || 0) + 1;
          const length = Number(customLength) || 1;
          const price = (length * bespokeFactor * qty).toFixed(2);
          const price2 = (length * bespokeFactor).toFixed(2);

          return { ...prev, custom: { qty, length, price, price2 } };
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
        const qty = Math.max((prev.custom?.qty || 0) - 1, 0);
        const length = Number(customLength) || 1;
        const price = (length * bespokeFactor * qty).toFixed(2);
        const price2 = (length * bespokeFactor).toFixed(2);

        return { ...prev, custom: { qty, length, price, price2 } };
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
    const lengthNum = parseFloat(val) || 0;

    setCustomLength(val);

    setRowQuantities(prev => {
      const qty = prev.custom?.qty || 1;
      const price = (lengthNum * bespokeFactor * qty).toFixed(2);
      const price2 = (lengthNum * bespokeFactor).toFixed(2);
      return {
        ...prev,
        custom: { qty, length: lengthNum, price, price2 },
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

    let num = parseInt(raw);
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

    let num = parseInt(raw);
    if (isNaN(num) || num <= 0) num = 1;
    if (num > stock) num = stock;

    setRowQuantities(prev => ({
      ...prev,
      single: { qty: num },
    }));
  };
  const handleCustomTyping = (text, bespokeFactor, customLength) => {
    setRowQuantities(prev => ({
      ...prev,
      custom: { qty: text },
    }));
  };

  const handleCustomFinal = (bespokeFactor, customLength) => {
    let raw = rowQuantities.custom?.qty;

    let qty = parseInt(raw);
    if (isNaN(qty) || qty <= 0) qty = 1;

    const length = Number(customLength) || 1;
    const price = (length * bespokeFactor * qty).toFixed(2);
    const price2 = (length * bespokeFactor).toFixed(2);

    setRowQuantities(prev => ({
      ...prev,
      custom: { qty, length, price, price2 },
    }));
  };

  const addToBasket = async () => {
    let items = [];

    // if (productsList?.options?.[0]?.option_values?.length > 0) {
    //   items = productsList.options[0].option_values
    //     .map((item, index) => {
    //       const quantity = rowQuantities[index] ?? 0;
    //       if (quantity === 0) return null;

    //       const optionString = `{'${item.product_option_id}':'${item.product_option_value_id}'}`;

    //       let modeObj = {};
    //       if (selectedTab === 'Refund') modeObj.mode = 1;
    //       else if (selectedTab === 'Refund - No Stock') modeObj.mode = 2;

    //       return {
    //         customer_id: userData?.customer_id,
    //         product_id: item.product_id,
    //         option: optionString,
    //         quantity,
    //         ...modeObj,
    //       };
    //     })
    //     .filter(Boolean);
    // }
    if (productsList?.options?.[0]?.option_values?.length > 0) {
      items = productsList.options[0].option_values
        .map((item, index) => {
          const quantity = rowQuantities[index] ?? 0;
          if (quantity === 0) return null;

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
            option: optionString, // ✅ EXACT format you want
            quantity,
            ...modeObj,
          };
        })
        .filter(Boolean);
    }

    // if (rowQuantities?.custom?.qty > 0) {
    //   const custom = rowQuantities.custom;

    //   const customItem = {
    //     customer_id: userData?.customer_id,
    //     product_id: productsList?.product_id,
    //     option: `{'${productsList?.options?.[0]?.product_option_id}':'bespoke_option#${custom.length}#${custom.price2}'}`,
    //     quantity: custom.qty,
    //   };

    //   if (selectedTab === 'Refund') customItem.mode = 1;
    //   else if (selectedTab === 'Refund - No Stock') customItem.mode = 2;

    //   items.push(customItem);
    // }

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
    if (optionError) {
      showToast(
        'danger',
        'Selection required',
        'Please select the required option before continuing.',
      );

      return;
    }
    console.log('Test Payload', items);

    setLoader(true);

    try {
      const response = await postData(Api.ADD_CART, { items });

      const resData = response?.data;
      if (resData?.success && resData?.responseCode === 200) {
        showToast(
          'success',
          'Success',
          resData.message || 'Items added to cart successfully.',
        );
        setRowQuantities({});
        setCustomLength('');
        dispatch(triggerCartRefresh());
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
    } finally {
      setLoader(false);
    }
  };

  const calculatePrice = () => {
    const w = Math.floor(Number(width));
    const h = Math.floor(Number(length));

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
    if (!matched || !matched.price) {
      showToast(
        'danger',
        'Not Available',
        'No price available for the selected size',
      );
      setPrice('0.00');
      setMatchedMatrix(null);
      return;
    }

    const price = Number(matched.price);
    const qty = Number(quantity);

    if (isNaN(price) || isNaN(qty)) {
      showToast('danger', 'Error', 'Invalid price or quantity');
      setPrice('0.00');
      return;
    }

    const total = (price * qty).toFixed(2);
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
      .map(([key, value]) => `'${key}':'${value}'`)
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
    setLoader(true);
    try {
      const response = await postData(Api.ADD_CART, { items });

      const resData = response?.data;
      if (resData?.success && resData?.responseCode === 200) {
        showToast(
          'success',
          'Success',
          resData.message || 'Items added to cart successfully.',
        );
        setRowQuantities({});
        setCustomLength('');
        setLoader(false);
        dispatch(triggerCartRefresh());
      } else {
        setLoader(false);
        dispatch(triggerCartRefresh());
        // showToast(
        //   'danger',
        //   'Failed',
        //   resData?.message || 'Something went wrong.',
        // );
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      setLoader(false);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
    } finally {
      setLoader(false);
    }
  };

  const decodeHtml = text => {
    if (!text) return '';
    return text
      .replace(/&quot;/g, '')
      .replace(/&apos;/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/["']/g, '')
      .replace(/[^a-zA-Z0-9\s.,-]/g, '')
      .trim();
  };
  // const handleItemPress = item => {
  //   setPayload(prev => ({
  //     ...prev,
  //     product_id: item?.id,
  //   }));

  //   dispatch(fetchProductsList(item?.slug));
  //   setResults([]);
  // };

  const handleItemPress = useCallback(
    item => {
      setPayload(prev => ({ ...prev, product_id: item?.id }));
      dispatch(fetchProductsList(item?.slug));
      setResults([]);
    },
    [dispatch],
  );
  const handleImageError = useCallback(id => {
    setImageErrorMap(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }, []);
  // const renderItem1 = ({ item }) => {
  //   const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

  //   // const handleError = () => {
  //   //   setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
  //   // };

  //   const hasError = imageErrorMap[item.id] || false;

  //   return (
  //     <TouchableOpacity
  //       style={styles.itemRow}
  //       onPress={() => handleItemPress(item)}
  //     >
  //       {imageUrl && !hasError ? (
  //         <FastImage
  //           style={styles.itemImage}
  //           source={{
  //             uri: imageUrl,
  //             priority: FastImage.priority.high,
  //             cache: FastImage.cacheControl.immutable,
  //           }}
  //           resizeMode={FastImage.resizeMode.cover}
  //         onError={() => handleImageError(item.id)}
  //         />
  //       ) : (
  //         <FastImage
  //           style={styles.itemImage}
  //           source={ImageData?.NOIMAGE}
  //           resizeMode={FastImage.resizeMode.cover}
  //       onError={() => handleImageError(item.id)}
  //         />
  //       )}

  //       <View style={styles.itemTextContainer}>
  //         <Text style={styles.itemName}>
  //           {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
  //         </Text>
  //         <Text style={styles.itemPrice}>
  //           £ {Number(item.price).toFixed(2)}
  //         </Text>
  //       </View>
  //     </TouchableOpacity>
  //   );
  // };

  const renderItem1 = useCallback(
    ({ item }) => {
      // const imageUrl = item?.image ? ImageBaseUrl + item.image : null;
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

          {/* {imageUrl && !hasError ? (
            <FastImage
              style={styles.itemImage}
              source={{
                uri: imageUrl,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleImageError(item.id)}
            />
          ) : (
            <FastImage
              style={styles.itemImage}
              source={ImageData?.NOIMAGE}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleImageError(item.id)}
            />
          )} */}

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
      dispatch(fetchProductsList(ItemData?.slug));
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
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
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
                navigation.goBack(), dispatch(clearProducts());
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
                <View style={styles.productContainer}>
                  {productsList?.image && productsList?.image.trim() !== '' ? (
                    <FastImage
                      style={styles.productImage}
                      source={{
                        uri: `${ImageBaseUrl}${productsList.image}?w=150&h=150`,
                        priority: FastImage.priority.high,
                        cache: FastImage.cacheControl.immutable,
                      }}
                      resizeMode={FastImage.resizeMode.cover}
                      // onError={handleError}
                    />
                  ) : (
                    <FastImage
                      style={styles.itemImage}
                      source={ImageData?.NOIMAGE}
                      resizeMode={FastImage.resizeMode.cover}
                      // onError={handleError}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productTitle}>
                      {decodeHtml(productsList?.isbn)}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: verticalScale(10),
                      }}
                    >
                      <View>
                        <Text style={styles.productModel}>
                          Model:{decodeHtml(productsList?.model)}
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            setVisibleModaL(true);
                          }}
                        >
                          <Text style={styles.viewDesc}>View Description</Text>
                        </TouchableOpacity>
                      </View>

                      {productsList?.options?.[0]?.display == 1 &&
                        productsList?.options?.[0]?.bespoke_value_req_epos ==
                          1 && (
                          <View
                            style={{
                              padding: verticalScale(3),
                              backgroundColor: '#156082',
                              flexDirection: 'row',
                              borderWidth: 2,
                              borderColor: '#23414F',
                              borderRadius: 5,
                            }}
                          >
                            <View>
                              <Text
                                style={[styles.pricePerM, { color: 'white' }]}
                              >
                                Bespoke Value
                              </Text>
                              <Text
                                style={{ color: 'white', textAlign: 'center' }}
                              >
                                £
                                {productsList?.options?.[0]?.bespoke_factor_val}
                                /m
                              </Text>
                            </View>
                          </View>
                        )}
                    </View>
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      navigation.navigate('WebViewScreen', {
                        payload: payload,
                      });
                    }}
                  >
                    <Text style={styles.addText}>Edit Stock & Price</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      if (productsList?.matrix?.length <= 0) {
                        addToBasket();
                      } else {
                        matrixAddToBasket();
                      }
                    }}
                  >
                    <Text style={styles.addText}>
                      {selectedTab === 'Sales'
                        ? 'Add To Basket'
                        : 'Add To Refund'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {productsList?.matrix?.length <= 0 &&
                productsList?.allow_calculator == 0 ? (
                  <>
                    {productsList?.options?.length > 0 &&
                      productsList?.has_option != 0 && (
                        <View style={styles.headerRow}>
                          <Text style={styles.headerText}>
                            {
                              productsList?.options?.[0]?.option_descriptions
                                ?.name
                            }
                          </Text>
                        </View>
                      )}

                    {productsList?.has_option != 0 &&
                    productsList?.options?.length > 0 ? (
                      <View style={styles.tableContainer}>
                    
                        <FlatList
                          data={productsList?.options?.[0]?.option_values}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({ item, index }) => {
                            const qty = rowQuantities[index] ?? 0;
                            const inStock = item?.quantity ?? 0;
                            const isDisabled =
                              inStock === 0 && selectedTab == 'Sales';
                            const isOdd = index % 2 === 1;
                            return (
                              <View
                                key={index}
                                style={[
                                  styles.tableRow,
                                  index % 2 !== 0 && styles.greyRow,
                                ]}
                              >
                                <View style={styles.sizeCell}>
                                  <Text
                                    style={styles.cellText}
                                    numberOfLines={2}
                                  >
                                    {decodeHtml(
                                      item?.option_values_name[0]?.name,
                                    )}
                                  </Text>
                                </View>
                               
                                <View style={styles.priceCell}>
                                  {/* <Text style={styles.cellText}>
                                    £{parseFloat(item?.price).toFixed(2)}
                                  </Text> */}

                                  <Text style={styles.cellText}>
                                    {parseFloat(item?.price) === 0
                                      ? ''
                                      : `£${parseFloat(item?.price).toFixed(
                                          2,
                                        )}`}
                                  </Text>
                                </View>

                                <View style={styles.stockCell}>
                                  <Text
                                    style={[
                                      styles.stockText,
                                      inStock === 0
                                        ? styles.redQty
                                        : styles.blackQty,
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
                                        : styles.iconActive,
                                    ]}
                                    onPress={() => handleDecrease(index)}
                                  >
                                    <Text style={styles.iconSymbol}>−</Text>
                                  </TouchableOpacity>
                                </View>

                                <View style={styles.qtyCellFixed}>
                                  {inStock === 0 && selectedTab == 'Sales' ? (
                                    <Text style={styles.nsText}>NS</Text>
                                  ) : (
                                    <TextInput
                                      style={styles.qtyInput}
                                      value={String(qty)}
                                      keyboardType="numeric"
                                      onChangeText={v =>
                                        handleQtyTyping(index, v)
                                      }
                                      onEndEditing={() =>
                                        handleFinalQty(index, inStock)
                                      }
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
                                        : styles.iconActive,
                                    ]}
                                    onPress={() =>
                                      handleIncrease(index, inStock)
                                    }
                                  >
                                    <Text style={styles.iconSymbol}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          }}
                          showsVerticalScrollIndicator={false}
                          initialNumToRender={10}
                          maxToRenderPerBatch={5}
                          windowSize={5}
                          ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                              {Platform.OS == 'android' ? (
                                <FastImage
                                  source={ImageData.NoData}
                                  style={styles.gif}
                                  // tintColor={'red'}
                                  resizeMode={FastImage.resizeMode.contain}
                                />
                              ) : (
                                <Text style={styles.emptyText}>
                                  No items available
                                </Text>
                              )}
                            </View>
                          }
                          contentContainerStyle={
                            productsList?.options?.[0]?.option_values
                              ?.length === 0
                              ? styles.emptyContentContainer
                              : {}
                          }
                        />
                      </View>
                    ) : (
                      <>
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
                                {productsList?.sku
                                  ? productsList?.sku
                                  : productsList?.model}
                              </Text>
                            </View>

                            <View style={styles.priceCell}>
                              <Text style={[styles.cellText, styles.priceLink]}>
                                £{parseFloat(productsList?.price).toFixed(2)}
                              </Text>
                            </View>

                            {/* STOCK */}
                            <View style={styles.stockCell}>
                              <Text
                                style={[
                                  styles.stockText,
                                  productsList?.quantity === 0
                                    ? styles.redQty
                                    : styles.blackQty,
                                ]}
                              >
                                {productsList?.quantity}
                              </Text>
                            </View>

                            {/* MINUS BUTTON */}
                            <View style={styles.iconCell}>
                              <TouchableOpacity
                                disabled={productsList?.quantity === 0}
                                style={[
                                  styles.iconContainer,
                                  productsList?.quantity === 0
                                    ? styles.iconDisabled
                                    : styles.iconActive,
                                ]}
                                onPress={() => handleDecrease('single')}
                              >
                                <Text style={styles.iconSymbol}>−</Text>
                              </TouchableOpacity>
                            </View>

                            {/* QTY / NS */}
                            <View style={styles.qtyCellFixed}>
                              {productsList?.quantity === 0 ? (
                                <Text style={[styles.qtyText, styles.nsText]}>
                                  NS
                                </Text>
                              ) : (
                                <TextInput
                                  style={styles.qtyInput}
                                  keyboardType="numeric"
                                  value={(
                                    rowQuantities.single?.qty ?? 0
                                  ).toString()}
                                  onChangeText={v => handleSingleTyping(v)}
                                  onEndEditing={() =>
                                    handleSingleFinal(productsList?.quantity)
                                  }
                                  maxLength={4}
                                />
                              )}
                            </View>

                            {/* PLUS BUTTON */}
                            <View style={styles.iconCell}>
                              <TouchableOpacity
                                disabled={productsList?.quantity === 0}
                                style={[
                                  styles.iconContainer,
                                  productsList?.quantity === 0
                                    ? styles.iconDisabled
                                    : styles.iconActive,
                                ]}
                                onPress={() =>
                                  handleIncrease(
                                    'single',
                                    productsList?.quantity,
                                  )
                                }
                              >
                                <Text style={styles.iconSymbol}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </>
                    )}

                    {productsList?.options?.[0]?.display == 1 &&
                      productsList?.options?.[0]?.bespoke_value_req_epos ==
                        1 && (
                        <View
                          style={[
                            styles.tableContainer,
                            { top: verticalScale(-10) },
                          ]}
                        >
                          <View
                            style={[
                              styles.tableRow,
                              styles.greyRow,
                              { backgroundColor: '#fff' },
                            ]}
                          >
                            {/* LENGTH */}
                            <View style={styles.sizeCell}>
                              <TextInput
                                style={[
                                  styles.qtyInput,
                                  { width: '100%', textAlign: 'left' },
                                ]}
                                placeholder="Length"
                                value={customLength}
                                onChangeText={val =>
                                  handleCustomLengthChange(
                                    val,
                                    productsList?.quantity,
                                  )
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
                                  : rowQuantities?.custom?.price ??
                                    bespokeFactor.toFixed(2)}
                                {/* {rowQuantities?.custom?.price ??
                                  bespokeFactor.toFixed(2)} */}
                              </Text>
                            </View>

                            {/* STOCK / CALCULATED PRICE */}
                            <View style={styles.stockCell}>
                              <Text style={[styles.stockText, styles.blackQty]}>
                                -
                              </Text>
                            </View>

                            {/* MINUS */}
                            <View style={styles.iconCell}>
                              <TouchableOpacity
                                style={[
                                  styles.iconContainer,
                                  styles.iconActive,
                                ]}
                                onPress={() => handleDecrease('custom')}
                              >
                                <Text style={styles.iconSymbol}>−</Text>
                              </TouchableOpacity>
                            </View>

                            {/* QTY */}
                            <View style={styles.qtyCellFixed}>
                              <TextInput
                                style={styles.qtyInput}
                                keyboardType="numeric"
                                value={(
                                  rowQuantities.custom?.qty ?? 0
                                ).toString()}
                                // onChangeText={text =>
                                //   handleCustomTyping(
                                //     text,
                                //     bespokeFactor,
                                //     customLength,
                                //   )
                                // }
                                // onEndEditing={() =>
                                //   handleCustomFinal(bespokeFactor, customLength)
                                // }

                                onChangeText={text => {
                                  if (customLength !== '') {
                                    handleCustomTyping(
                                      text,
                                      bespokeFactor,
                                      customLength,
                                    );
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
                                    handleCustomFinal(
                                      bespokeFactor,
                                      customLength,
                                    );
                                  }
                                }}
                              />
                            </View>

                            {/* PLUS */}
                            <View style={styles.iconCell}>
                              <TouchableOpacity
                                style={[
                                  styles.iconContainer,
                                  styles.iconActive,
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
                      )}

                    {productsList?.has_option != 0 &&
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
                              // data={productsList?.options[1]?.option_values}
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
                                setOptionError(false);
                              }}
                              // renderLeftIcon={() => (
                              //   <FastImage
                              //     style={styles.icon}
                              //     source={IconData?.SAFTY}
                              //     resizeMode={FastImage.resizeMode.contain}
                              //     // onError={handleError}
                              //   />
                              // )}
                              renderItem={renderItem3}
                            />
                          </View>
                          {optionError && (
                            <Text
                              style={{
                                color: 'red',
                                fontSize: 12,
                                marginBottom: verticalScale(10),
                                marginTop: verticalScale(3),
                                paddingHorizontal: verticalScale(15),
                                textAlign: 'right',
                              }}
                            >
                              Please select{' '}
                              {
                                productsList?.options[1]?.option_descriptions
                                  ?.name
                              }
                            </Text>
                          )}
                        </>
                      )}
                  </>
                ) : (
                  <>
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
                            style={styles.buttonBox}
                            onPress={() => {
                              setQuantity(Math.max(0, quantity - 1));
                              calculatePrice();
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
                              calculatePrice();
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
                            style={styles.buttonBox}
                            onPress={() => {
                              setQuantity(quantity + 1);
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
                            Price:{' '}
                            <Text style={styles.priceValue1}>£{price}</Text>
                          </Text>
                          <Text style={styles.vatText1}>inc VAT</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {productsList?.options?.[0]?.option_values?.length > 4 && (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        navigation.navigate('WebViewScreen', {
                          payload: payload,
                        });
                      }}
                    >
                      <Text style={styles.addText}>Edit Stock & Price</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => {
                        if (productsList?.matrix?.length <= 0) {
                          addToBasket();
                        } else {
                          matrixAddToBasket();
                        }
                      }}
                    >
                      <Text style={styles.addText}>
                        {selectedTab === 'Sales'
                          ? 'Add To Basket'
                          : 'Add To Refund'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
    // padding: 10,
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

  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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

  qtyText: {
    fontSize: 18,
    fontWeight: '600',
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

  iconCell: {
    // width: 40,
    width: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
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
});
// export default DisplayItems;
export default React.memo(DisplayItems);
