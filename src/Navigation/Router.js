import { View, Text } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../Screen/WelcomeScreen';
import Login from '../Screen/Login';
import SignUp from '../Screen/SignUp';
import Home from '../Screen/Home';
import ForgotPassword from '../Screen/ForgotPassword';
import DisplayItems from '../Screen/DisplayItems';
import BarCodeReader from '../Screen/BarCodeReader';
import SearchScreen from '../Screen/SearchScreen';
import AddCartScreen from '../Screen/AddCartScreen';
import CustomerDetails from '../Screen/CustomerDetails';
import AccountProfile from '../Screen/AccountProfile';
import OrderHistory from '../Screen/OrderHistory';
import OrderHistoryDetails from '../Screen/OrderHistoryDetails';
import ReturnScreen from '../Screen/ReturnScreen';
import ResetPassword from '../Screen/ResetPassword';
import WebViewScreen from '../Screen/WebViewScreen';
import EditInfotmation from '../Screen/EditInfotmation';
import ProductReturns from '../Screen/ProductReturns';
import ReturnRequestDetails from '../Screen/ReturnRequestDetails';
import OrderSuccessFull from '../Screen/OrderSuccessFull';
import CategoryData from '../Screen/CategoryData';
import SubProductList from '../Screen/SubProductList';
import SubProductList2 from '../Screen/SubProductList2';
import CategoryList from '../Screen/Category/CategoryList';
import CategoryList2 from '../Screen/Category/CategoryList2';
import CategoryPage from '../Screen/Category/CategoryPage';
import WebScreen from '../Screen/Category/WebScreen';

const screenOptions = {
  headerShown: false,
  animation: 'none',
  contentStyle: {
    backgroundColor: 'transparent',
  },
};
const Stack = createNativeStackNavigator();

const Router = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="DisplayItems" component={DisplayItems} />
      <Stack.Screen name="BarCodeReader" component={BarCodeReader} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="AddCartScreen" component={AddCartScreen} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="AccountProfile" component={AccountProfile} />
      <Stack.Screen name="OrderHistory" component={OrderHistory} />
      <Stack.Screen name="ReturnScreen" component={ReturnScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="EditInfotmation" component={EditInfotmation} />
      <Stack.Screen name="ProductReturns" component={ProductReturns} />
      <Stack.Screen
        name="ReturnRequestDetails"
        component={ReturnRequestDetails}
      />
      <Stack.Screen name="OrderSuccessFull" component={OrderSuccessFull} />
      <Stack.Screen
        name="OrderHistoryDetails"
        component={OrderHistoryDetails}
      />
      <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
      <Stack.Screen name="SubProductList" component={SubProductList} />
      <Stack.Screen name="SubProductList2" component={SubProductList2} />

      <Stack.Screen name="CategoryData" component={CategoryData} />
      <Stack.Screen name="CategoryList" component={CategoryList} />
      <Stack.Screen name="CategoryList2" component={CategoryList2} />
      <Stack.Screen name="CategoryPage" component={CategoryPage} />
    <Stack.Screen name="WebScreen" component={WebScreen} />
    </Stack.Navigator>
  );
};

export default Router;
