// // Local
// export const BaseUrl ='https://backend.roncurry.co.uk/api/v1/frontend/';
// export const ImageBaseUrl ='https://backend.roncurry.co.uk/image/';

// Live Server
export const BaseUrl = 'https://api.roncurrie.co.uk/api/v1/frontend/'; //New Live Server
export const ImageBaseUrl = 'https://api.roncurrie.co.uk/image/';

export const Api = {
  LOGIN: 'login',
  SIGNUP: 'register',
  // FORGOT_PASSWORD: 'forget-password',
  FORGOT_PASSWORD: 'send-password-reset-link',
  OTP_VERIFY: 'verify-otp',
  CHANGE_PASSWOIRD: 'epos/account/change-password',
  EPOS_HOME_PAGE: 'eposHomePage',
  BAR_CODE_SCANNER: 'barCodeScanner',
  // EPOS_PRODUCTLIST_PAGE: 'eposProductListPage',
  EPOS_PRODUCTLIST_PAGE: 'homePage',
  ADD_CART: 'eposCart',
  GET_CART: 'eposCart',
  UPDATE_CART: 'eposCart',
  DELETE_CART: 'eposCart/delete',
  SEARCH: 'search/products',
  FIND_ADDRESS: 'find-address',
  ORDER_LIST: 'epos/account/order-history',
  ORDER_DETAILS: 'epos/account/order-history',
  RE_ORDER_PRODUCT: 'epos/account/order/product/reorder',
  RE_ORDER_FULL_ORDER: 'epos/account/order/reorder',
  RETURN_ORDER: 'epos/account',
  RETURN_REASON: 'epos/account/returns/reasons',
  RETURN_ORDER_DETAILS: 'epos/account/order',
  A4_SIZE_PRINT_DATA: 'checkoutInvoce',
  ACCOUNT_UPDATE: 'epos/account/edit',
  EPOSE_RETURN_ORDER: 'epos/account/returns',
  EPOSE_RETURN_DETAILS: 'epos/account/returns',
  ORDER_PLACE: 'epos/checkout/save-order',
  GET_SHIPPING: 'get-shipping',
  CATEGORIES: 'categories',
  GET_MISC: 'epos/miscellaneous',
  ADD_MISC: 'epos/miscellaneous',
  GET_CART_LIVE_FEED: 'epos/get-cart-live-feed',
  LOGOUT: 'epos/account/logout',
  VERY_OTP: 'verify-otp',
  RESET_OTP: 'resend-otp',
  DELIVERIES: 'epos/deliveries',
};
