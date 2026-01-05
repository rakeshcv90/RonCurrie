import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import React from 'react';
import {
  moderateScale,
  ScaledSheet,
  verticalScale,
} from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Color, IconData } from './Image';

const ReturnModel = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => onClose()}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.fullScreenContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.back} onPress={() => onClose()}>
            <Ionicons
              name={'arrow-back'}
              size={moderateScale(20)}
              color={Color.GRAY}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leftContainer}
            onPress={() => {
              onClose();
            }}
          >
            <Image
              source={IconData.Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

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
            for returns.Please include your original order number,details of the
            goods you. want to return and the reason for returning,so we can
            find and process then return efficiently
          </Text>
        </ScrollView>
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
});
export default ReturnModel;
