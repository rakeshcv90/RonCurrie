import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { Color, IconData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

import { showToast } from '../utility/showToast';

import { useDispatch, useSelector } from 'react-redux';
import {
  clearReturnDisplayProducts,
  fetchOrderReturnDisplay,
} from '../Redux/Slice/OrderReturnDisplaySlice';

const ReturnRequestDetails = ({ navigation, route }) => {
  const order_id = route?.params?.orderItem;
  const [loader, setLoader] = useState(false);

  const dispatch = useDispatch();
  const { orderReturnDisplay, loading, error } = useSelector(
    state => state.returnDetails,
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        dispatch(clearReturnDisplayProducts());
        try {
          await dispatch(fetchOrderReturnDisplay(order_id?.return_id)).unwrap();
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

  const formatDate = dateString => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
          activeOpacity={0.7}
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={'arrow-back'}
            size={moderateScale(20)}
            color={Color.GRAY}
          />
        </TouchableOpacity>

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
      <ScrollView
        style={styles.container1}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Return Information</Text>

        <Text style={styles.sectionTitle}>Return Details</Text>

        <View
          style={[
            styles.tableBox,
            { borderRadius: '6@s', backgroundColor: '#FAFAFA' },
          ]}
        >
          <View style={styles.row}>
            <Text style={styles.label}>Return ID:</Text>
            <Text style={styles.value}>#{orderReturnDisplay?.return_id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date Added:</Text>
            <Text style={styles.value}>
              {formatDate(orderReturnDisplay?.date_added)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Order ID:</Text>
            <Text style={styles.value}>{orderReturnDisplay?.order_id}</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>
              {' '}
              {formatDate(orderReturnDisplay?.date_ordered)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Product Information & Reason for Return
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Product Name</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Model</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Quantity</Text>
        </View>

        <View style={styles.tableBox}>
          <View style={[styles.row1]}>
            <Text style={[styles.value, { flex: 2 }]}>
              {orderReturnDisplay?.product}
            </Text>
            <Text style={[styles.value, { flex: 1 }]}>
              {orderReturnDisplay?.model}
            </Text>
            <Text style={[styles.value, { flex: 1 }]}>
              {orderReturnDisplay?.quantity}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Reason</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Opened</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Action</Text>
        </View>

        <View style={styles.tableBox}>
          <View style={[styles.row1]}>
            <Text style={[styles.value, { flex: 2 }]}>
              {orderReturnDisplay?.return_reason?.name}
            </Text>
            <Text style={[styles.value, { flex: 1 }]}>
              {' '}
              {orderReturnDisplay?.opened == 0 ? 'Yes' : 'No'}
            </Text>
            <Text style={[styles.value, { flex: 1 }]}>
              {orderReturnDisplay?.return_action === null
                ? ''
                : orderReturnDisplay?.return_action?.name}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order History</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 1 }]}>Date Added</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Order Status</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Comment</Text>
        </View>

        <View style={styles.tableBox}>
          <View style={[styles.row1]}>
            {orderReturnDisplay?.histories?.length > 0 ? (
              orderReturnDisplay.histories.map((item, index) => (
                <View style={styles.row} key={index}>
                  <Text style={[styles.value, { flex: 1 }]}>
                    {formatDate(item?.date_added) || '-'}
                  </Text>

                  <Text style={[styles.value, { flex: 1 }]}>
                    {item?.status}
                  </Text>

                  <Text style={[styles.value, { flex: 1 }]}>
                    {item?.comment || '-'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>No history found</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  container1: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '10@s',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    gap: 10,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: { width: '80%', height: moderateScale(40) },
  back:{
        width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '22@s',
    fontWeight: '700',
    color: '#7A0A0A',
    marginBottom: '15@s',
  },

  sectionTitle: {
    fontSize: '15@s',
    fontWeight: '600',
    color: '#555',

    marginBottom: '8@s',
  },

  tableBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',

    marginBottom: '20@s',
  },

  row: {
    flexDirection: 'row',
    paddingVertical: '10@s',
    paddingHorizontal: '12@s',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingVertical: '10@s',
    paddingHorizontal: '12@s',
  },
  label: {
    flex: 1,
    fontSize: '13@s',
    fontWeight: '600',
    color: '#666',
  },

  value: {
    flex: 1,
    fontSize: '13@s',
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: '10@s',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: '6@s',
    borderTopRightRadius: '6@s',
  },

  headerText: {
    fontSize: '13@s',
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    // paddingLeft: '10@s',
  },

  continueButton: {
    backgroundColor: '#7A0A0A',
    paddingVertical: '12@s',
    paddingHorizontal: '20@s',
    borderRadius: '6@s',
    alignSelf: 'flex-end',
    marginTop: '10@s',
    marginBottom: '40@s',
  },

  continueText: {
    fontSize: '15@s',
    color: '#fff',
    fontWeight: '700',
  },
});

export default React.memo(ReturnRequestDetails);
