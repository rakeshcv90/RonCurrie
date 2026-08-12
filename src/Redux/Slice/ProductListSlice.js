import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchProductsList = createAsyncThunk(
  'productsList/fetchProductsList',
  async (payload, { rejectWithValue }) => {
    try {
      // Append payload in URL
      // const response = await getData(`${Api.EPOS_PRODUCTLIST_PAGE}?name=${payload}&clicked_product_id=${clickedProductId}`);
      const response = await getData(
        `${Api.EPOS_PRODUCTLIST_PAGE}?name=${payload.slug}&clicked_product_id=${payload.clicked_product_id}`,
      );
      return response?.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
const productlistSlice = createSlice({
  name: 'productsList',
  initialState: {
    productsList: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProducts: state => {
      state.productsList = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProductsList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsList.fulfilled, (state, action) => {
        state.loading = false;
        state.productsList = action?.payload?.data;
      })
      .addCase(fetchProductsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearProducts } = productlistSlice.actions;
export default productlistSlice.reducer;
