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
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useDispatch, useSelector } from 'react-redux';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { fetchProductsList } from '../Redux/Slice/ProductListSlice';
import { Api, ImageBaseUrl } from '../utility/api';
import ProductModal from './Component/ProductModal';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { postData } from '../utility/ApiCall';
import { MMKVStorage } from '../utility/MmkvStore';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const DisplayItems = ({ navigation, route }) => {
  const ItemData = route.params.itemData;
  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();
  const { productsList, loading, error } = useSelector(
    state => state.productsList,
  );
  console.log('Response Data', ItemData?.slug);
  const [selectedTab, setSelectedTab] = useState('Sales');
  const [customLength, setCustomLength] = useState('');

  const [visibleModal, setVisibleModaL] = useState(false);
  const [rowQuantities, setRowQuantities] = useState({});

  const [userData, setUserData] = useState(null);
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
      dispatch(fetchProductsList(ItemData?.slug));
    }, [dispatch]),
  );

  // const handleIncrease = index => {
  //   if (index !== 'custom') return;

  //   setRowQuantities(prev => {
  //     const qty = (prev.custom?.qty || 0) + 1;
  //     const length = prev.custom?.length || 1;
  //     const safeFactor = Number(bespokeFactor) || 0;
  //     const price = (length * safeFactor * qty).toFixed(2);

  //     return { ...prev, custom: { qty, length, price } };
  //   });
  // };

  // const handleDecrease = index => {
  //   if (index !== 'custom') return;

  //   setRowQuantities(prev => {
  //     const qty = Math.max((prev.custom?.qty || 0) - 1, 0);
  //     const length = prev.custom?.length || 1;
  //     const safeFactor = Number(bespokeFactor) || 0;
  //     const price = (length * safeFactor * qty).toFixed(2);

  //     return { ...prev, custom: { qty, length, price } };
  //   });
  // };

  const handleIncrease = (index, stock = 0) => {
    setRowQuantities(prev => {
      if (index === 'custom') {
        const qty = (prev.custom?.qty || 0) + 1;
        const length = prev.custom?.length || 1;
        const price = (length * bespokeFactor * qty).toFixed(2);
        return { ...prev, custom: { qty, length, price } };
      } else {
        // Normal row
        const qty = Math.min((prev[index] || 0) + 1, stock); // do not exceed stock
        return { ...prev, [index]: qty };
      }
    });
  };

  const handleDecrease = index => {
    setRowQuantities(prev => {
      if (index === 'custom') {
        const qty = Math.max((prev.custom?.qty || 0) - 1, 0);
        const length = prev.custom?.length || 1;
        const price = (length * bespokeFactor * qty).toFixed(2);
        return { ...prev, custom: { qty, length, price } };
      } else {
        // Normal row
        const qty = Math.max((prev[index] || 0) - 1, 0);
        return { ...prev, [index]: qty };
      }
    });
  };

  const handleCustomLengthChange = val => {
    const lengthNum = parseFloat(val) || 0;
    setCustomLength(val);

    setRowQuantities(prev => {
      const qty = prev.custom?.qty || 1; // default 1
      const price = (lengthNum * bespokeFactor * qty).toFixed(2); // price = length * factor * quantity
      return {
        ...prev,
        custom: { qty, length: lengthNum, price },
      };
    });
  };
  const addToBasket = async () => {
    const items = (productsList?.options?.[0]?.option_values || [])
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

    console.log('Payload to send:', items);
    if (items.length === 0) {
      showToast(
        'danger',
        'No items selected',
        'Please select at least one item to add.',
      );
      return;
    }
    setLoader(true);
    try {
      setLoader(true);
      const response = await postData(Api.ADD_CART, { items });
      console.log('Response Data', response?.data);

      const resData = response?.data;

      if (resData?.success && resData?.responseCode === 200) {
        showToast(
          'success',
          'Success',
          resData.message || 'Items added to cart successfully.',
        );

        // setRowQuantities({});
        // setCustomLength('');
      } else {
        showToast(
          'danger',
          'Failed',
          resData?.message || 'Something went wrong.',
        );
      }
      setLoader(false);
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast('danger', 'Error', error.message || 'Something went wrong.');
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
          <View style={styles.leftContainer}>
            <Image
              source={IconData.Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Loader visible={loader} />
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Image source={IconData.Search} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Image source={IconData.Menu} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
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

        <View style={styles.productContainer}>
          {productsList?.image && productsList?.image.trim() !== '' ? (
            <Image
              source={{ uri: ImageBaseUrl + productsList.image }}
              style={styles.productImage}
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
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Edit Stock & Price</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              addToBasket();
            }}
          >
            <Text style={styles.addText}>Add To Basket</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>LENGTH</Text>
            <Text style={[styles.headerText]}>PRICE</Text>
          </View>
          {(productsList?.options?.[0]?.option_values || []).map(
            (item, index) => {
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
                        onPress={() => handleDecrease(index)}
                      >
                        <View style={styles.circleBtn2}>
                          <Text style={styles.counterBtnText}>−</Text>
                        </View>
                      </TouchableOpacity>

                      <Text style={styles.counterValue}>{qty}</Text>

                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleIncrease(index, item.quantity)}
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
            },
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
                      {rowQuantities?.custom?.price ?? bespokeFactor.toFixed(2)}
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
        </ScrollView>
        <View style={styles.bottomCard}>
          <TouchableOpacity
            style={styles.circleLeft}
            onPress={() => {
              navigation.navigate('AddCartScreen');
            }}
          >
            <View style={styles.circleLeft1}>
              <MaterialDesignIcons name="cart" color={Color.WHITE} size={20} />
            </View>
            <Text style={{ color: 'white', fontSize: 16 }}>£ 0.00</Text>
            <View
              style={{
                height: 20,
                width: 2,
                backgroundColor: Color.GRAY,
                borderRadius: 2,
              }}
            />
            <View>
              <Text style={{ color: 'white', fontSize: 1 }}>1 (1)</Text>
              <Text style={{ color: 'white', fontSize: 10 }}>
                ITEMS (GROUP)
              </Text>
            </View>
          </TouchableOpacity>
          <View
            style={{
              height: 30,
              width: 3,
              backgroundColor: '#D1D1D1',
              borderRadius: 2,
            }}
          />
          <TouchableOpacity
            style={styles.circleRight}
            onPress={() => {
              navigation.navigate('BarCodeReader');
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#B71C1C', // red
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialDesignIcons
                name="barcode-scan"
                color={Color.WHITE}
                size={25}
              />
            </View>
          </TouchableOpacity>
        </View>
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
    bottom: 20,
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
});
export default DisplayItems;
