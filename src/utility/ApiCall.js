// import { BaseUrl } from './api';
// import axios from 'axios';
// import { MMKVStorage } from './MmkvStore';
// import { resetRoot } from '../Navigation/NavigationService';
// import NetInfo from '@react-native-community/netinfo';
// import { showToast } from './showToast';
// import { showGlobalModal } from './modalService';
// import * as Keychain from 'react-native-keychain';

// const apiClient = axios.create({
//   baseURL: BaseUrl,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// let isAppConnected = true;

// NetInfo.addEventListener(state => {
//   isAppConnected = state.isConnected;
// });

// apiClient.interceptors.request.use(
//   async config => {
//     try {
//       if (!isAppConnected) {
//         showToast(
//           'danger',
//           'No Internet',
//           'Please check your network connection.',
//         );
//         // Prevent request if offline
//         return Promise.reject({
//           type: 'network',
//           message: 'No internet connection',
//         });
//       }
//       const credentials = await Keychain.getGenericPassword();

//       if (credentials) {
//         const token = credentials.password; // your token

//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch (err) {
//       console.warn('Error getting token from Keychain:', err);
//     }

//     return config;
//   },
//   error => Promise.reject(error),
// );

// const handleApiError = async error => {

//   const status = error?.response?.status;
//   const data = error?.response?.data;
// console.log('API Error:', error);
//   if (error?.response) {
//     try {
//       if (status === 403) {
//         await MMKVStorage.clearAllData();
//         await Keychain.resetGenericPassword();
//         resetRoot([{ name: 'Welcome' }]);
//         showToast('danger', 'Session expired', 'Please log in again');
//       } else if (status === 404) {
//         showToast('danger', 'Data List', data?.message);
//       }
//       else if (status === 422) {
//         const messagesObj = data?.messages;
//         let messagesArray = '';
//         console.log('Validation Error Messages:', messagesObj);
//         if (Array.isArray(messagesObj)) {
//           messagesArray = messagesObj.join('\n');
//         } else if (messagesObj) {
//           messagesArray = Object.values(messagesObj).flat().join('\n');
//         }

//         showToast(
//           'danger',
//           'Validation Error',
//           messagesArray || 'Something went wrong',
//         );
//       }

//       else if (status === 400) {
//         showToast('danger', data?.message);
//         return;
//       } else if (status === 401) {
//         if (data?.message === 'Unauthenticated.') {
//           showGlobalModal({
//             title: 'Session Expired',
//             message:
//               'Your session has expired. Please log in again to continue.',
//             type: 'error',
//             buttonText: 'Logout',
//             onPress: async () => {
//               try {
//                 const credentials = await Keychain.getGenericPassword();
//                 if (credentials) {
//                   const token = credentials.password;
//                   await axios.post(
//                     `${BaseUrl}epos/account/logout`,
//                     {},
//                     {
//                       headers: {
//                         Authorization: `Bearer ${token}`,
//                         'Content-Type': 'application/json',
//                       },
//                     },
//                   );
//                 }
//               } catch (logoutApiError) {
//                 console.log(
//                   'Session expired logout API call error:',
//                   logoutApiError,
//                 );
//               }
//               await MMKVStorage.clearAllData();
//               await Keychain.resetGenericPassword();
//               resetRoot([{ name: 'Welcome' }]);
//             },
//           });
//         } else {
//           showToast('danger', 'Validation Error', data?.message);
//         }
//       }
//     } catch (logoutError) {
//       console.log('Logout cleanup failed:', logoutError);
//     }

//     throw {
//       type: 'response',
//       status,
//       message: data?.message || `Request failed with status ${status}`,
//     };
//   } else if (error.request) {
//     console.log('Network error, request made but no response');

//     showToast('danger', 'Network Error', 'No response received from server');

//     // throw {
//     //   type: 'network',
//     //   message: 'Network error, no response received',
//     // };
//   } else {
//     console.log('Unknown error', error.message);

//     showToast('danger', 'Error', data?.message || 'Something went wrong');

//     throw {
//       type: 'unknown',
//       message: data?.message || 'Something went wrong',
//     };
//   }
// };

// // ✅ GET wrapper
// export const getData = async (endpoint, params = {}) => {
//   try {
//     const response = await apiClient.get(endpoint, { params });

//     return response?.data;
//   } catch (error) {
//     await handleApiError(error);
//   }
// };

// // ✅ POST wrapper
// export const postData = async (endpoint, body = {}) => {
//   try {
//     const response = await apiClient.post(endpoint, body);
//     return response;
//   } catch (error) {
//     console.log('POST Error123:', error);
//     await handleApiError(error);
//   }
// };
// // ✅ UPDATE wrapper
// export const putData = async (endpoint, body = {}) => {
//   try {
//     const response = await apiClient.put(endpoint, body);
//     return response;
//   } catch (error) {
//     console.log('PUT Error:', error);
//     handleApiError(error);
//   }
// };
// export const deleteData = async (endpoint, body = {}) => {
//   try {
//     const response = await apiClient.delete(endpoint, { data: body });
//     return response;
//   } catch (error) {
//     console.log('Delete Error:', error);
//     handleApiError(error);
//   }
// };

