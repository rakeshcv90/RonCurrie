import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Color, FONT } from '../../../Component/Image';

const CartHeader = ({
  cartListLength = 0,
  miscListLength = 0,
  totalCluster = 0,
  itemCount = 0,
  onBackPress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={onBackPress}>
        <Ionicons
          name={'arrow-back'}
          size={moderateScale(20)}
          color={Color.GRAY}
        />
      </TouchableOpacity>

      <View style={styles.tab}>
        <Text style={styles.groupText}>
          Groups={' '}
          {cartListLength + miscListLength}
        </Text>
        <Text style={styles.groupText}> Cluster= {totalCluster}</Text>
        <Text style={styles.groupText}> Items= {itemCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: verticalScale(10),
    marginTop: -10,
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
  tab: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(5) },
  groupText: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    lineHeight: moderateScale(24),
  },
});

export default React.memo(CartHeader);
