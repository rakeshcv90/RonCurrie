import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchA4PrintDetails = createAsyncThunk(
  'printDetails/fetchA4PrintDetails',
  async (payload, { rejectWithValue }) => {

    try {
      const response = await getData(`${Api.A4_SIZE_PRINT_DATA}/${payload}`);
     
  
      return response || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const A4PrintSlice = createSlice({
  name: 'printDetails',
  initialState: {
    a4PrintDetails: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearA4Products: state => {
      state.a4PrintDetails = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchA4PrintDetails.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchA4PrintDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.a4PrintDetails = action?.payload?.data||[];
      })
      .addCase(fetchA4PrintDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearA4Products } = A4PrintSlice.actions;
export default A4PrintSlice.reducer;
