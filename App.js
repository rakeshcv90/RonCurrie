import { View, StyleSheet } from 'react-native';
import React, { createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Router from './src/Navigation/Router';
import ToastMessage from './src/utility/ToastMessage';
import { Provider } from 'react-redux';
import store from './src/Redux/store';
import {navigationRef} from './src/Navigation/NavigationService'
import AttractiveModal from './src/Component/AttractiveModal';
import NetworkStatus from './src/Component/NetworkStatus';
import LiveFeedSync from './src/Component/LiveFeedSync';

export const toastRef = createRef();
export const modalRef = createRef();

const App = () => {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <NavigationContainer ref={navigationRef}>
          <Router />
        </NavigationContainer>

        <ToastMessage ref={toastRef} />
        <AttractiveModal ref={modalRef} />
        <NetworkStatus />
        <LiveFeedSync />
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
