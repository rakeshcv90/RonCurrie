import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';

import { Color, FONT, ImageData } from '../Component/Image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import FastImage from 'react-native-fast-image';
import { MMKVStorage } from '../utility/MmkvStore';

const WelcomeScreen = ({ navigation }) => {
 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={'default'}
      />
      <View style={styles.topContainer}>
        {/* <Image
          source={ImageData.Main}
          style={styles.topImage}
          resizeMode="stretch"
        /> */}
        <FastImage
          source={ImageData.Main}
          style={styles.topImage}
          resizeMode={FastImage.resizeMode.stretch}
        />
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>Welcome</Text>
        <View
          style={{
            width: moderateScale(70),
            height: 3,
            backgroundColor: Color.RED,
          }}
        />
        <Text style={styles.subtitle}>
          Lorem ipsum dolor sit amet consectetur. Lorem id sit
        </Text>

        <View style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
          <TouchableOpacity
            onPress={async () => {
              const userData = await MMKVStorage.getItem('User_Data');
           
           

              if (!userData) {
                navigation.replace('Login');
              } else {
                navigation.replace('Home');
              }
            }}
          >
            <Image
              source={ImageData.Next}
              style={{ width: 70, height: 70 }}
              resizeMode="contain"
            />
            {/* <Ionicons name="arrow-forward" size={20} color="#fff" /> */}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topImage: {
    width: '100%',
    height: '430@vs', // force visible height
  },

  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: '20@s',
    marginBottom: '30@vs',
  },
  title: {
    fontSize: '36@s',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
  },
  subtitle: {
    fontSize: '16@s',
    fontFamily: FONT.REGULAR,
    color: Color.GRAY,
    marginBottom: '20@vs',
    marginTop: '20@vs',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonText: {
    fontSize: '16@s',
    color: Color.GRAY,
    fontFamily: FONT.SEMIBOLD,
    marginRight: '10@s',
  },
});

export default WelcomeScreen;
