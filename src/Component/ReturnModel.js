import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import React, { useState } from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Color, IconData, ImageData } from './Image';

import { useNavigation } from '@react-navigation/native';
import SearchComponent from '../Screen/Component/SearchComponent';
import { ImageBaseUrl } from '../utility/api';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { useDispatch } from 'react-redux';
import FastImage from 'react-native-fast-image';

const ReturnModel = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
  };

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
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => onClose()}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.fullScreenContainer}>
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
          <ScrollView style={styles.contentContainer}>
            <Text style={styles.title}>Product Returns</Text>

            <Text style={styles.subtitle}>
              Please email{' '}
              <Text
                style={{
                  color: Color.BLACK,
                  fontSize: moderateScale(17),
                  fontWeight: '700',
                }}
              >
                sale@roncurrie.co.uk
              </Text>{' '}
              for returns.Please include your original order number,details of
              the goods you. want to return and the reason for returning,so we
              can find and process then return efficiently
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};
const styles = ScaledSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: moderateScale(40),
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#f8f8f8',
  },

  leftContainer: { alignItems: 'center', flex: 1 },
  logo: { width: '80%', height: moderateScale(40) },

  contentContainer: {
    padding: moderateScale(16),
  },
  title: {
    fontSize: moderateScale(30),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: '#788392',
    marginBottom: moderateScale(10),
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
export default ReturnModel;
