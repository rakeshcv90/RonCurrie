import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../Redux/Slice/ProductMenuSlice';
import productListReducer from '../Redux/Slice/ProductListSlice';

const store = configureStore({
  reducer: {
    product: productReducer,
    productsList: productListReducer,
  },
});

export default store;
