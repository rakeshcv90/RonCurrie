import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import CartComponent from '../Component/CartComponent';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../Component/Image';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import SearchComponent from './Component/SearchComponent';
import { useDispatch } from 'react-redux';
import { clearProducts } from '../Redux/Slice/ProductListSlice';

const CategoryData = ({ route }) => {
  const listData = route?.params?.listDAta;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});

  const decodeHtml = text => {
    if (!text) return '';
    return text
      .replace(/&quot;/g, '')
      .replace(/&apos;/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/["']/g, '')
      .replace(/[^a-zA-Z0-9\s.,-]/g, '')
      .trim();
  };
  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
  };

  const renderItem1 = ({ item }) => {
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
            defaultSource={ImageData.New_Logo}
            onError={handleError}
          />
        ) : (
          <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
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
  const renderItem = ({ item }) => {
  
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrapper}>
          {imageUrl && !hasError ? (
            <FastImage
              style={styles.image}
              source={{
                uri: imageUrl,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              resizeMode={FastImage.resizeMode.contain}
              defaultSource={ImageData.New_Logo}
              onError={() =>
                setImageErrorMap(prev => ({ ...prev, [item.id]: true }))
              }
            />
          ) : (
            <Ionicons
              name="images"
              size={moderateScale(60)}
              color={Color.GRAY}
            />
          )}
        </View>
        <View style={{ width: '100%', backgroundColor: '#F5F5F5',padding:2 }}>
          <Text
            style={styles.productName}
            numberOfLines={2} // 👈 breaks into next line
            ellipsizeMode="tail" // 👈 ...
          >
            {decodeHtml(item.name)}
          </Text>

          <Text
            style={[
              styles.productPrice,
              { textAlign: 'center', color: Color.RED, fontFamily: FONT.BOLD },
            ]}
          >
       {item?.has_option === 1 && "From"} £{Number(item.price).toFixed(2)}
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
            renderItem={renderItem1}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: moderateScale(120),
            }}
            //  keyExtractor={(item, index) => index.toString()}
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
        <>
          <View
            style={{
              flexDirection: 'row',
              padding: moderateScale(10),
              alignItems: 'center',
              gap: moderateScale(10),
            }}
          >
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons
                name="home"
                size={moderateScale(20)}
                color={Color.GRAY}
              />
            </TouchableOpacity>

            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={Color.GRAY}
            />
            <Text
              style={{
                fontSize: verticalScale(16),
                color: Color.GRAY,
                fontFamily: FONT.SEMIBOLD,
              }}
            >
              {listData?.pageTitle}
            </Text>
          </View>

          <FlatList
            data={listData?.data?.data}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{
              paddingHorizontal: moderateScale(12),
              paddingBottom: moderateScale(100),
            }}
          />
        </>
      )}
      <CartComponent />
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

  row: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(12),
  },

  card: {
    width: '32%',
    marginBottom: moderateScale(12),
    marginRight: moderateScale(6),
  },

  imageWrapper: {
    width: '100%',
    height: moderateScale(120),
    borderRadius: moderateScale(6),

    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  productName: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(13),
    fontFamily: FONT.SEMIBOLD,
    color: '#565555',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },

  productPrice: {
    marginTop: moderateScale(2),
    fontSize: moderateScale(12),
    color: '#666',
    fontFamily: FONT.MEDIUM,
  },
});

export default CategoryData;
