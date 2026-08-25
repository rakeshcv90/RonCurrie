import React from 'react';
import { View, Text, FlatList } from 'react-native';
import FastImage from 'react-native-fast-image';
import { moderateScale } from 'react-native-size-matters';
import { ScaledSheet } from 'react-native-size-matters';
import { Color, FONT, ImageData } from '../../../Component/Image';

const CartSearchResults = ({
  results,
  searchNoResults,
  loadingMore,
  loadMoreFunc,
  renderItem,
}) => {
  if (results?.length > 0) {
    return (
      <FlatList
        data={results}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id || item.product_id || index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContainer}
        onEndReached={() => loadMoreFunc && loadMoreFunc()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore && <Text style={styles.loadingText}>Loading...</Text>
        }
      />
    );
  }

  if (searchNoResults) {
    return (
      <View style={styles.emptyContainer}>
        <FastImage
          source={ImageData.NORESULT}
          style={styles.gif}
          resizeMode={FastImage.resizeMode.contain}
        />
        <Text style={styles.noResultText}>
          No result Found for "{searchNoResults}"
        </Text>
        <Text style={styles.noResultSubText}>
          Try adjusting your search term and search again
        </Text>
      </View>
    );
  }

  return null;
};

const styles = ScaledSheet.create({
  flatListContainer: {
    paddingHorizontal: 12,
    paddingBottom: moderateScale(120),
  },
  loadingText: {
    textAlign: 'center',
  },
  emptyContainer: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: 200,
    height: 200,
  },
  noResultText: {
    fontSize: '20@s',
    fontFamily: FONT.SEMIBOLD,
  },
  noResultSubText: {
    fontSize: '14@s',
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY,
  },
});

export default React.memo(CartSearchResults);
