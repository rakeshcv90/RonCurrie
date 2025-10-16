import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import productReducer from '../Redux/Slice/ProductMenuSlice';
import productListReducer from '../Redux/Slice/ProductListSlice';
import orderListReducer from '../Redux/Slice/OrderListSlice';
import orderDIsplayReducer from '../Redux/Slice/OrderDisplaySlice'

const store = configureStore({
  reducer: {
    product: productReducer,
    productsList: productListReducer,
    orderList: orderListReducer,
    displorder:orderDIsplayReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
