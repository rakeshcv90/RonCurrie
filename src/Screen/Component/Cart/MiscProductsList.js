import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { moderateScale, verticalScale, ScaledSheet } from 'react-native-size-matters';
import { Color, FONT } from '../../../Component/Image';

const windowHeight = Dimensions.get('window').height;

const MiscProductsList = ({
  miscList,
  handleChange,
  toggleSign,
  handleDeleteMisc,
  handleAddMisc,
}) => {
  return (
    <>
      {miscList?.map((item) => (
        <View
          key={item.id}
          style={styles.miscContainer}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.totalLabel}>Misc Product</Text>
            <View
              style={[
                styles.cashInputRow,
                {
                  height: windowHeight >= 900 ? verticalScale(35) : 45,
                  paddingHorizontal: 10,
                },
              ]}
            >
              <TextInput
                style={[styles.cashInput1, { flex: 1 }]}
                placeholder="Enter Misc Product"
                value={item.description}
                onChangeText={text => handleChange(item.id, 'description', text)}
              />
            </View>
          </View>

          <View>
            <Text style={styles.cashLabel}>Amount</Text>
            <View style={styles.cashBox}>
              <View style={styles.cashInputRow}>
                <View style={{ width: verticalScale(45), height: verticalScale(40) }}>
                  <TouchableOpacity
                    style={[
                      styles.sidePanel,
                      {
                        borderLeftWidth: 1,
                        borderLeftColor: '#ddd',
                        backgroundColor: Color.RED,
                        borderTopLeftRadius: 5,
                        borderBottomLeftRadius: 5,
                      },
                    ]}
                    onPress={() => toggleSign(item.id)}
                  >
                    <View style={[styles.qtyBtnCircle, { backgroundColor: Color.WHITE }]}>
                      <Text style={[styles.qtyBtnText, { color: Color.RED }]}>
                        -
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    width: verticalScale(80),
                    height: windowHeight >= 1100 ? 45 : 45,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRightWidth: 1,
                    borderRightColor: '#ddd',
                    overflow: 'hidden',
                  }}
                >
                  <Text style={styles.cashSymbol}>£</Text>
                  <TextInput
                    style={[
                      styles.cashInput1,
                      {
                        flex: 1,
                        textAlign: 'left',
                        left: -5,
                        opacity: !item.description?.trim() ? 0.5 : 1,
                      },
                    ]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={'#000'}
                    value={item.price}
                    editable={!!item.description?.trim()}
                    onChangeText={text => handleChange(item.id, 'price', text)}
                  />
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{ marginTop: moderateScale(20), zIndex: 10 }}
            onPress={() => handleDeleteMisc(item.id)}
          >
            <Ionicons name="trash-outline" size={25} color="#4472c4" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.miscBtn} onPress={handleAddMisc}>
        <Text style={styles.miscText}>Add Miscellaneous Charges</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = ScaledSheet.create({
  miscContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: moderateScale(10),
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  cashInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(5),
    marginVertical: moderateScale(5),
    alignItems: 'center',
  },
  cashInput1: {
    fontSize: 16,
    width: moderateScale(130),
    color: Color.BLACK2,
  },
  cashLabel: {
    fontSize: 14,
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
  },
  cashBox: {
    alignItems: 'flex-end',
  },
  sidePanel: {
    width: verticalScale(35),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  qtyBtnCircle: {
    height: verticalScale(28),
    width: verticalScale(28),
    borderRadius: verticalScale(14),
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    top: -1,
  },
  cashSymbol: {
    fontSize: 16,
    marginRight: 5,
  },
  miscBtn: {
    backgroundColor: '#3D3D3D',
    padding: verticalScale(12),
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  miscText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default React.memo(MiscProductsList);
