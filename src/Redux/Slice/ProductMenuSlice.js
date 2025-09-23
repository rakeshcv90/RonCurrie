import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

// API Call
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getData(Api.EPOS_HOME_PAGE);
      
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    products: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProducts: state => {
      state.products = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
    
        state.loading = false;
         state.products = action?.payload?.data; 
      })
      .addCase(fetchProducts.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload|| 'Something went wrong';
      });
  },
});

export const { clearProducts } = productSlice.actions;
export default productSlice.reducer;
