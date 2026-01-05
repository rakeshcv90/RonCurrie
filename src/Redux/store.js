import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import productReducer from '../Redux/Slice/ProductMenuSlice'
import productListReducer from '../Redux/Slice/ProductListSlice'
import orderListReducer from '../Redux/Slice/OrderListSlice'
import orderDIsplayReducer from '../Redux/Slice/OrderDisplaySlice'
import a4printsizeReducer from '../Redux/Slice/A4PrintSlice'
import print80MMReducer from '../Redux/Slice/Print80mmSlice'
import CartDataShowReducer from '../Redux/Slice/CartDataShowSlice'
import returnIrderListReducer from '../Redux/Slice/ReturnOrderListSlice'
import returnOrderDetailsReducer from '../Redux/Slice/OrderReturnDisplaySlice'
import categoryReducer from '../Redux/Slice/CategoriesSlice'

const store = configureStore({
  reducer: {
    product: productReducer,
    productsList: productListReducer,
    orderList: orderListReducer,
    displorder:orderDIsplayReducer,
    a4PrintData:a4printsizeReducer,
    print800mmData:print80MMReducer,
    cartListData:CartDataShowReducer,
    returnlisorder:returnIrderListReducer,
    returnDetails:returnOrderDetailsReducer,
    category:categoryReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
