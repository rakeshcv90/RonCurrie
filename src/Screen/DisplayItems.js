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
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

  const bespokeFactor =
    Number(productsList?.options?.[0]?.bespoke_factor_val) || 0;

  useEffect(() => {
    const fetchUserData = async () => {
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
  }, [productsList]);
  const handleIncrease = (index, stock = 0) => {
    setRowQuantities(prev => {
      if (index === 'custom') {
        const qty = (prev.custom?.qty || 0) + 1;
        const length = Number(customLength) || 1;
        const price = (length * bespokeFactor * qty).toFixed(2);
        return { ...prev, custom: { qty, length, price } };
      } else if (index === 'single') {
        const qty = Math.min((prev.single?.qty || 0) + 1, stock);
        return { ...prev, single: { qty } };
      } else {
        const qty = Math.min((prev[index] || 0) + 1, stock);
        return { ...prev, [index]: qty };
      }
    });
  };

  const handleDecrease = index => {
    setRowQuantities(prev => {
      if (index === 'custom') {
        const qty = Math.max((prev.custom?.qty || 0) - 1, 0);
        const length = Number(customLength) || 1;
        const price = (length * bespokeFactor * qty).toFixed(2);
        return { ...prev, custom: { qty, length, price } };
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
      return {
        ...prev,
        custom: { qty, length: lengthNum, price },
      };
    });
  };

  const addToBasket = async () => {
    let items = [];

    if (productsList?.options?.[0]?.option_values?.length > 0) {
      items = productsList?.options?.[0]?.option_values
        .map((item, index) => {
          const quantity = rowQuantities[index] ?? 0;
          if (quantity === 0) return null;

          let optionString;

          if (
            customLength &&
            index === productsList?.options[0]?.option_values?.length - 1
          ) {
            optionString = `{'${item.product_option_id}':'bespoke_option#${customLength}#${item.price}'}`;
          } else {
            optionString = `{'${item.product_option_id}':'${item.product_option_value_id}'}`;
          }

          let modeObj = {};
          if (selectedTab === 'Refund') modeObj.mode = 1;
          else if (selectedTab === 'Refund - No Stock') modeObj.mode = 2;

          return {
            customer_id: userData?.customer_id,
            product_id: item.product_id,
            option: optionString,
            quantity,
            ...modeObj,
          };
        })
        .filter(Boolean);
    }
    if (rowQuantities['custom']?.qty > 0) {
      const custom = rowQuantities['custom'];
      const customItem = {
        customer_id: userData?.customer_id,
        product_id: productsList?.product_id,
        option: `{'${productsList?.options?.[0]?.product_option_id}':'bespoke_option#${custom.length}#${custom.price}'}`,
        quantity: custom.qty,
      };

      if (selectedTab === 'Refund') customItem.mode = 1;
      else if (selectedTab === 'Refund - No Stock') customItem.mode = 2;

      items.push(customItem);
    }

    if (
      productsList?.options?.length === 0 &&
      rowQuantities['single']?.qty > 0
    ) {
      const singleItem = {
        customer_id: userData?.customer_id,
        product_id: productsList?.product_id,
        option: '[]',
        quantity: rowQuantities['single'].qty,
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

    // setLoader(true);

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
    const matched =
      productsList?.matrix?.find(
        item => item.width === width && item.height === length,
      ) ||
      productsList?.matrix
        ?.filter(
          item => item.width >= width && item.height >= length, // only larger or equal
        )
        ?.reduce((nearest, current) => {
          const distCurrent = Math.sqrt(
            Math.pow(current.width - width, 2) +
              Math.pow(current.height - length, 2),
          );
          const distNearest = nearest
            ? Math.sqrt(
                Math.pow(nearest.width - width, 2) +
                  Math.pow(nearest.height - length, 2),
              )
            : Infinity;

          return distCurrent < distNearest ? current : nearest;
        }, null);

    const total = (matched?.price * quantity).toFixed(2);
    setPrice(total);
  };
  const matrixAddToBasket = async () => {
    let items = [];
    if (!width || !length) {
      showToast('danger', 'Error', 'Please enter both width and length.');
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
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.leftContainer}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Home' }], // 👈 this becomes the new root
                }),
              );
            }}
          >
            <Image
              source={IconData.Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Loader visible={loader} />
          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                navigation.navigate('SearchScreen');
              }}
            >
              <Image source={IconData.Search} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AccountProfile');
              }}
              style={{
                width: moderateScale(40),
                height: moderateScale(40),
                borderRadius: moderateScale(40),
                borderWidth: 1,
                borderColor: Color.GRAY5,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* <Image source={IconData.Menu} style={styles.icon} /> */}
              <Ionicons name={'menu'} size={moderateScale(25)} />
            </TouchableOpacity>
          </View>
        </View>

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
              <Text style={styles.textStyle}>Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Refund' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Refund')}
            >
              <Text style={styles.textStyle}>Refund</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Refund - No Stock' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Refund - No Stock')}
            >
              <Text style={styles.textStyle}>Refund - No Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                <Ionicons
                  name="images"
                  size={moderateScale(80)}
                  style={styles.productImage}
                  color={Color.GRAY}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>{productsList?.isbn}</Text>
                <Text style={styles.productModel}>
                  Model: {productsList?.model}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setVisibleModaL(true);
                  }}
                >
                  <Text style={styles.viewDesc}>View Description</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
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
                  {selectedTab === 'Sales' ? 'Add To Basket' : 'Add To Refund'}
                </Text>
              </TouchableOpacity>
            </View>
            {productsList?.matrix?.length <= 0 ? (
              <>
                {productsList?.options?.length > 0 &&
                  productsList?.has_option != 0 && (
                    <View style={styles.headerRow}>
                      <Text style={styles.headerText}>LENGTH</Text>
                      <Text style={[styles.headerText]}>PRICE</Text>
                    </View>
                  )}

                {productsList?.has_option != 0 &&
                productsList?.options?.length > 0 ? (
                  <FlatList
                    data={productsList?.options?.[0]?.option_values}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => {
                      const qty = rowQuantities[index] ?? 0;

                      return (
                        <View key={index}>
                          <View style={styles.row}>
                            <View style={styles.box}>
                              <Text style={styles.boxText}>
                                {item?.option_values_name[0]?.name}
                              </Text>
                            </View>

                            <View style={styles.box}>
                              <Text style={styles.boxText}>
                                £ {parseFloat(item?.price).toFixed(2)}
                              </Text>
                            </View>

                            <View style={styles.counterBox}>
                              <TouchableOpacity
                                style={styles.circleBtn}
                                onPress={() => {
                                  if (item?.quantity > 0) {
                                    handleDecrease(index);
                                  } else {
                                    showToast(
                                      'danger',
                                      'Item Not in Stock',
                                      'Please select another item or check back later.',
                                    );
                                  }
                                }}
                              >
                                <View style={styles.circleBtn2}>
                                  <Text style={styles.counterBtnText}>−</Text>
                                </View>
                              </TouchableOpacity>

                              <Text style={styles.counterValue}>{qty}</Text>

                              <TouchableOpacity
                                style={styles.circleBtn}
                                onPress={() => {
                                  if (item?.quantity > 0) {
                                    handleIncrease(index, item.quantity);
                                  } else {
                                    showToast(
                                      'danger',
                                      'Item Not in Stock',
                                      'Please select another item or check back later.',
                                    );
                                  }
                                }}
                              >
                                <View style={styles.circleBtn2}>
                                  <Text style={styles.counterBtnText}>+</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={{ paddingRight: moderateScale(10) }}>
                            <Text style={styles.inStock}>
                              In-Stock: {item?.quantity}
                            </Text>
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
                      productsList?.options?.[0]?.option_values?.length === 0
                        ? styles.emptyContentContainer
                        : {}
                    }
                  />
                ) : (
                  <>
                    <View>
                      <View style={styles.row}>
                        <View style={styles.box}>
                          <Text style={styles.boxText}>
                            {productsList?.sku}
                          </Text>
                        </View>

                        <View style={styles.box}>
                          <Text style={styles.boxText}>
                            £ {parseFloat(productsList?.price).toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.counterBox}>
                          <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => handleDecrease('single')}
                          >
                            <View style={styles.circleBtn2}>
                              <Text style={styles.counterBtnText}>−</Text>
                            </View>
                          </TouchableOpacity>

                          <Text style={styles.counterValue}>
                            {rowQuantities.single?.qty ?? 0}
                          </Text>

                          <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() =>
                              handleIncrease('single', productsList?.quantity)
                            }
                          >
                            <View style={styles.circleBtn2}>
                              <Text style={styles.counterBtnText}>+</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={{ paddingRight: moderateScale(10) }}>
                        <Text style={styles.inStock}>
                          In-Stock:
                          {productsList?.quantity}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {productsList?.options?.[0]?.display == 1 &&
                  productsList?.options?.[0]?.bespoke_value_req_epos == 1 && (
                    <>
                      <View style={styles.row}>
                        <View style={styles.box}>
                          <TextInput
                            style={[styles.input, { color: '#333' }]}
                            placeholder="Enter Length"
                            value={customLength}
                            onChangeText={handleCustomLengthChange}
                            keyboardType="numeric"
                            placeholderTextColor="#ccc"
                          />
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxText}>
                            £{' '}
                            {rowQuantities?.custom?.price ??
                              bespokeFactor.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.counterBox}>
                          <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => handleDecrease('custom')}
                          >
                            <View style={styles.circleBtn2}>
                              <Text style={styles.counterBtnText}>−</Text>
                            </View>
                          </TouchableOpacity>

                          <Text style={styles.counterValue}>
                            {rowQuantities.custom?.qty ?? 0}
                          </Text>

                          <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => handleIncrease('custom')}
                          >
                            <View style={styles.circleBtn2}>
                              <Text style={styles.counterBtnText}>+</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ paddingLeft: moderateScale(10) }}>
                        <Text style={styles.pricePerM}>
                          Bespoke Value:
                          <Text style={{ color: 'red' }}>
                            {productsList?.options?.[0]?.bespoke_factor_val}
                          </Text>
                        </Text>
                      </View>
                    </>
                  )}
              </>
            ) : (
              <View style={styles.container1}>
                <View style={styles.topRow1}>
                  <View style={styles.inputGroup1}>
                    <Text style={styles.label1}>WIDTH (MM)</Text>
                    <TextInput
                      style={styles.input1}
                      keyboardType="numeric"
                      value={width}
                      onChangeText={setWidth}
                    />
                  </View>

                  <View style={styles.inputGroup1}>
                    <Text style={styles.label1}>LENGTH (MM)</Text>
                    <TextInput
                      style={styles.input1}
                      keyboardType="numeric"
                      value={length}
                      onChangeText={setLength}
                    />
                  </View>

                  <View style={styles.qtyWrapper1}>
                    <TouchableOpacity
                      style={styles.qtyButton1}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Text style={styles.qtySymbol1}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.qtyBox1}>
                      <Text style={styles.qtyNumber1}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.qtyButton1}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Text style={styles.qtySymbol1}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Row: Button + Price */}
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
            )}
          </ScrollView>
        )}

        {/* {productsList?.length <= 0 && <Loader visible={loading} />} */}
        <CartComponent />
      </KeyboardAvoidingView>

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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchInput: {
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logo: {
    width: '90%',
    height: moderateScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
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
    padding: 10,
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
    marginTop: moderateScale(4),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#3D3D3D',
    padding: 12,
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
    padding: '10@s',
    gap: 0,
  },

  boxText: {
    fontSize: 14,
    color: '#333',
  },

  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    height: moderateScale(48), // set fixed height
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    textAlignVertical: 'center',
  },

  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    height: moderateScale(48),
    marginLeft: 7,
  },
  circleBtn: {
    width: 35,
    height: '100%',
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  circleBtn2: {
    width: 25,
    height: 25,
    borderRadius: 25,
    backgroundColor: '#888888',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: Color.WHITE,
    textAlign: 'center',
  },
  counterValue: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#333',
    // minWidth: 22,
    textAlign: 'center',
  },
  inStock: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
    textAlign: 'right',
  },
  pricePerM: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 10,
    width: '75%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: Color.WHITE,
    borderRadius: 40,
    // overflow: 'hidden',
    elevation: 5,
    left: '12.5%',
    alignItems: 'center',
    padding: '5@ms',
    gap: 5,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  circleLeft: {
    width: '75%',
    height: 45,
    borderRadius: 50,
    backgroundColor: '#3D3D3D',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  circleLeft1: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '3@ms',
  },
  circleRight: {
    width: '20%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 350, // or whatever height you prefer
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

  container1: {
    padding: moderateScale(10),
    backgroundColor: '#fff',
    borderRadius: moderateScale(6),
  },
  topRow1: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  inputGroup1: {
    flex: 1,
    marginRight: moderateScale(6),
  },
  label1: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#444',
    marginBottom: moderateScale(3),
  },
  input1: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(4),
    height: moderateScale(40),
    paddingHorizontal: moderateScale(10),
    fontSize: moderateScale(14),
  },
  qtyWrapper1: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(4),
    height: moderateScale(40),
  },
  qtyButton1: {
    paddingHorizontal: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtySymbol1: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  qtyBox1: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
  },
  qtyNumber1: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  bottomRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(15),
  },
  calcButton1: {
    backgroundColor: '#333',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(25),
    borderRadius: moderateScale(4),
  },
  calcText1: {
    color: '#fff',
    fontWeight: '600',
    fontSize: moderateScale(13),
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
});
// export default DisplayItems;
export default React.memo(DisplayItems);
