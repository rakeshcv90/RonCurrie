import React from 'react';
import { View, Text, TouchableOpacity, Keyboard, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color } from '../../../Component/Image';

const CartOrderButton = ({ hasInvalidQuantity, onPress }) => {
  return (
    <View style={[styles.bottomBtn, { paddingHorizontal: moderateScale(10) }]}>
      {hasInvalidQuantity && (
        <Text style={styles.errorText}>
          Some items exceed available stock. Please adjust quantities.
        </Text>
      )}
      <TouchableOpacity
        disabled={hasInvalidQuantity}
        onPress={() => {
          Keyboard.dismiss();
          if (onPress) onPress();
        }}
        style={[
          styles.createBtn,
          { opacity: hasInvalidQuantity ? 0.5 : 1 },
        ]}
      >
        <Text style={styles.bottomBtnText}>Create Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBtn: {
    backgroundColor: Color.GRAY3,
    padding: moderateScale(5),
    borderTopWidth: 1,
    borderTopColor: Color.GRAY2,
    width: '100%',
  },
  errorText: {
    color: Color.RED,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 4,
  },
  createBtn: {
    width: '30%',
    height: moderateScale(40),
    backgroundColor: '#4472c4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 4,
  },
  bottomBtnText: {
    color: Color.WHITE,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default React.memo(CartOrderButton);
