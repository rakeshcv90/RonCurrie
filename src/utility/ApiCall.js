import { BaseUrl } from './api';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { createNavigationContainerRef } from '@react-navigation/native';
import { MMKVStorage } from './MmkvStore';

import { resetRoot } from '../Navigation/NavigationService';
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './showToast';
export const navigationRef = createNavigationContainerRef();

const apiClient = axios.create({
  baseURL: BaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async config => {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        showToast(
          'danger',
          'No Internet',
          'Please check your network connection.',
        );
        // Prevent request if offline
        return Promise.reject({
          type: 'network',
          message: 'No internet connection',
        });
      }
      const credentials = await Keychain.getGenericPassword();

      if (credentials) {
        const token = credentials.password; // your token

        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error getting token from Keychain:', err);
    }

    return config;
  },
  error => Promise.reject(error),
);

const handleApiError = async error => {
  console.log('API Error:', error);
  if (error?.response) {
    const { status, data } = error.response;
    try {
      if (status === 403) {
        await MMKVStorage.clearAllData();
        await Keychain.resetGenericPassword();
        resetRoot([{ name: 'Welcome' }]);
        showToast('danger', 'Session expired', 'Please log in again');
      } else if (status === 404) {
        showToast('danger', 'Data List', data?.message);
      } else if (status === 422) {

        const messagesObj = data?.messages;
        const messagesArray = Object.values(messagesObj).flat().join('\n');
        showToast('danger', 'Validation Error', messagesArray);
      } else if (status === 400) {
        showToast('danger', 'Validation Error', data?.message);
        return;
      } else if (status === 401) {
        showToast('danger', 'Validation Error', data?.message);
      }
    } catch (logoutError) {
      console.log('Logout cleanup failed:', logoutError);
    }

    throw {
      type: 'response',
      status,
      message: data?.message || `Request failed with status ${status}`,
    };
  } else if (error.request) {
    console.log('Network error, request made but no response');

    showToast('danger', 'Network Error', 'No response received from server');

    throw {
      type: 'network',
      message: 'Network error, no response received',
    };
  } else {
    console.log('Unknown error', error.message);

    showToast('danger', 'Error', error.message || 'Something went wrong');

    throw {
      type: 'unknown',
      message: error.message || 'Something went wrong',
    };
  }
};

// ✅ GET wrapper
export const getData = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });

    return response?.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ✅ POST wrapper
export const postData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.post(endpoint, body);

    return response;
  } catch (error) {
    console.log('rrrrrrr', error?.response);
    handleApiError(error);
    // throw error
  }
};
// ✅ UPDATE wrapper
export const putData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.put(endpoint, body);
    return response;
  } catch (error) {
    console.log('PUT Error:', error);
    handleApiError(error);
  }
};
export const deleteData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.delete(endpoint, { data: body });
    return response;
  } catch (error) {
    console.log('Delete Error:', error);
    handleApiError(error);
  }
};
