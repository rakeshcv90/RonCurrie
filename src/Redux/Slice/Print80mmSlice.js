import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetch80MMPrintDetails = createAsyncThunk(
  'print80MMDetails/fetch80MMPrintDetails',
  async (payload, { rejectWithValue }) => {

    try {
      const response = await getData(`${Api.MM80_SIZE_PRINT_DATA}/${payload}`);
     
  
      return response || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const Print80MMSlice = createSlice({
  name: 'printDetails',
  initialState: {
    print80MMDetails: [],
    loading: false,
    error: null,
  },
  reducers: {
    clear80MMProducts: state => {
      state.print80MMDetails = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetch80MMPrintDetails.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetch80MMPrintDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.print80MMDetails = action?.payload?.data||[];
      })
      .addCase(fetch80MMPrintDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clear80MMProducts } = Print80MMSlice.actions;
export default Print80MMSlice.reducer;
