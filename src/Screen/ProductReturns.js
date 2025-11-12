import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import Loader from '../Component/Loader';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReturnOrderList } from '../Redux/Slice/ReturnOrderListSlice';
import { showToast } from '../utility/showToast';

const ProductReturns = ({ navigation }) => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 15;
  const { returnOrderList, loading, hasMore } = useSelector(
    state => state.returnlisorder,
  );

  const [lastFetched, setLastFetched] = useState(null);
  const [loader, setLoader] = useState(false);
  const sampleData = [
    { return_id: 566, status: 'Pending', date: '06/11/2025', comment: '' },
    {
      return_id: 559,
      status: 'Pending',
      date: '21/10/2025',
      comment: 'D d d d ggg',
    },
    {
      return_id: 558,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'Teshnj',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 557,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
    {
      return_id: 55733,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    }, {
      return_id: 55788,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
     {
      return_id: 55733,
      status: 'Pending',
      date: '17/10/2025',
      comment: 'X x. X x',
    },
  ];

  const loadData = async (pageNumber = 1) => {
    try {
      await dispatch(fetchReturnOrderList({ limit })).unwrap();
      setLastFetched(Date.now());
    } catch (error) {
      showToast('danger', 'Error', error.message || 'Something went wrong');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fiveMinutes = 5 * 60 * 1000;
      const shouldRefresh =
        !lastFetched || Date.now() - lastFetched > fiveMinutes;

      if (shouldRefresh) {
        setPage(1);
        loadData(1);
      }
    }, [lastFetched]),
  );
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData(1);

    setRefreshing(false);
  };

  const formatDate = (dateString) => {
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
      {returnOrderList?.length > 0 ? (
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Product Return</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={[styles.cell, styles.borderRight]}>
                <Text style={styles.headerText}>RETURN ID</Text>
              </View>
              <View style={[styles.cell, styles.borderRight]}>
                <Text style={styles.headerText}>STATUS</Text>
              </View>

              <View style={styles.cell}>
                <Text style={styles.headerText}>DATE ADDED</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.headerText}>COMMENT</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.headerText}>ACTION</Text>
              </View>
            </View>

            <FlatList
              data={returnOrderList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: moderateScale(returnOrderList?.length >15?100:0),
              }}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    index === returnOrderList?.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={[styles.cell, styles.orderIdColumn]}>
                    <Text style={styles.orderId}>#{item?.return_id}</Text>
                  </View>
                  <View style={[styles.cell, styles.customerColumn]}>
                    <Text style={styles.customer}>{item?.return_status?.name}</Text>
                  </View>
                  <View style={[styles.cell, styles.dateColumn]}>
                    <Text style={styles.date}>{formatDate(item?.date_added)}</Text>
                  </View>
                  <View style={[styles.cell, styles.dateColumn]}>
                    <Text style={styles.date}>{item?.comment || '-'}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.cell, styles.reorderColumn]}
                    onPress={() => {
                      navigation.navigate('ReturnRequestDetails', {
                        orderItem: item,
                      });
                    }}
                  >
                    <Ionicons
                      name="eye"
                      size={moderateScale(20)}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              )}
              // onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              // ListFooterComponent={loading && <Loader visible={true} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          {Platform.OS == 'android' ? (
            <FastImage
              source={ImageData.NoData}
              style={{ width: 200, height: 200 }}
              resizeMode={FastImage.resizeMode.contain}
            />
          ) : (
            <Text style={styles.emptyText}>No items available</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
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
  tab: {
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    width: '85%',
    borderColor: Color.GRAY2,
    paddingHorizontal: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: moderateScale(20),
    fontFamily: FONT.BOLD,
    color: Color.RED,
    marginTop: moderateScale(10),
    marginLeft: moderateScale(10),
    marginBottom:moderateScale(10),
  },
  subTitle: {
    fontSize: moderateScale(14),
    color: Color.BLACK2,
    fontFamily: FONT.REGULAR,
    marginLeft: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  table: {
  
    marginHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
    // marginBottom: moderateScale(20),
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#D1D1D1',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#D1D1D1',
    backgroundColor: '#fff',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(5),
  },
  borderRight: {
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  headerText: {
    fontSize: moderateScale(11),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  orderId: {
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: 12,
  },
  customer: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: 12,
  },
  date: {
    color: Color.BLACK2,
    fontFamily: FONT.SEMIBOLD,
    fontSize: 10,
  },

  orderIdColumn: {
    width: '25%', // wider for readability
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  customerColumn: {
    width: '30%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  dateColumn: {
    width: '25%',
    borderRightWidth: 1,
    borderColor: '#F6F6F6',
  },
  reorderColumn: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: Color.GRAY5,
    borderLeftWidth: 1,
    borderColor: '#F6F6F6',
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
});
export default React.memo(ProductReturns);
