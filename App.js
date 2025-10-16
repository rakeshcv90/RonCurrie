import { View, Text } from 'react-native';
import React, { createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Router from './src/Navigation/Router';
import ToastMessage from './src/utility/ToastMessage';
import { Provider } from 'react-redux';
import store from './src/Redux/store';
import {navigationRef} from './src/Navigation/NavigationService'

export const toastRef = createRef();

const App = () => {
  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <Router />
        </NavigationContainer>

        <ToastMessage ref={toastRef} />
      </View>
    </Provider>
  );
};

export default App;
