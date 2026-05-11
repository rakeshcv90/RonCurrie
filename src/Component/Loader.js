import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Color, ImageData } from './Image';
import FastImage from 'react-native-fast-image';

const Loader = ({ visible }) => {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Color.RED} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)', // semi-transparent background
  },
  gif: {
    width: 100,
    height: 100,
  },
});

export default Loader;
