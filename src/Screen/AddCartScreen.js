

import {
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Animated,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';

const AddCartScreen = ({ navigation }) => {
  const [searchActive, setSearchActive] = useState(false);
  const logoAnim = useRef(new Animated.Value(1)).current;
  const searchAnim = useRef(new Animated.Value(-300)).current;

  const [cartItems, setCartItems] = useState([
    { id: '1', name: '63x38mm (3x2) CLS Studding', price: 101.33, qty: 1 },
    { id: '2', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '3', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '4', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '5', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '6', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '7', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '8', name: 'Test new product', price: 101.33, qty: 1 },
    { id: '9', name: 'Test new product', price: 101.33, qty: 1 },
  ]);

  const toggleSearch = () => {
    if (!searchActive) {
      setSearchActive(true);
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(searchAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(searchAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setSearchActive(false));
    }
  };

  const increment = id => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item,
      ),
    );
  };

  const decrement = id => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item,
      ),
    );
  };

  const removeItem = id => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cashTendered = 500;

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
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.leftContainer}>
            {searchActive ? (
              <Animated.View
                style={[
                  styles.searchContainer,
                  { transform: [{ translateX: searchAnim }] },
                ]}
              >
                <TextInput style={styles.searchInput} placeholder="Search..." />
              </Animated.View>
            ) : (
              <Image
                source={IconData.Logo}
                style={styles.logo}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
              <Image source={IconData.Search} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Image source={IconData.Menu} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Back button + Items */}
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
            <Text>{cartItems.length} Items</Text>
            <Text>{cartItems.length} Groups</Text>
          </View>
        </View>

        <FlatList
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cartRowWrapper}>
              <View style={styles.topRow}>
                <Text style={styles.productName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>

              <View style={styles.cartRow}>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => decrement(item.id)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyCount}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => increment(item.id)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Price and Total */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceText}>
                      x £{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceText}>
                      - £{(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
        <TouchableOpacity style={styles.miscBtn}>
          <Text style={styles.miscText}>Add Miscellaneous Charges</Text>
        </TouchableOpacity>
        <View style={styles.totalContainer}>
          <View>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>- £{total.toFixed(2)}</Text>
          </View>
          <View style={styles.cashBox}>
            <Text style={styles.cashLabel}>CASH TENDERED</Text>
            <View style={styles.cashInputRow}>
              <Text style={styles.cashSymbol}>£</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                defaultValue={String(cashTendered)}
              />
            </View>
            <Text style={styles.changeText}>
              Change To Give:{' '}
              <Text style={styles.changeValue}>
                £{(cashTendered - total).toFixed(2)}
              </Text>
            </Text>
          </View>
        </View>
        <View style={styles.bottomBtn}>
          <TouchableOpacity
          onPress={()=>{
            navigation.navigate("CustomerDetails")
          }}
            style={{
              width: '50%',
              height: moderateScale(48),
              backgroundColor: Color.RED,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'flex-end',
              borderRadius:4
            }}
          >
            <Text style={styles.bottomBtnText}>Customer Information</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  searchContainer: { marginLeft: moderateScale(5), flex: 1 },
  searchInput: {
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logo: { width: '90%', height: moderateScale(45) },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: moderateScale(40), height: moderateScale(40) },
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
  tab: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) },

  cartRowWrapper: {
    // marginBottom: 10,
    justifyContent: 'center',
    padding: moderateScale(10),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qtyButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  qtyCount: {
    paddingHorizontal: moderateScale(16),
    fontSize: 16,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    marginLeft: moderateScale(10),
  },
  priceBox: {
    backgroundColor: '#fff',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: moderateScale(6),
    borderRadius: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  miscBtn: {
    backgroundColor: '#3D3D3D',
    padding: 12,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  miscText: { color: '#fff', fontWeight: '600' },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: moderateScale(15),
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  cashBox: { alignItems: 'flex-end' },
  cashLabel: { fontSize: 14, fontWeight: '600' },
  cashInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashSymbol: { fontSize: 16, marginRight: 5 },
  cashInput: { fontSize: 16, minWidth: moderateScale(60) },
  changeText: { fontSize: 14 },
  changeValue: { color: 'red', fontWeight: '600' },

  bottomBtn: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(10),
    alignItems: 'center',
    borderTopWidth: 1, // 👈 adds a top border
    borderTopColor: Color.GRAY2,
  },
  bottomBtnText: { color:Color.WHITE, fontSize: 14, fontFamily:FONT.SEMIBOLD  },
});

export default AddCartScreen;
