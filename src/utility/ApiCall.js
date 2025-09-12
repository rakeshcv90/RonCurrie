import { BaseUrl } from "./api";

const apiClient = axios.create({
  baseURL: BaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async config => {
    // const userDataString = await reduxStorage.getItem('userData');

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        const token = userData?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('Invalid userData in MMKV:', err);
      }
    }
    return config;
  },
  error => Promise.reject(error),
);

function handleApiError(error) {
  if (error.response) {
    const {status, data} = error.response;

    // try {
    //   if (status === 401) {
    //     reduxStorage.removeItem('userData');

    //     // Reset navigation to login
    //     navigationRef.current?.reset({
    //       index: 0,
    //       routes: [{name: 'Login'}],
    //     });

    //     // Optionally, toast error
    //     console.warn('Session expired, logging out');
    //   }
    // } catch (logoutError) {
    //   console.log('Logout cleanup failed:', logoutError);
    // }

    throw {
      type: 'response',
      status,
      message: data?.message || `Request failed with status ${status}`,
    };
  } else if (error.request) {
    throw {
      type: 'network',
      message: 'Network error, no response received',
    };
  } else {
    throw {
      type: 'unknown',
      message: error.message || 'Something went wrong',
    };
  }
}


// ✅ GET wrapper
export const getData = async (endpoint, params = {}) => {
 
  try {
    const response = await apiClient.get(endpoint, {params});

    return response.data;
  } catch (error) {
    console.log('💥 getData error:', error);

    handleApiError(error);
    // Return null or throw the error to prevent undefined return
    return null;
  }
};

// ✅ POST wrapper
export const postData = async (endpoint, body = {}) => {
 
  try {
    const response = await apiClient.post(endpoint, body);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
