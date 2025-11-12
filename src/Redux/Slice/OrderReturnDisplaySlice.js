import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchOrderReturnDisplay = createAsyncThunk(
  'orderReturnDisplay/fetchOrderReturnDisplay',
  async (payload, { rejectWithValue }) => {

    try {
      const response = await getData(`${Api.EPOSE_RETURN_DETAILS}/${payload}`);
  
      return response?.data || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const orderReturnDisplaySlice = createSlice({
  name: 'orderReturnDisplay',
  initialState: {
    orderReturnDisplay: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearReturnDisplayProducts: state => {
      state.orderReturnDisplay = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrderReturnDisplay.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderReturnDisplay.fulfilled, (state, action) => {
        
        state.loading = false;
        state.orderReturnDisplay = action?.payload|| [];
      })
      .addCase(fetchOrderReturnDisplay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearReturnDisplayProducts } = orderReturnDisplaySlice.actions;
export default orderReturnDisplaySlice.reducer;
