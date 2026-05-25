import { View, Text } from 'react-native';
import React, { createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Router from './src/Navigation/Router';
import ToastMessage from './src/utility/ToastMessage';
import { Provider } from 'react-redux';
import store from './src/Redux/store';
import {navigationRef} from './src/Navigation/NavigationService'
import AttractiveModal from './src/Component/AttractiveModal';
import NetworkStatus from './src/Component/NetworkStatus';

export const toastRef = createRef();
export const modalRef = createRef();

const App = () => {
  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <Router />
        </NavigationContainer>

        <ToastMessage ref={toastRef} />
        <AttractiveModal ref={modalRef} />
        <NetworkStatus />
      </View>
    </Provider>
  );
};

export default App;
