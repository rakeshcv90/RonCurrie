import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color, FONT } from '../../Component/Image';

const PrintModel = ({ visible, onClose, onConfirm }) => {
  const [selectedOption, setSelectedOption] = useState('A4');
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Print</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={moderateScale(20)} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.underline} />

          <Text style={styles.message}>Print order details</Text>

          <View style={{ marginTop: moderateScale(10) }}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedOption('A4')}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === 'A4' && styles.radioOuterActive,
                ]}
              >
                {selectedOption === 'A4' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Print customer copy A4</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedOption('80mm')}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === '80mm' && styles.radioOuterActive,
                ]}
              >
                {selectedOption === '80mm' && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Print customer copy 80mm</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => onConfirm(selectedOption)}
            >
              <Text style={styles.printText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(36),
    fontFamily: FONT.BOLD,
    color: '#000',
  },
  underline: {
    height: moderateScale(3),
    backgroundColor: '#a00',
    width: moderateScale(50),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(2),
  },
  message: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: '#777',
    marginBottom: moderateScale(10),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(5),
  },
  radioOuter: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  radioOuterActive: {
    borderColor: '#a00',
  },
  radioInner: {
    height: moderateScale(10),
    width: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#a00',
  },
  radioLabel: {
    fontSize: moderateScale(16),
    color: Color.BLACK2,
    fontFamily: FONT.MEDIUM,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: moderateScale(25),
  },
  cancelBtn: {
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  cancelText: {
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
  printBtn: {
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(5),
  },
  printText: {
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
});

export default PrintModel;
