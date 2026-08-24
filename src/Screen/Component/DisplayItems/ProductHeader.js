/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { verticalScale } from 'react-native-size-matters';
import { ImageBaseUrl, ImageData } from '../../../utility/api';
import decodeHtml from '../../../utility/decodeHtml';
import LinearGradient from 'react-native-linear-gradient';

const ProductHeader = ({ productsList, setVisibleModal, styles }) => {
  const [loading, setLoading] = useState(true);
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    let animation;
    if (loading) {
      animation = Animated.loop(
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [loading, shimmerTranslate]);

  const translateX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-150, 150],
  });

  return (
    <View style={styles.productContainer}>
      {productsList?.image && productsList?.image.trim() !== '' ? (
        <View
          style={[
            styles.productImage,
            { overflow: 'hidden', backgroundColor: '#E0E0E0' },
          ]}
        >
          <FastImage
            style={StyleSheet.absoluteFill}
            source={{
              uri: `${ImageBaseUrl}${productsList.image}?w=150&h=150`,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.stretch}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
          {loading && (
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </View>
      ) : (
        <FastImage
          style={styles.itemImage}
          source={ImageData?.NOIMAGE}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.productTitle}>
          {decodeHtml(productsList?.isbn)}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: verticalScale(10),
          }}
        >
          <View>
            <Text style={styles.productModel}>
              Model:{decodeHtml(productsList?.model)}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setVisibleModal(true);
              }}
            >
              <Text style={styles.viewDesc}>View Description</Text>
            </TouchableOpacity>
          </View>

          {productsList?.options?.[0]?.display === 1 &&
            productsList?.options?.[0]?.bespoke_value_req_epos === 1 && (
              <View
                style={{
                  padding: verticalScale(3),
                  backgroundColor: '#156082',
                  flexDirection: 'row',
                  borderWidth: 2,
                  borderColor: '#23414F',
                  borderRadius: 5,
                }}
              >
                <View>
                  <Text style={[styles.pricePerM, { color: 'white' }]}>
                    Bespoke Value
                  </Text>
                  <Text style={{ color: 'white', textAlign: 'center' }}>
                    £{productsList?.options?.[0]?.bespoke_factor_val}/m
                  </Text>
                </View>
              </View>
            )}
        </View>
      </View>
    </View>
  );
};

export default React.memo(ProductHeader);
