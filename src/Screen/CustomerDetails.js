import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  moderateScale,
  ScaledSheet,
  scale,
  verticalScale,
} from 'react-native-size-matters';
import { Color, FONT, IconData } from '../Component/Image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Dropdown } from 'react-native-element-dropdown';

const data = [
  { label: 'Item 1', value: '1' },
  { label: 'Item 2', value: '2' },
  { label: 'Item 3', value: '3' },
  { label: 'Item 4', value: '4' },
  { label: 'Item 5', value: '5' },
  { label: 'Item 6', value: '6' },
  { label: 'Item 7', value: '7' },
  { label: 'Item 8', value: '8' },
];
const CustomerDetails = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Get Delivery');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  // const renderLabel = () => {
  //   if (value || isFocus) {
  //     return (
  //       <Text style={[styles.label, isFocus && { color: 'blue' }]}>
  //         Dropdown label
  //       </Text>
  //     );
  //   }
  //   return null;
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.headerContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={IconData.Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Image source={IconData.Menu} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name={'arrow-back'}
              size={moderateScale(20)}
              color={Color.GRAY}
            />
          </TouchableOpacity>

          <View style={styles.tab}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Get Delivery' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Get Delivery')}
            >
              <Text style={styles.textStyle}>Get Delivery Costs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Collect From Store' && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab('Collect From Store')}
            >
              <Text style={styles.textStyle}>Collect From Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(50) }}
        >
          <View style={{ padding: scale(10) }}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <Text style={styles.sectionDesc}>
              Enter your destination to get a delivery estimate.
            </Text>

            <Text style={styles.label}>POST CODE *</Text>
            <View style={styles.row}>
              <TextInput style={styles.input} placeholder="NG14 5HN" />
              <TouchableOpacity style={styles.findBtn}>
                <Text style={styles.findBtnText}>Find Address</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.container}>
              <Dropdown
                style={styles.input2}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={data}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={'Select item'}
                searchPlaceholder="Search..."
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  setValue(item.value);
                  setIsFocus(false);
                }}
              />
            </View>

            <Text style={styles.sectionTitle}>Customer Information</Text>
            <Text style={styles.sectionDesc}>Lorem Ipsum Jafoie.</Text>

            <Text style={styles.label}>CUSTOMER NAME</Text>
            <TextInput style={styles.input2} placeholder="Enter Name" />

            <Text style={styles.label}>CUSTOMER DELIVERY ADDRESS</Text>
            <TextInput
              style={styles.input2}
              placeholder="Delivery Address"
              value="40 Kirkby Folly Road, Sutton-In-Ashfield"
            />

            <Text style={styles.label}>CUSTOMER CONTACT NUMBER</Text>
            <TextInput
              style={styles.input2}
              placeholder="Enter Contact Number"
            />
          </View>
        </ScrollView>
        <View style={styles.actionRow}>
          <View style={styles.pushWrapper}>
            <View style={styles.circleCheck}>
              <Ionicons
                name={'checkmark-sharp'}
                size={moderateScale(15)}
                color={Color.WHITE}
              />
              {/* <Text style={styles.checkMark}>✓</Text> */}
            </View>
            <Text style={styles.toggleText}>Push Notification</Text>
          </View>

          <TouchableOpacity style={styles.createOrderBtn}>
            <Text style={styles.createOrderText}>Create Order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(12),
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: {
    width: '90%',
    height: verticalScale(45),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: scale(40),
    height: scale(40),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(10),
    gap: 5,
  },
  back: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.GRAY3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: Color.GRAY2,
    backgroundColor: Color.BLACK,
    padding: scale(2),
  },
  tabButton: {
    paddingHorizontal: scale(15),
    height: verticalScale(35),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: Color.RED,
  },
  textStyle: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.WHITE,
  },

  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT.EXTRABOLD,
    color: Color.RED,

    marginBottom: verticalScale(5),
  },
  sectionDesc: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: Color.BLACK2,
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: FONT.SEMIBOLD,
    color: Color.GRAY4,
    marginTop: verticalScale(12),
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(6),
    height: moderateScale(45),
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    paddingHorizontal: 10,
    fontSize: moderateScale(14),
    width: '60%',
  },
  findBtn: {
    backgroundColor: '#3D3D3D',
    height: moderateScale(45),
    width: '35%',
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  findBtnText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontFamily: FONT.BOLD,
  },
  input2: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(6),
    height: moderateScale(45),
    marginBottom: verticalScale(10),
    fontSize: moderateScale(14),
    width: '100%',
    paddingHorizontal: 10,
    fontFamily: FONT.SEMIBOLD,
    color: Color.BLACK2,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.GRAY3,
    padding: moderateScale(10),

    borderTopWidth: 1,
    borderTopColor: Color.GRAY2,
  },

  pushWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  circleCheck: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Color.RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },

  checkMark: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },

  toggleText: {
    fontSize: moderateScale(14),
    fontFamily: FONT.MEDIUM,
    color: '#555',
  },

  createOrderBtn: {
    backgroundColor: Color.RED,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(25),
    borderRadius: moderateScale(8),
  },

  createOrderText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontFamily: FONT.BOLD,
  },
});

export default CustomerDetails;
