import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../utility/ApiCall';
import { Api } from '../../utility/api';

export const fetchLiveFeed = createAsyncThunk(
  'liveFeed/fetchLiveFeed',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getData(Api.GET_CART_LIVE_FEED);

      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const liveFeedSlice = createSlice({
  name: 'liveFeed',
  initialState: {
    feedData: [],
    grandTotal: 0,
    totalQty: 0,
    onlineUsers: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setLiveFeedData: (state, action) => {
      const payload = action.payload;
      if (Array.isArray(payload)) {
        state.feedData = payload;
      } else if (payload && payload.customers) {
        state.feedData = payload.customers;
        state.grandTotal = payload.grand_total || 0;
        state.totalQty = payload.total_qty || 0;
        state.onlineUsers = payload.total_customers || 0;
        return;
      }

      state.grandTotal = state.feedData.reduce(
        (sum, item) => sum + (item.total_amount || item.grand_total || 0),
        0,
      );
      state.totalQty = state.feedData.reduce(
        (sum, item) => sum + (item.total_qty || 0),
        0,
      );
      state.onlineUsers = state.feedData.length;
    },
    updateLiveFeedItem: (state, action) => {
      const payload = action.payload;
      const index = state.feedData.findIndex(
        item => item.user_id === payload.user_id,
      );
      if (index !== -1) {
        state.feedData[index] = payload;
      } else {
        state.feedData = [payload, ...state.feedData];
      }

      state.grandTotal = state.feedData.reduce(
        (sum, item) => sum + (item.total_amount || item.grand_total || 0),
        0,
      );
      state.totalQty = state.feedData.reduce(
        (sum, item) => sum + (item.total_qty || 0),
        0,
      );
      state.onlineUsers = state.feedData.length;
    },
    clearLiveFeed: state => {
      state.feedData = [];
      state.grandTotal = 0;
      state.totalQty = 0;
      state.onlineUsers = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchLiveFeed.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveFeed.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload) {
          state.feedData = payload.customers || [];
          state.grandTotal = payload.grand_total || 0;
          state.totalQty = payload.total_qty || 0;
          state.onlineUsers = payload.total_customers || 0;
        }
      })
      .addCase(fetchLiveFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { setLiveFeedData, updateLiveFeedItem, clearLiveFeed } =
  liveFeedSlice.actions;
export default liveFeedSlice.reducer;
