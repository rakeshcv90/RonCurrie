import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  StatusBar,
   KeyboardAvoidingView, Platform
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { ImageData } from '../../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getData, postData } from '../../utility/ApiCall';
import { Api } from '../../utility/api';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { showToast } from '../../utility/showToast';
import Loader from '../../Component/Loader';
import { MMKVStorage } from '../../utility/MmkvStore';
import { useDispatch } from 'react-redux';
import { triggerCartRefresh } from '../../Redux/Slice/CartDataShowSlice';
const SearchComponent = ({
  onResults,
  onLoadMoreRef,
  navigation,
  autoFocus = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loader, setLoader] = useState(false);
  const [results, setResults] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;
  const searchInputRef = useRef(null);
  const lastScannedRef = useRef('');
  const isBarcodeScanRef = useRef(false);
  const isProcessingBarcodeRef = useRef(false);
  const barcodeBufferRef = useRef('');

  const dispatch = useDispatch();
  useEffect(() => {
    if (searchText.length === 0) {
      lastScannedRef.current = '';
    }
  }, [searchText]);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await MMKVStorage.getItem('User_Data');
      setUserData(data);
    };
    searchInputRef.current?.focus();

    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!autoFocus) return;

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Android safe delay

      return () => clearTimeout(timer);
    }, [autoFocus]),
  );
  const handleSearch = () => {
    if (!searchText.trim()) {
      showToast('danger', 'Please enter a search term');
      setResults([]);
      return;
    }

    fetchData(searchText, 1);
  };

  const fetchData = async (query, pageNumber = 1) => {
    try {
      if (pageNumber === 1) setLoader(true);
      else setLoadingMore(true);

      const res = await getData(
        `${Api.SEARCH}?searchQuery=${encodeURIComponent(
          query,
        )}&page=${pageNumber}&limit=${LIMIT}`,
      );

      const response = res?.data?.data;
      let extracted = [];
      let currentPage = 1;
      let last_page = 1;

      if (Array.isArray(response?.data)) {
        extracted = response.data;
        currentPage = response.current_page || 1;
        last_page = response.last_page || 1;
      } else if (response && typeof response === 'object') {
        extracted = [response];
      }
      if (pageNumber === 1 && extracted.length === 0) {
        showToast('danger', 'No Results Found', 'No matching products found');
        setResults([]);
        onResults && onResults([]);
        setPage(1);
        setLastPage(1);
        return; // stop pagination
      }

      if (pageNumber === 1) {
        setResults(extracted);
        onResults && onResults(extracted); // <-- send results to Home

        if (extracted.length === 0) showToast('danger', res?.message);
      } else {
        const newResults = [...results, ...extracted];
        setResults(newResults);
        onResults && onResults(newResults); // <-- append results for pagination
      }

      setPage(currentPage);
      setLastPage(last_page);
    } catch (err) {
      console.log(err);
      showToast('danger', 'Error', err.message || 'Something went wrong');
    } finally {
      setLoader(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && page < lastPage) {
      fetchData(searchText, page + 1);
    }
  }, [loadingMore, page, lastPage, searchText]);
  useEffect(() => {
    onLoadMoreRef(() => loadMore);
  }, [loadMore]);
  // const searchByBarcode = async barcode => {
  //   if (!barcode) return;

  //   if (!barcode) {
  //     isProcessingBarcodeRef.current = false;
  //     return;
  //   }

  //   const payloadData = {
  //     customer_id: userData?.customer_id,
  //     bar_code: barcode,
  //     order_mode: 'add',
  //   };

  //   try {
  //     const response = await postData(Api.BAR_CODE_SCANNER, payloadData);

  //     if (
  //       response?.data?.success == true &&
  //       response?.data?.responseCode == 200
  //     ) {
  //       setTimeout(() => {
  //         dispatch(triggerCartRefresh());
  //         setSearchText('');
  //         searchInputRef.current?.focus();
  //         showToast(
  //           'success',
  //           'Success!',
  //           ` Item associated with the scanned barcode has been added to the cart successfully!`,
  //         );
  //       }, 300);
  //     } else {
  //       searchInputRef.current?.focus();
  //       showToast(
  //         'danger',
  //         'Error',
  //         `Barcode scanned is not of a listed product, please try againwith a different barcode`,
  //       );
  //     }

  //     searchInputRef.current?.focus();
  //   } catch (error) {
  //     showToast('danger', 'Error', error.message || 'Something went wrong');
  //   } finally {
  //     // 🔥 RESET EVERYTHING (CRITICAL)
  //     isProcessingBarcodeRef.current = false;
  //     barcodeBufferRef.current = '';
  //     setSearchText('');
  //     searchInputRef.current?.focus();
  //   }
  // };

  const searchByBarcode = async barcode => {
    if (!barcode || isProcessingBarcodeRef.current) return;

    isProcessingBarcodeRef.current = true;

    const payloadData = {
      customer_id: userData?.customer_id,
      bar_code: barcode,
      order_mode: 'add',
    };

    try {
      const response = await postData(Api.BAR_CODE_SCANNER, payloadData);
  

      const resData = response?.data;
    const cartItems = resData?.data?.data; 
      if (
        resData?.success === true &&
        resData?.responseCode === 200 &&
        Array.isArray(cartItems) &&
        cartItems.length > 0
      ) {
        dispatch(triggerCartRefresh());
        showToast('success', 'Success!', 'Item added to cart successfully');
      } else {
        showToast('danger', 'Error', 'Invalid barcode, please try again');
      }
    } catch (error) {
      showToast('danger', 'Error', 'Something went wrong');
    } finally {
      // 🔥 FULL RESET (CRITICAL)
      isProcessingBarcodeRef.current = false;
      barcodeBufferRef.current = '';
      setSearchText('');
      searchInputRef.current?.focus();
    }
  };
  return (
    <View style={styles.headerContainer}>
      <StatusBar
        translucent
        backgroundColor="#F6F6F6"
        barStyle="dark-content"
      />
      <View style={styles.leftContainer}>
        <TouchableOpacity
          style={styles.logoCircle}
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
            source={ImageData.New_Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        {/* <TextInput
          ref={searchInputRef}
          placeholder="Search Term"
          style={styles.searchInput}
          placeholderTextColor={'#777'}
          value={searchText}
          autoFocus={false}
          returnKeyType="search"
          onChangeText={text => {
            if (text.length === 0) {
              lastScannedRef.current = '';
              setSearchText('');
              setResults([]);
              onResults && onResults([]);
              return;
            }
            if (text.length >= 13) {
              lastScannedRef.current = text;
              searchByBarcode(text);
              return;
            }
            setSearchText(text);
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            handleSearch(); // 🔥 same API call
          }}
        /> */}
        {/* <TextInput
          ref={searchInputRef}
          placeholder="Search Term"
          style={styles.searchInput}
          placeholderTextColor="#777"
          value={searchText}
          autoFocus={false}
          returnKeyType="search"
          onChangeText={text => {
            // RESET
            if (text.length === 0) {
              lastScannedRef.current = '';
              isBarcodeScanRef.current = false;
              setSearchText('');
              setResults([]);
              onResults && onResults([]);
              return;
            }

            // ✅ BARCODE DETECTED
            if (text.length >= 13) {
              isBarcodeScanRef.current = true; // 🔥 mark barcode scan
              lastScannedRef.current = text;
              setSearchText(text);
              searchByBarcode(text);
              return;
            }

            // ✅ NORMAL TYPING
            isBarcodeScanRef.current = false;
            setSearchText(text);
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();

            // ❌ STOP search API if barcode already handled
            if (isBarcodeScanRef.current) {
              isBarcodeScanRef.current = false; // reset for next input
              return;
            }

            handleSearch();
          }}
        /> */}

        <TextInput
          ref={searchInputRef}
          placeholder="Search Term"
          style={styles.searchInput}
          placeholderTextColor="#777"
          value={searchText}
          returnKeyType="search"
          onChangeText={text => {
            setSearchText(text);
            barcodeBufferRef.current = text;

            if (text.trim().length === 0) {
              setResults([]);
              onResults && onResults([]);
              return;
            }
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            const value = barcodeBufferRef.current.trim();

            // 🔥 BARCODE ONLY ON ENTER
            if (value.length >= 13) {
              searchByBarcode(value);
              return;
            }

            handleSearch();
          }}
        />
        <TouchableOpacity
          style={styles.redSearchBtn}
          onPress={() => {
            handleSearch(), Keyboard.dismiss();
          }}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => {
          navigation.navigate('AccountProfile');
        }}
      >
        <Ionicons name="menu" size={25} color="#000" />
      </TouchableOpacity>
      <Loader visible={loader} />
    </View>
  );
};
const styles = ScaledSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(5),
    // marginVertical: moderateScale(2),
    backgroundColor: '#F6F6F6',
    height: verticalScale(70),
    borderBottomWidth: 2,
    borderColor: '#E7E7E7',
  },

  leftContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoCircle: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(42),
    borderWidth: 2,
    borderColor: '#002B45',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: moderateScale(40),
    height: moderateScale(40),
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginLeft: moderateScale(5),
    borderRadius: moderateScale(30),
    paddingHorizontal: moderateScale(5),
    borderWidth: 1,
    borderColor: '#ddd',
    height: moderateScale(40),
  },

  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    color: '#000',
  },

  redSearchBtn: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(35),
    backgroundColor: '#8A1A15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(42),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(10),
  },
});
export default SearchComponent;
