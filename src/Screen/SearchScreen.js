
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  Keyboard,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
 import { Color, FONT, IconData, ImageData } from '../Component/Image';
import { Api } from '../utility/api';
import debounce from 'lodash.debounce';
import { getData } from '../utility/ApiCall';
import { useFocusEffect } from '@react-navigation/native';

const SearchComponent = ({ onResults, onLoadMoreRef, navigation, autoFocus = false }) => {
  const [search, setSearch] = useState('');
  const [loader, setLoader] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  const searchInputRef = useRef(null);

  // Auto-focus when component mounts or when autoFocus prop changes
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Also auto-focus when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoFocus) {
        const timer = setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus])
  );

  const fetchData = async (query, pageNumber = 1) => {
    if (!query || query.trim() === '') {
      onResults([]);
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

      if (pageNumber === 1) {
        onResults(extracted);
      } else {
        onResults(prev => [...prev, ...extracted]);
      }

      setPage(currentPage);
      setLastPage(last_page);
    } catch (err) {
      console.log(err);
      onResults([]);
    } finally {
      setLoader(false);
      setLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(text => fetchData(text, 1), 500),
    []
  );

  const handleSearch = text => {
    setSearch(text);

    if (text.trim().length > 0) {
      debouncedSearch(text);
    } else {
      debouncedSearch.cancel();
      onResults([]);
    }
  };

  const loadMore = () => {
    if (!loadingMore && page < lastPage && search.trim().length > 0) {
      fetchData(search, page + 1);
    }
  };

  // Pass loadMore function to parent via ref
  useEffect(() => {
    if (onLoadMoreRef) {
      onLoadMoreRef(loadMore);
    }
  }, [page, lastPage, loadingMore, search]);

  const clearSearch = () => {
    setSearch('');
    onResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.leftContainer}
          onPress={() => navigation.navigate('Home')}
        >
          <Image
            source={IconData.Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountProfile')}
            style={styles.iconButton}
          >
            <Ionicons name={'menu'} size={moderateScale(25)} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.tab}>
          {/* <Ionicons
            name="search"
            size={moderateScale(20)}
            color={Color.GRAY}
            style={styles.searchIcon}
          /> */}
          <TextInput
            ref={searchInputRef}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search products..."
            style={styles.searchInput}
            autoFocus={autoFocus}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (search.trim().length > 0) {
                fetchData(search, 1);
              }
            }}
          />
          {/* {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={moderateScale(20)}
                color={Color.GRAY}
              />
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
  },
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
  logo: { 
    width: '90%', 
    height: moderateScale(45) 
  },
  rightIcons: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: Color.GRAY5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(10),
  },
  tab: {
    height: moderateScale(45),
    borderRadius: moderateScale(25),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    paddingHorizontal: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.WHITE,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: moderateScale(10),
  },
  searchInput: {
    fontSize: moderateScale(16),
    flex: 1,
    paddingHorizontal: moderateScale(10),
    fontFamily: FONT.REGULAR,
  },
});

export default SearchComponent;