import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Color, FONT, IconData, ImageData } from '../Component/Image';
import Loader from '../Component/Loader';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { Api, ImageBaseUrl } from '../utility/api';
import debounce from 'lodash.debounce';
import { getData } from '../utility/ApiCall';
import FastImage from 'react-native-fast-image';

const SearchScreen = ({ navigation }) => {
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const LIMIT = 20; // Matches API per_page

  const fetchData = async (query, pageNumber = 1) => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }
    try {
      if (pageNumber === 1) setLoader(true);
      else setLoadingMore(true);

      const res = await getData(
        `${Api.SEARCH}?searchQuery=${encodeURIComponent(
          query,
        )}&page=${pageNumber}&limit=${LIMIT}`,
      );

      const data = res?.data?.data?.data || [];
      const currentPage = res?.data?.data?.current_page || 1;
      const last_page = res?.data?.data?.last_page || 1;

      if (pageNumber === 1) {
        setResults(data);
      } else {
        setResults(prev => [...prev, ...data]);
      }

      setPage(currentPage);
      setLastPage(last_page);
    } catch (err) {
      console.log(err);
    } finally {
      setLoader(false);
      setLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(text => fetchData(text, 1), 500),
    [],
  );
  const handleSearch = text => {
    setSearch(text);

    if (text.trim().length > 0) {
      debouncedSearch(text);
    } else {
      debouncedSearch.cancel(); // cancel pending API calls
      setResults([]);
    }
  };
  const loadMore = () => {
    if (!loadingMore && page < lastPage) {
      fetchData(search, page + 1);
    }
  };

  // const renderItem = ({ item }) => {
  //   // const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

  //   const imageUrl = item?.image ? ImageBaseUrl + item.image : null;
  //   return (
  //     // <View style={styles.itemRow}>
  //     //   {imageUrl ? (
  //     //     <>
  //     //       <FastImage
  //     //         style={styles.itemImage}
  //     //         source={{
  //     //           uri: imageUrl,
  //     //           priority: FastImage.priority.normal,
  //     //           cache: FastImage.cacheControl.immutable,
  //     //         }}
  //     //         resizeMode={FastImage.resizeMode.cover}
  //     //       />
  //     //     </>
  //     //   ) : (
  //     //     <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
  //     //   )}

  //     //   <View style={styles.itemTextContainer}>
  //     //     <Text style={styles.itemName}>{item.name}</Text>
  //     //     <Text style={styles.itemPrice}>£ {item.price}</Text>
  //     //   </View>
  //     // </View>
  //     <View style={styles.itemRow}>
  //       {imageUrl && !error ? (
  //         <FastImage
  //           style={styles.itemImage}
  //           source={{
  //             uri: imageUrl,
  //             priority: FastImage.priority.normal,
  //             cache: FastImage.cacheControl.immutable,
  //           }}
  //           resizeMode={FastImage.resizeMode.cover}
  //           onError={() => setError(true)} // fallback trigger
  //         />
  //       ) : (
  //         <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
  //       )}

  //       <View style={styles.itemTextContainer}>
  //         <Text style={styles.itemName}>{item.name}</Text>
  //         <Text style={styles.itemPrice}>£ {item.price}</Text>
  //       </View>
  //     </View>
  //   );
  // };

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
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        ) : (
          <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
        )}

        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>£ {item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleItemPress = item => {
    navigation.navigate('DisplayItems', { itemData: item });
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

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
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountProfile')}
            style={styles.iconButton}
          >
            <Ionicons name={'menu'} size={moderateScale(25)} />
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
          <TextInput
            value={search}
            onChangeText={text => {
              handleSearch(text);
            }}
            placeholder="Search Term"
            style={styles.searchInput}
          />
        </View>
      </View>

      <Text style={styles.resultText}>{results.length} Results Found</Text>

      <FlatList
        data={results}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: moderateScale(120),
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore && <Text style={{ textAlign: 'center' }}>Loading...</Text>
        }
      />

      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.circleLeft}
          onPress={() => navigation.navigate('AddCartScreen')}
        >
          <View style={styles.circleLeft1}>
            <MaterialDesignIcons name="cart" color={Color.WHITE} size={20} />
          </View>
          <Text style={{ color: 'white', fontSize: 16 }}>£ 0.00</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleRight}
          onPress={() => navigation.navigate('BarCodeReader')}
        >
          <View style={styles.barcodeIcon}>
            <MaterialDesignIcons
              name="barcode-scan"
              color={Color.WHITE}
              size={25}
            />
          </View>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: { width: '90%', height: moderateScale(45) },
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
  searchInput: {
    fontSize: moderateScale(14),
    flex: 1,
    paddingHorizontal: moderateScale(10),
  },
  resultText: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    color: Color.RED,
    fontFamily: FONT.BOLD,
    fontSize: moderateScale(20),
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
  bottomCard: {
    position: 'absolute',
    bottom: moderateScale(20),
    width: '75%',
    height: moderateScale(50),
    flexDirection: 'row',
    backgroundColor: Color.WHITE,
    borderRadius: moderateScale(40),
    elevation: 5,
    left: '12.5%',
    alignItems: 'center',
    padding: moderateScale(5),
    gap: moderateScale(5),
  },
  circleLeft: {
    width: '75%',
    height: moderateScale(45),
    borderRadius: moderateScale(50),
    backgroundColor: '#3D3D3D',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(5),
  },
  circleLeft1: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(3),
  },
  circleRight: {
    width: '20%',
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;
