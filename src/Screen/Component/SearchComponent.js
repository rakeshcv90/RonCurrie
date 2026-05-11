import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  StatusBar,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
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
import {
  triggerCartRefresh,
  fetchCartData,
  setSkipAutoBack,
  triggerMiscRefresh,
} from '../../Redux/Slice/CartDataShowSlice';
import CategoryComponent from './CategoryComponent';
import { useRoute } from '@react-navigation/native';
const SearchComponent = forwardRef(
  (
    { onResults, onLoadMoreRef, navigation, autoFocus = false, onNoResults },
    ref,
  ) => {
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loader, setLoader] = useState(false);
    const [results, setResults] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const LIMIT = 20;
    const searchInputRef = useRef(null);
    const lastScannedRef = useRef('');

    const isProcessingBarcodeRef = useRef(false);
    const barcodeBufferRef = useRef('');
    const [allowKeyboard, setAllowKeyboard] = useState(false);
    const dispatch = useDispatch();
    const route = useRoute();
    const lastValidBarcodeRef = useRef('');
    const lastScanTimeRef = useRef(0);
    const isNavigatingRef = useRef(false);
    const barcodeQueueRef = useRef([]);
    const userDataRef = useRef(userData);

    // Keep userDataRef in sync
    useEffect(() => {
      userDataRef.current = userData;
    }, [userData]);

    useEffect(() => {
      if (searchText.length === 0) {
        lastScannedRef.current = '';
      }
    }, [searchText]);
    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        searchInputRef.current?.focus();
      });

      return unsubscribe;
    }, [navigation]);
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

    const handleSearch = useCallback(() => {
      if (!searchText.trim()) {
        showToast('danger', 'Please enter a search term');
        setResults([]);
        onResults?.([]);
        return;
      }
      fetchData(searchText, 1);
    }, [searchText]);
    const clearSearch = useCallback(() => {
      setSearchText('');
      setResults([]);
      setNoResults(false);
      onResults?.([]);
      onNoResults?.(false);
      searchInputRef.current?.clear();
      Keyboard.dismiss();
    }, []);
    const fetchData = useCallback(async (query, pageNumber = 1) => {
      try {
        pageNumber === 1 ? setLoader(true) : setLoadingMore(true);

        const res = await getData(
          `${Api.SEARCH}?searchQuery=${encodeURIComponent(
            query,
          )}&page=${pageNumber}&limit=${LIMIT}`,
        );
        console.log('Test', res);
        const response = res?.data?.data;
        let extracted = [];
        let currentPage = 1;
        let last_page = 1;

        // Extract data first
        if (Array.isArray(response?.data)) {
          extracted = response.data;
          currentPage = response.current_page || 1;
          last_page = response.last_page || 1;
        } else if (response && typeof response === 'object') {
          extracted = [response];
        }

        // Then check if no results
        if (extracted.length === 0) {
          setNoResults(true);
          onNoResults?.(query);
          if (pageNumber === 1) {
            setResults([]);
            onResults?.([]);
          }
        } else {
          setNoResults(false);
          onNoResults?.(false);

          if (pageNumber === 1) {
            setResults(extracted);
            onResults?.(extracted);
          } else {
            setResults(prev => {
              const merged = [...prev, ...extracted];
              onResults?.(merged);
              return merged;
            });
          }

          setPage(currentPage);
          setLastPage(last_page);
        }
      } catch (err) {
        showToast('danger', 'Error', err.message || 'Something went wrong');
      } finally {
        setLoader(false);
        setLoadingMore(false);
      }
    }, []);

    const loadMore = useCallback(() => {
      if (!loadingMore && page < lastPage) {
        fetchData(searchText, page + 1);
      }
    }, [loadingMore, page, lastPage, searchText, fetchData]);

    useEffect(() => {
      if (onLoadMoreRef) {
        onLoadMoreRef(() => loadMore);
      }
    }, [onLoadMoreRef, loadMore]);

    // ✅ expose clear function to parent
    useImperativeHandle(ref, () => ({
      clearSearch: () => {
        setSearchText('');
        setResults([]);
        setNoResults(false);
        onResults?.([]);
        onNoResults?.(false);
        searchInputRef.current?.clear();
        Keyboard.dismiss();

        // optional refocus
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      },
    }));
    // Process a single barcode scan (internal, called by the queue processor)
    const processSingleBarcode = useCallback(
      async barcode => {
        try {
          let customerId = userDataRef.current?.customer_id;
          if (!customerId) {
            const storedUser = await MMKVStorage.getItem('User_Data');
            customerId = storedUser?.customer_id;
            if (storedUser) {
              setUserData(storedUser);
            }
          }

          if (!customerId) return;

          const response = await postData(Api.BAR_CODE_SCANNER, {
            customer_id: customerId,
            bar_code: barcode,
            order_mode: 'add',
          });

          dispatch(setSkipAutoBack(true));
          dispatch(triggerCartRefresh());
          dispatch(triggerMiscRefresh());

          if (route.name !== 'AddCartScreen') {
            navigation.navigate('AddCartScreen');
          }

          dispatch(fetchCartData(customerId));
        } catch (error) {
          const errorData = error?.response?.data;
          if (errorData?.message) {
            showToast('danger', 'Scan Error', errorData.message);
          }
        }
      },
      [dispatch, navigation, route.name],
    );

    // Queue processor — drains barcodes one at a time
    const processQueue = useCallback(async () => {
      if (isProcessingBarcodeRef.current) return;
      if (barcodeQueueRef.current.length === 0) return;

      isProcessingBarcodeRef.current = true;

      while (barcodeQueueRef.current.length > 0) {
        const nextBarcode = barcodeQueueRef.current.shift();
        await processSingleBarcode(nextBarcode);
      }

      isProcessingBarcodeRef.current = false;

      // Clean up input after all queued scans are done
      barcodeBufferRef.current = '';
      setSearchText('');
      searchInputRef.current?.clear();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }, [processSingleBarcode]);

    // Public function called by onSubmitEditing
    const searchByBarcode = useCallback(
      barcode => {
        if (!barcode) return;

        const trimmed = barcode.trim();
        if (!trimmed) return;

        // Deduplicate: skip if same barcode scanned within 1 second
        const now = Date.now();
        if (
          trimmed === lastValidBarcodeRef.current &&
          now - lastScanTimeRef.current < 1000
        ) {
          setSearchText('');
          searchInputRef.current?.clear();
          return;
        }

        lastValidBarcodeRef.current = trimmed;
        lastScanTimeRef.current = now;

        // Clear input immediately so scanner can buffer next code
        setSearchText('');
        barcodeBufferRef.current = '';
        searchInputRef.current?.clear();

        // Push to queue and start processing
        barcodeQueueRef.current.push(trimmed);
        processQueue();
      },
      [processQueue],
    );

    const handleLogoPress = useCallback(() => {
      if (isNavigatingRef.current) return;

      if (route.name !== 'Home') {
        isNavigatingRef.current = true;
        Keyboard.dismiss();

        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            }),
          );
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }, 50);
      }
    }, [navigation, route.name]);

    const handleMenuPress = useCallback(() => {
      if (isNavigatingRef.current) return;

      isNavigatingRef.current = true;
      Keyboard.dismiss();

      setTimeout(() => {
        if (route.name === 'AccountProfile') {
          navigation.goBack();
        } else {
          navigation.navigate('AccountProfile');
        }
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }, 50);
    }, [navigation, route.name]);

    return (
      <View style={styles.headerContainer}>
        <StatusBar
          backgroundColor="#F6F6F6"
          barStyle="dark-content"
          translucent={false}
        />
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.logoCircle}
            onPress={handleLogoPress}
            activeOpacity={0.7}
            focusable={false}
          >
            <Image
              source={ImageData.New_Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            placeholder="Search products"
            style={styles.searchInput}
            placeholderTextColor="#777"
            showSoftInputOnFocus={allowKeyboard}
            value={searchText}
            autoFocus={false}
            // returnKeyType="search"
            returnKeyType="done"
            onChangeText={text => {
              setSearchText(text);
              // // barcodeBufferRef.current = text;

              if (!text.trim()) {
                setResults([]);
                setNoResults(false);
                onResults?.([]);
                onNoResults?.(false);
              }
            }}
            onSubmitEditing={e => {
              const code = e.nativeEvent.text.trim();

              if (code?.length >= 12) {
                searchByBarcode(code);
              } else {
                Keyboard.dismiss();
              }
            }}
            onTouchStart={() => {
              setAllowKeyboard(true); // enable keyboard when user taps
            }}
          />
          <TouchableOpacity
            style={styles.redSearchBtn}
            onPress={() => {
              Keyboard.dismiss();
              handleSearch();
            }}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => {
            if (route.name === 'AccountProfile') {
              navigation.goBack();
            } else {
              navigation.navigate('AccountProfile');
            }
          }}
        >
          <Ionicons
            name={route.name === 'AccountProfile' ? 'close' : 'menu'}
            size={25}
            color="#000"
          />
        </TouchableOpacity>
        <Loader visible={loader} />
      </View>
    );
  },
);

const styles = ScaledSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(5),

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
export default React.memo(SearchComponent);
