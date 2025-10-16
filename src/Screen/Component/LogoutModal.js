import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color, FONT } from '../../Component/Image';

const LogoutModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Logout?</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={moderateScale(20)} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.underline} />

          {/* Body */}
          <Text style={styles.message}>
            Are you sure you want to log out of your account?
          </Text>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onConfirm}>
              <Text style={styles.logoutText}>Logout</Text>
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
    fontWeight: '700',
    fontFamily: FONT.BOLD,
    color: '#000',
  },
  underline: {
    height: 3,
    backgroundColor: '#a00',
    width: moderateScale(70),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(15),
  },
  message: {
    fontSize: moderateScale(16),
    fontFamily: FONT.REGULAR,
    color: '#888',
    lineHeight: moderateScale(24),
    marginBottom: moderateScale(20),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    lineHeight: moderateScale(24),
    fontSize: moderateScale(14),
  },
  logoutBtn: {
    backgroundColor:Color.RED,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(5),
  },
  logoutText: {
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
    lineHeight: moderateScale(24),
    fontSize: moderateScale(14),
  },
});

export default LogoutModal;