import { BaseUrl } from './api';
import axios from 'axios';
import { MMKVStorage } from './MmkvStore';
import { resetRoot } from '../Navigation/NavigationService';
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './showToast';
import { showGlobalModal } from './modalService';
import * as Keychain from 'react-native-keychain';

const apiClient = axios.create({
  baseURL: BaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isAppConnected = true;

NetInfo.addEventListener(state => {
  isAppConnected = state.isConnected;
});

apiClient.interceptors.request.use(
  async config => {
    try {
      if (!isAppConnected) {
        showToast(
          'danger',
          'No Internet',
          'Please check your network connection.',
        );
        return Promise.reject({
          type: 'network',
          message: 'No internet connection',
        });
      }
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        config.headers.Authorization = `Bearer ${credentials.password}`;
      }
    } catch (err) {
      console.warn('Error getting token from Keychain:', err);
    }
    return config;
  },
  error => Promise.reject(error),
);

const formatErrorMessage = target => {
  if (!target) return '';
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) {
    return target
      .flat(Infinity)
      .map(item => (typeof item === 'string' ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join('\n');
  }
  if (typeof target === 'object') {
    return Object.values(target)
      .flat(Infinity)
      .map(item => (typeof item === 'string' ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join('\n');
  }
  return String(target);
};

const handleApiError = async error => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  const parsedMessage =
    formatErrorMessage(data?.messages) ||
    formatErrorMessage(data?.errors) ||
    formatErrorMessage(data?.message) ||
    formatErrorMessage(data?.error);

  if (error?.response) {
    try {
      if (status === 403) {
        await MMKVStorage.clearAllData();
        await Keychain.resetGenericPassword();
        resetRoot([{ name: 'Welcome' }]);
        showToast('danger', 'Session expired', 'Please log in again');
      } else if (status === 404) {
        showToast(
          'danger',
          'Not Found',
          parsedMessage || 'The requested resource was not found',
        );
      } else if (status === 422) {
        console.log(
          'API Error:',
          data?.messages || data?.message || data?.errors || data?.error,
        );
        showToast(
          'danger',
          'Validation Error',
          parsedMessage || 'Something went wrong',
        );
      } else if (status === 400) {
        const message = parsedMessage || 'Bad request';
        showToast('danger', 'Bad Request', message);
        throw { type: 'response', status, message };
      } else if (status === 401) {
        if (data?.message === 'Unauthenticated.') {
          showGlobalModal({
            title: 'Session Expired',
            message:
              'Your session has expired. Please log in again to continue.',
            type: 'error',
            buttonText: 'Logout',
            onPress: async () => {
              try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                  await axios.post(
                    `${BaseUrl}epos/account/logout`,
                    {},
                    {
                      headers: {
                        Authorization: `Bearer ${credentials.password}`,
                        'Content-Type': 'application/json',
                      },
                    },
                  );
                }
              } catch (logoutApiError) {
                console.log(
                  'Session expired logout API call error:',
                  logoutApiError,
                );
              }
              await MMKVStorage.clearAllData();
              await Keychain.resetGenericPassword();
              resetRoot([{ name: 'Welcome' }]);
            },
          });
        } else {
          showToast(
            'danger',
            'Unauthorised',
            parsedMessage || 'You are not authorised',
          );
        }
      }
    } catch (innerError) {
      // Re-throw only if it's one of our own structured errors, not a cleanup failure
      if (innerError?.type) throw innerError;
      console.log('Error handling cleanup failed:', innerError);
    }

    throw {
      type: 'response',
      status,
      message: parsedMessage || `Request failed with status ${status}`,
    };
  } else if (error?.request) {
    // FIX: throw was commented out — callers never knew a network error occurred
    console.log(
      'Network error — request made but no response received',
      error?.response?.status,
      error?.response,
    );
    showToast('danger', 'Network Error', 'No response received from server');
    throw {
      type: 'network',
      message: 'Network error — no response received',
    };
  } else {
    // FIX: `data` is not in scope here — was referencing undefined variable
    const message = error?.message || 'Something went wrong';
    console.log('Unknown error:', message);
    showToast('danger', 'Error', message);
    throw {
      type: 'unknown',
      message,
    };
  }
};

export const getData = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });
    return response?.data;
  } catch (error) {
    await handleApiError(error);
  }
};

export const postData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.post(endpoint, body);
    return response;
  } catch (error) {
    await handleApiError(error);
  }
};

// FIX: was missing `await` — async cleanup (Keychain, MMKV) could be skipped
export const putData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.put(endpoint, body);
    return response;
  } catch (error) {
    console.log('PUT Error:', error);
    await handleApiError(error);
  }
};

export const deleteData = async (endpoint, body = {}) => {
  try {
    const response = await apiClient.delete(endpoint, { data: body });
    return response;
  } catch (error) {
    console.log('Delete Error:', error);
    await handleApiError(error);
  }
};
