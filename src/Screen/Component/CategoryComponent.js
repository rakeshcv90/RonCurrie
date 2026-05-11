import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Image,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import FastImage from 'react-native-fast-image';
import { Api, ImageBaseUrl } from '../../utility/api';
import { useSelector } from 'react-redux';
import { fetchProductsList } from '../../Redux/Slice/ProductListSlice';
import { getData } from '../../utility/ApiCall';
import Loader from '../../Component/Loader';
import decodeHtml from '../../utility/decodeHtml';

// const decodeHtml = text => {
//   if (!text) return '';
//   return text
//     .replace(/&quot;/g, '')
//     .replace(/&apos;/g, '')
//     .replace(/&amp;/g, '&')
//     .replace(/&lt;/g, '<')
//     .replace(/&gt;/g, '>')
//     .replace(/["']/g, '')
//     .replace(/[^a-zA-Z0-9\s.,-]/g, '')
//     .trim();
// };
const CategoryComponent = ({ categoryData, navigation }) => {
  const { productsList, loading, error } = useSelector(
    state => state.productsList,
  );
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);
  const [loader, setLoader] = useState(false);
  const toggleCategory = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === id ? null : id);
    setExpandedSub(null);
  };
  const toggleSub = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSub(expandedSub === id ? null : id);
  };

  const getProductList = async dataItem => {
    // setLoader(true);
    try {
      const res = await getData(
        `${Api.EPOS_PRODUCTLIST_PAGE}?name=${encodeURIComponent(
          dataItem?.slug,
        )}`,
      );
      //  console.log("DJDJDJD",res?.data)
      if (res?.success == true && res?.responseCode == 200) {
        setLoader(false);

        if (res?.data?.pageName == 'productList') {
          navigation.navigate('CategoryData', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'categoryList') {
          navigation.navigate('CategoryList', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'categoryPage') {
          navigation.navigate('CategoryPage', { listDAta: res?.data });
        } else if (res?.data?.pageName == 'informationPage') {
        } else if (res?.data?.pageName == 'productPage') {
        } else {
        }
      } else {
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
      console.log('Find Address Error:', error);
      if (error.type === 'network') {
        showToast('danger', 'Network Error', error.message);
      } else if (error.type === 'response') {
        showToast('danger', 'Login Failed', error.message);
      } else {
        showToast(
          'danger',
          'Unexpected Error',
          error.message || 'Something went wrong',
        );
      }
    }
  };
  return (
    <View style={styles.container}>
      {categoryData?.map((category, index) => (
        <View key={category?.id || index} style={styles.card}>
          <View
            activeOpacity={1}
            style={[
              styles.header,
              expandedCategory === category.id && styles.headerActive,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                getProductList(category);
                // navigation.navigate('SubProductList', { itemData: category });
              }}
            >
              <Text
                style={[
                  styles.title,
                  expandedCategory === category.id && styles.titleActive,
                ]}
              >
                {decodeHtml(category?.name)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                const isExpanded = expandedCategory === category.id;

                toggleCategory(category.id);
                if (category?.children?.length <= 0 && !isExpanded) {
                  getProductList(category);
                } else {
                  toggleCategory(category.id);
                }
              }}
            >
              <Ionicons
                name={expandedCategory === category.id ? 'close' : 'add'}
                size={moderateScale(20)}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {expandedCategory === category?.id &&
            category?.children?.map((sub, idx) => (
              <View key={sub?.id || idx}>
                {/* ----- Sub Header ----- */}
                <View
                  style={[
                    styles.subHeader,
                    // expandedSub === sub.id && styles.subHeaderActive,
                    expandedSub === sub.id && styles.subHeaderActive,
                    expandedSub === sub.id && styles.subHeaderBorder,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      flex: 1,
                      gap: 10,
                    }}
                    onPress={() => {
                      getProductList(sub);
                    }}
                  >
                    <View style={styles.bulletDot} />
                    <Text style={styles.subTitle}>
                      {' '}
                      {decodeHtml(sub?.name)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      const isExpanded = expandedSub === sub?.id;

                      toggleSub(sub?.id);
                      if (sub?.children?.length <= 0 && !isExpanded) {
                        getProductList(sub);
                      } else {
                        toggleSub(sub?.id);
                      }
                    }}
                  >
                    <Ionicons
                      name={expandedSub === sub?.id ? 'close' : 'add'}
                      size={moderateScale(18)}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {/* ----- Sub Data Items ----- */}
                {expandedSub === sub?.id &&
                  sub?.children?.map((item, i) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={i}
                      style={styles.itemBox}
                      onPress={() => {
                        getProductList(item);
                      }}
                    >
                      <FastImage
                        style={styles.productImage}
                        source={{
                          uri: `${ImageBaseUrl}${item?.image}`,

                          priority: FastImage.priority.high,
                          cache: FastImage.cacheControl.immutable,
                        }}
                        resizeMode={FastImage.resizeMode.contain}
                        defaultSource={ImageData.New_Logo}
                      />
                      <Text style={styles.itemText}>
                        {decodeHtml(item?.name)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
        </View>
      ))}
      <Loader visible={loader} />
    </View>
  );
};
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  card: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#888888',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10@s',
    paddingVertical: '10@s',
    alignItems: 'center',
  },
  headerActive: {
    backgroundColor: Color.RED,
  },

  title: {
    fontSize: '14@ms',
    color: '#fff',
    flex: 1,
    fontFamily: FONT.SEMIBOLD,
  },
  titleActive: {
    color: '#fff',
  },

  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '15@s',
    paddingVertical: '8@s',
    backgroundColor: '#111',
  },

  subHeaderActive: {
    backgroundColor: Color.RED,
  },

  subTitle: {
    fontSize: '14@ms',
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
  },

  itemBox: {
    marginHorizontal: moderateScale(15),
    marginVertical: moderateScale(5),
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemText: {
    fontSize: '14@ms',
    color: Color.WHITE,
    fontFamily: FONT.REGULAR,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  productImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    marginRight: verticalScale(10),
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Color.WHITE,
  },
  subHeaderBorder: {
    borderTopWidth: 1,
    borderTopColor: '#888888', // or Color.WHITE
  },
});
export default React.memo(CategoryComponent);
