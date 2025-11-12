import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Api } from '../../utility/api';
import { getData } from '../../utility/ApiCall';

export const fetchReturnOrderList = createAsyncThunk(
  'returnOrderList/fetchReturnOrderList',
  async ({ limit = 15, page = 1 }, { rejectWithValue }) => {
    try {
      const url = `${Api.EPOSE_RETURN_ORDER}?limit=${limit}&page=${page}}`;
   
      const response = await getData(url);
      return { data: response?.data?.data || [], page };
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const ReturnOrderListSlice = createSlice({
  name: 'returnOrderList',
  initialState: {
    returnOrderList: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  },
  reducers: {
    clearProducts: state => {
      state.returnOrderList = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchReturnOrderList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturnOrderList.fulfilled, (state, action) => {
        state.loading = false;
        const newData = action.payload?.data || [];
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          state.returnOrderList = newData;
        } else {
          state.returnOrderList = [...state.returnOrderList, ...newData];
        }
        state.page = page;
        state.hasMore = newData.length === 10;
      })

      .addCase(fetchReturnOrderList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { clearReturnProducts } = ReturnOrderListSlice.actions;
export default ReturnOrderListSlice.reducer;
