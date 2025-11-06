import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../utility/ApiCall';
import { Api } from '../../utility/api';

export const fetchCartData = createAsyncThunk(
  'cartData/fetchCartData',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await getData(`${Api.GET_CART}?customer_id=${payload}`);

      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const CartDataShowSlice = createSlice({
  name: 'cartList',
  initialState: {
    cartList: [],
    loading: false,
    error: null,
    refreshKey: 0,
  },
  reducers: {
    clearcartProducts: state => {
      state.cartList = [];
      state.error = null;
    },
    triggerCartRefresh: state => {
      state.refreshKey += 1; // 🔁 increments value each time you add item
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCartData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartData.fulfilled, (state, action) => {
        state.loading = false;
        state.cartList = action?.payload?.data;
      })
      .addCase(fetchCartData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearcartProducts,triggerCartRefresh } = CartDataShowSlice.actions;
export default CartDataShowSlice.reducer;
