import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Color, FONT, IconData } from '../Component/Image';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
const categories = [
  {
    id: '1',
    title: 'Untreated Carcassing',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '2',
    title: 'Treated Timber',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '3',
    title: 'Planed Timber',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '4',
    title: 'Pine Skirting, Architrave, Windowboard',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '5',
    title: 'Floorboards and Cladding',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '6',
    title: 'Floorboards and Cladding',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '7',
    title: 'Floorboards and Cladding',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
  {
    id: '8',
    title: 'Floorboards and Cladding',
    items: [
      '3x2 CLS',
      '4x2 CLS',
      '2x2 CLS',
      '3x2ru',
      '4x2ru',
      '6x2ru',
      '4x3ru',
      '8x3ru',
      '1x1su',
      '2NDS CLS',
    ],
  },
];
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Home = () => {
  const [expanded, setExpanded] = useState(categories[0]?.id);

  const toggleExpand = id => {
     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const handleItemPress = item => {
    console.log('Clicked:', item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.headerContainer}>
        <Image
          source={IconData.Logo}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.searchButton}>
            <Image
              source={IconData.Search}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Image
              source={IconData.Menu}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {categories.map(category => (
          <View key={category.id} style={styles.card}>
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.header,
                expanded === category.id && styles.headerActive,
              ]}
              onPress={() => toggleExpand(category.id)}
            >
              <Text
                style={[
                  styles.title,
                  expanded === category.id && styles.titleActive,
                ]}
              >
                {category.title}
              </Text>
              <Ionicons
                name={expanded === category.id ? 'chevron-up' : 'chevron-down'}
                size={moderateScale(20)}
                color={expanded === category.id ? '#fff' : '#000'}
              />
            </TouchableOpacity>

            {expanded === category.id && category.items.length > 0 && (
              <View style={styles.itemsContainer}>
                <FlatList
                  data={category.items}
                  numColumns={3}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemBox}
                      onPress={() => handleItemPress(item)}
                    >
                      <Text style={styles.itemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.bottomCard}>
        <View style={styles.circleLeft}>
          <View style={styles.circleLeft1}>
            <MaterialDesignIcons name="cart" color={Color.WHITE} size={25} />
          </View>
          <Text style={{ color: 'white', fontSize: 20 }}>£ 0.00</Text>
          <View
            style={{
              height: 20,
              width: 2,
              backgroundColor: Color.GRAY,
              borderRadius: 2,
            }}
          />
          <View>
            <Text style={{ color: 'white', fontSize: 12 }}>1 (1)</Text>
            <Text style={{ color: 'white', fontSize: 10 }}>ITEMS (GROUP)</Text>
          </View>
        </View>
        <View
          style={{
            height: 30,
            width: 3,
            backgroundColor: '#D1D1D1',
            borderRadius: 2,
          }}
        />
        <View style={styles.circleRight}>
          <MaterialDesignIcons
            name="barcode-scan"
            color={Color.WHITE}
            size={25}
          />
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

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10@s',
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  logo: {
    width: '65%',
    height: moderateScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '10@s',
  },
  menuButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '10@s',
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },

  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '15@s',
    alignItems: 'center',
  },
  headerActive: {
    backgroundColor: '#000',
  },
  title: {
    fontSize: '16@ms',

    color: '#333',
    flex: 1,
    paddingRight: '10@s',
    fontFamily: FONT.MEDIUM,
  },
  titleActive: {
    color: '#fff',
  },
  itemsContainer: {
    padding: '10@s',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemBox: {
    flex: 1,
    margin: '5@s',
    paddingVertical: '10@vs',
    backgroundColor: '#f4c69f',
    borderRadius: '6@ms',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '90@s',
  },
  itemText: {
    fontSize: '14@ms',
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    width: '75%',
    height: 70,
    flexDirection: 'row',
    backgroundColor: Color.WHITE,
    borderRadius: 40,
    // overflow: 'hidden',
    elevation: 5,
    left: '12.5%',
    alignItems: 'center',
    padding: '5@ms',
    gap: 5,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  circleLeft: {
    width: '75%',
    height: 60,
    borderRadius: 50,
    backgroundColor: '#3D3D3D',
    justifyContent: 'flex-start',

    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  circleLeft1: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '5@ms',
  },
  circleRight: {
    width: '20%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B71C1C', // red
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Home;
