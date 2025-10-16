import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchOrderDisplay = createAsyncThunk(
  'orderDisplay/fetchOrderDisplay',
  async (payload, { rejectWithValue }) => {

    try {
      const response = await getData(`${Api.ORDER_DETAILS}/${payload}`);
  
      return response || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const orderDisplaySlice = createSlice({
  name: 'orderDisplay',
  initialState: {
    orderDisplay: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProducts: state => {
      state.orderDisplay = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrderDisplay.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDisplay.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDisplay = action?.payload?.data||[];
      })
      .addCase(fetchOrderDisplay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearProducts } = orderDisplaySlice.actions;
export default orderDisplaySlice.reducer;
