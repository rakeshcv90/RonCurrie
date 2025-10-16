import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchOrderList = createAsyncThunk(
  'orderList/fetchOrderList',
  async ({ page = 1, limit = 10, name = '' }, { rejectWithValue }) => {
    try {
      const url = `${
        Api.ORDER_LIST
      }?page=${page}&limit=${limit}&name=${encodeURIComponent(name)}`;

      const response = await getData(url);
      return { data: response?.data?.data || [], page };
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const orderlistSlice = createSlice({
  name: 'orderList',
  initialState: {
    orderList: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  },
  reducers: {
    clearProducts: state => {
      state.orderList = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrderList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderList.fulfilled, (state, action) => {
        state.loading = false;
        const newData = action.payload?.data || [];
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          state.orderList = newData;
        } else {
          state.orderList = [...state.orderList, ...newData];
        }
        state.page = page;
        state.hasMore = newData.length === 10;
        // state.hasMore = newData.length === 10; // or check from API
      })
      // .addCase(fetchOrderList.fulfilled, (state, action) => {
      //   state.loading = false;
      //   const newData = action.payload?.data || [];

      //   // Merge new data if not first page
      //   if (action.payload.page > 1) {
      //     state.orderList = [...state.orderList, ...newData];
      //   } else {
      //     state.orderList = newData;
      //   }

      //   // Check if more pages exist
      //   if (newData.length < 10) {
      //     state.hasMore = false;
      //   }
      // })

      .addCase(fetchOrderList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearProducts } = orderlistSlice.actions;
export default orderlistSlice.reducer;
