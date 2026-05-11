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

export const fetchMiscData = createAsyncThunk(
  'cartData/fetchMiscData',
  async (payload, { rejectWithValue }) => {
    try {
      // const response = await getData(`${Api.GET_MISC}?customer_id=${payload}`);
      const response = await getData(`${Api.GET_MISC}/${payload}`);
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
    miscList: [],
    loading: false,
    error: null,
    refreshKey: 0,
    miscRefreshKey: 0,
    skipAutoBack: false,
  },
  reducers: {
    clearcartProducts: state => {
      state.cartList = [];
      state.error = null;
    },
    triggerCartRefresh: state => {
      state.refreshKey += 1; // 🔁 increments value each time you add item
    },
    triggerMiscRefresh: state => {
      state.miscRefreshKey += 1;
    },
    setSkipAutoBack: (state, action) => {
      // ✅ ADDED
      state.skipAutoBack = action.payload;
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
      })
      .addCase(fetchMiscData.fulfilled, (state, action) => {
        state.miscList = action?.payload?.data || [];
      })
      .addCase(fetchMiscData.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch misc data';
      });
  },
});

export const {
  clearcartProducts,
  triggerCartRefresh,
  triggerMiscRefresh,
  setSkipAutoBack,
} = CartDataShowSlice.actions;
export default CartDataShowSlice.reducer;
