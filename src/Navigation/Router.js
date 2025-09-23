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

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: {
    backgroundColor: 'white',
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
    </Stack.Navigator>
  );
};

export default Router;
