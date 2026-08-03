import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const ActionButtons = ({
  navigation,
  payload,
  productsList,
  selectedTab,
  addToBasket,
  matrixAddToBasket,
  styles,
}) => {
  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => {
          navigation.navigate('WebViewScreen', {
            payload: payload,
          });
        }}
      >
        <Text style={styles.addText}>Edit Stock & Price</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          if (productsList?.matrix?.length <= 0) {
            addToBasket();
          } else {
            matrixAddToBasket();
          }
        }}
      >
        <Text style={styles.addText}>
          {selectedTab === 'Sales' ? 'Add To Basket' : 'Add To Refund'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(ActionButtons);
