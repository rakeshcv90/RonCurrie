import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { showToast } from '../utility/showToast';
import {
  clearProducts,
  fetchOrderDisplay,
} from '../Redux/Slice/OrderDisplaySlice';
import Loader from '../Component/Loader';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import PrintModel from './Component/PrintModel';
import { triggerCartRefresh } from '../Redux/Slice/CartDataShowSlice';

const OrderHistoryDetails = ({ navigation, route }) => {
  const order_id = route?.params?.orderItem;
  const [loader, setLoader] = useState(false);
  const [printVisible, setPrintVisible] = useState(false);
  const dispatch = useDispatch();
  const { orderDisplay, loading, error } = useSelector(
    state => state.displorder,
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        dispatch(clearProducts());
        try {
          await dispatch(fetchOrderDisplay(order_id?.order_id)).unwrap();
        } catch (error) {
          if (error.type === 'network') {
            showToast('danger', 'Network Error', error.message);
          } else if (error.type === 'response') {
            showToast('danger', 'API Error', error.message);
          } else {
            showToast(
              'danger',
              'Unexpected Error',
              error.message || 'Something went wrong',
            );
          }
        }
      };
      fetchData();
    }, [dispatch, order_id, navigation]),
  );
  const reOrderItem = async itemData => {
    setLoader(true);
    try {
      const order_product_id = itemData?.order_product_id;
      const order_id = orderDisplay?.order_id;

      const responseData = await postData(Api.RE_ORDER_PRODUCT, {
        order_id,
        order_product_id,
      });

      if (responseData?.data != undefined) {
        setLoader(false);
        if (responseData?.status == 200) {
          showToast('success', 'Success!', responseData?.data?.message);
            dispatch (triggerCartRefresh());
        } else {
          showToast('danger', 'Network Error', 'Something went wrong');
        }
      } else {
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Request Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

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

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.resetBtn} activeOpacity={0.7}>
            <Text style={styles.btnText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.orderBtn}
            activeOpacity={0.7}
            onPress={() => {
            
              setPrintVisible(true);
            }}
          >
            <Text style={styles.btnText}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>
            Order ID -{' '}
            <Text style={styles.orderIdRed}>#{order_id?.order_id}</Text>
          </Text>
          <Text style={styles.orderText}>Date: {order_id?.date_added}</Text>
          <Text style={styles.orderText}>Payment Method: epos_system</Text>
          <Text style={styles.orderText}>Delivery Method: collection</Text>
          <Text style={styles.orderText}>Payment Address: --------</Text>
        </View>

        {orderDisplay?.products?.map((item, index) => {
          return (
            <View key={index} style={{ flex: 1 }}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>QUANTITY</Text>
                <Text style={styles.tableTitle}>PRICE</Text>
                <Text style={styles.tableTitle}>TOTAL</Text>
              </View>

              <View>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item?.name}</Text>
                    <Text style={styles.itemModel}>
                      Model: <Text style={styles.modelRed}>{item?.model}</Text>
                    </Text>

                    {item?.option && Object.keys(item.option).length > 0 && (
                      <>
                        <Text style={styles.itemModel}>
                          Name:{' '}
                          <Text style={styles.modelRed}>
                            {item?.option?.name}
                          </Text>
                        </Text>
                        <Text style={styles.itemModel}>
                          Value:{' '}
                          <Text style={styles.modelRed}>
                            {item?.option?.value}
                          </Text>
                        </Text>
                      </>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                      reOrderItem(item);
                    }}
                  >
                    <Image
                      source={IconData.CART}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                      navigation.navigate('ReturnScreen', {
                        orderData: item,
                        productData: orderDisplay,
                      });
                    }}
                  >
                    <Image
                      source={IconData.REORDER}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.tableHeader,
                    {
                      paddingVertical: moderateScale(5),
                      marginTop: moderateScale(2),
                      alignItems: 'center',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.qtyBox,
                      { marginHorizontal: moderateScale(6) },
                    ]}
                  >
                    <Text style={styles.qtyText}>{item?.quantity}</Text>
                  </View>
                  <Text
                    style={[styles.itemPrice, { left: -moderateScale(20) }]}
                  >
                    x £{item?.price}
                  </Text>
                  <Text
                    style={[styles.itemPrice, { left: -moderateScale(50) }]}
                  >
                    - £{item?.price * item?.quantity}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {orderDisplay?.totals?.length > 0 && (
          <View style={styles.summaryBox}>
            {orderDisplay?.totals?.map((item, index) => (
              <Text
                key={index}
                style={
                  item.title.toLowerCase().includes('total')
                    ? styles.summaryText
                    : styles.summaryText
                }
              >
                {item.title}:{' '}
                <Text
                  style={
                    item.title.toLowerCase().includes('total')
                      ? styles.summaryValue
                      : styles.summaryValue
                  }
                >
                  £{item.value}
                </Text>
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <PrintModel
        visible={printVisible}
        onClose={() => setPrintVisible(false)}
        printData={order_id?.order_id}
        onConfirm={async data => {
          setLogoutVisible(false);
        }}
      />
      {<Loader visible={loading || loader} />}
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logo: { width: '80%', height: moderateScale(40) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(10),
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
  buttonRow: { flexDirection: 'row' },
  resetBtn: {
    paddingHorizontal: 15,
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(10),
    borderRadius: moderateScale(4),
  },
  orderBtn: {
    paddingHorizontal: 15,
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(4),
  },
  btnText: {
    color: Color.WHITE,
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
  orderInfo: {
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(10),
  },
  orderId: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(4),
  },
  orderIdRed: { color: Color.RED },
  orderText: {
    fontFamily: FONT.REGULAR,
    fontSize: moderateScale(13),
    color: Color.GRAY,
    marginBottom: moderateScale(2),
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(15),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: moderateScale(5),
    borderColor: Color.GRAY2,
  },
  tableTitle: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderColor: Color.GRAY3,
  },
  itemTitle: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(13),
    marginBottom: moderateScale(2),
  },
  itemModel: { fontFamily: FONT.REGULAR, fontSize: moderateScale(12) },
  modelRed: { color: Color.RED },
  qtyBox: {
    borderWidth: 1,
    borderColor: Color.GRAY3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(12),
    color: Color.BLACK,
  },
  itemPrice: {
    fontSize: moderateScale(12),
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    marginHorizontal: moderateScale(5),
  },
  iconBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderWidth: 1,
    borderColor: Color.GRAY3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(6),
  },
  summaryBox: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: moderateScale(30),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  summaryText: {
    fontFamily: FONT.REGULAR,
    fontSize: moderateScale(13),
    color: Color.GRAY,
    marginBottom: moderateScale(5),
  },
  summaryValue: { fontFamily: FONT.SEMIBOLD, color: Color.BLACK },
  totalText: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(15),
    marginTop: moderateScale(10),
  },
  totalAmount: { color: Color.RED, fontFamily: FONT.SEMIBOLD },
});

export default React.memo(OrderHistoryDetails);
