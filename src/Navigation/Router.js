import { View, Text } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../Screen/WelcomeScreen';
import Login from '../Screen/Login';
import SignUp from '../Screen/SignUp';
import Home from '../Screen/Home';
import ForgotPassword from '../Screen/ForgotPassword';




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
     
 
   
    </Stack.Navigator>
  );
};

export default Router;
