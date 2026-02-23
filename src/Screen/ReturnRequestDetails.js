import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet, moderateScale, verticalScale } from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

import { showToast } from '../utility/showToast';

import { useDispatch, useSelector } from 'react-redux';
import {
  clearReturnDisplayProducts,
  fetchOrderReturnDisplay,
} from '../Redux/Slice/OrderReturnDisplaySlice';
import SearchComponent from './Component/SearchComponent';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';

const ReturnRequestDetails = ({ navigation, route }) => {
  const order_id = route?.params?.orderItem;
  const [loader, setLoader] = useState(false);

  const dispatch = useDispatch();
  const { orderReturnDisplay, loading, error } = useSelector(
    state => state.returnDetails,
  );
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
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

const decodeHtml = text => {
  if (!text) return '';

  return text
    // remove HTML tags like <p>, <div>, etc.
    .replace(/<\/?[^>]+(>|$)/g, '')
    // decode entities
    .replace(/&quot;/g, '')
    .replace(/&apos;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // optional cleanup
    .replace(/["']/g, '')
    .trim();
};

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
  };

  const renderItem = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleItemPress(item)}
      >
        {imageUrl && !hasError ? (
          <FastImage
            style={styles.itemImage}
            source={{
              uri: imageUrl,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        ) : (
          <FastImage
            style={styles.itemImage}
            source={ImageData?.NOIMAGE}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        )}

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
  };

  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SearchComponent
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
      />
      {results?.length > 0 ? (
        <>
          <FlatList
            data={results}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) =>
              `${item.id || item.product_id || index}`
            }
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: moderateScale(120),
            }}
            onEndReached={() => loadMoreFunc && loadMoreFunc()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore && (
                <Text style={{ textAlign: 'center' }}>Loading...</Text>
              )
            }
          />
        </>
      ) : (
        <ScrollView
          style={styles.container1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: moderateScale(40) }}
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
                {orderReturnDisplay?.opened == 1 ? 'Yes' : 'No'}
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
            <Text style={[styles.headerText, { flex: 1 }]}>Status</Text>
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
{console.log("Order ",item)}
                    <Text style={[styles.value, { flex: 1 }]}>
                      {item?.return_status?.name}
                    </Text>

                    <Text style={[styles.value, { flex: 1 }]}>
                      {/* {item?.comment || '-'} */}
                     { decodeHtml(item?.comment)||'-' }
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.value}>No history found</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.replace('AccountProfile')}
            style={{
              marginBottom: 20,
              width: verticalScale(120),
              justifyContent: 'center',
              alignItems: 'center',
              height: verticalScale(35),
              alignSelf: 'flex-end',
              backgroundColor: Color.RED,
              borderRadius: 5,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: moderateScale(16),
                fontFamily: FONT.SEMIBOLD,
              }}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
});

export default React.memo(ReturnRequestDetails);
