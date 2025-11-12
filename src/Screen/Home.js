import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../Redux/Slice/ProductMenuSlice';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../Component/Loader';
import { showToast } from '../utility/showToast';
import { usePermissions } from '../Component/usePermissions';
import CartComponent from '../Component/CartComponent';
import { Color, FONT, IconData } from '../Component/Image';
import { clearProducts } from '../Redux/Slice/ProductListSlice';

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(state => state.product);

  const { hasPermission } = usePermissions();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          await dispatch(fetchProducts()).unwrap(); // unwrap gives real error
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
    }, [dispatch]),
  );
  const [expanded, setExpanded] = useState(0);

  const toggleExpand = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
  };
  const ITEM_HEIGHT = moderateScale(100); // height of each item including padding/margin
  const ITEMS_PER_ROW = 3;

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

        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SearchScreen');
            }}
            style={styles.iconButton}
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
            <Ionicons name={'menu'} size={moderateScale(25)} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: moderateScale(90) }}
        showsVerticalScrollIndicator={false}
      >
        {products.map((category, index) => (
          <View key={category.id || index} style={styles.card}>
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.header,
                expanded === (category.id || index) && styles.headerActive,
              ]}
              onPress={() => toggleExpand(category?.id || index)}
            >
              <Text
                style={[
                  styles.title,
                  expanded === (category.id || index) && styles.titleActive,
                ]}
              >
                {category?.main_heading}
              </Text>
              <View>
                <Ionicons
                  name={
                    expanded === (category.id || index)
                      ? 'chevron-down'
                      : 'chevron-up'
                  }
                  size={moderateScale(20)}
                  color={expanded === (category.id || index) ? '#fff' : '#000'}
                />
                <Ionicons
                  name={
                    expanded === (category.id || index)
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={moderateScale(20)}
                  color={expanded === (category.id || index) ? '#fff' : '#000'}
                  style={{ top: -12 }}
                />
              </View>
            </TouchableOpacity>

            {expanded === (category.id || index) &&
              category?.product_data?.length > 0 && (
                <FlatList
                  data={category.product_data}
                  numColumns={3}
                  keyExtractor={(item, idx) => idx.toString()}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: moderateScale(350) }}
                  contentContainerStyle={{ paddingBottom: moderateScale(10) }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemBox}
                      onPress={() => handleItemPress(item)}
                    >
                      <Text style={styles.itemText}>
                        {item.epos_tile_title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
          </View>
        ))}
      </ScrollView>
      <CartComponent />

      {products?.length <= 0 && <Loader visible={loading} />}
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  logo: {
    width: '90%',
    height: moderateScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '10@s',
  },
  menuButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '10@s',
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden', // prevents search bar from covering icons
  },
  searchContainer: {
    marginLeft: 10,
    flex: 1, // take remaining space next to logo
  },
  searchInput: {
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '15@s',
    alignItems: 'center',
  },
  headerActive: {
    backgroundColor: '#000',
  },
  title: {
    fontSize: '16@ms',

    color: '#333',
    flex: 1,
    paddingRight: '10@s',
    fontFamily: FONT.MEDIUM,
  },
  titleActive: {
    color: '#fff',
  },
  itemsContainer: {
    padding: '10@s',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemBox: {
    flex: 1,
    margin: '5@s',
    paddingVertical: '10@vs',
    backgroundColor: '#f4c69f',
    borderRadius: '6@ms',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '90@s',
  },
  itemText: {
    fontSize: '14@ms',
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
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

export default Home;
