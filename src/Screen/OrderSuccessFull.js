import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
  FlatList,
  Keyboard,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import {
  Color,
  companyDetails,
  FONT,
  IconData,
  ImageData,
} from '../Component/Image';
import {
  moderateScale,
  ScaledSheet,
  scale,
  verticalScale,
} from 'react-native-size-matters';

import LottieView from 'lottie-react-native';
import { useDispatch, useSelector } from 'react-redux';

import { showToast } from '../utility/showToast';
import {
  clearA4Products,
  fetchA4PrintDetails,
} from '../Redux/Slice/A4PrintSlice';
import RNPrint from 'react-native-print';
import {
  clearcartProducts,
  setSkipAutoBack,
} from '../Redux/Slice/CartDataShowSlice';
import { BackHandler } from 'react-native';
import SearchComponent from './Component/SearchComponent';
import { clearProducts } from '../Redux/Slice/ProductListSlice';
import { ImageBaseUrl } from '../utility/api';
import FastImage from 'react-native-fast-image';
import Ionicons from '@react-native-vector-icons/ionicons';

const OrderSuccessFull = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const data = route?.params?.resData;

  const [isDetailsLoaded, setIsDetailsLoaded] = useState(false);

  const { a4PrintDetails } = useSelector(state => state.a4PrintData);
  const orderIdFromParam = data?.data?.order_id;

  const [results, setResults] = useState([]);
  const [loadMoreFunc, setLoadMoreFunc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [imageErrorMap, setImageErrorMap] = useState({});

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardOpen(true);
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
console.log("a4PrintDetails",isKeyboardOpen)
  useFocusEffect(
    React.useCallback(() => {
      const handleBackAction = () => {
        dispatch(setSkipAutoBack(false));
        dispatch(clearcartProducts());

        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackAction,
      );

      const unsubscribeNav = navigation.addListener('beforeRemove', () => {
        dispatch(setSkipAutoBack(false));
        dispatch(clearcartProducts());
      });

      return () => {
        backHandler.remove();
        unsubscribeNav();
      };
    }, []),
  );

  useEffect(() => {
    if (data?.data?.order_id) {
      const fetchData = async () => {
        try {
          await dispatch(fetchA4PrintDetails(data?.data?.order_id)).unwrap();
          setIsDetailsLoaded(true);
        } catch (error) {
          console.log('API Error:', error);
        }
      };
      fetchData();
    }
  }, [, dispatch, data]);

  useEffect(() => {
    if (
      a4PrintDetails &&
      a4PrintDetails?.order_id &&
      a4PrintDetails?.order_id == orderIdFromParam &&
      Array.isArray(a4PrintDetails?.products) &&
      a4PrintDetails?.products.length > 0
    ) {
      setTimeout(() => {
        handlePrint('80mm');
      }, 600);
    } else {
    }
  }, [a4PrintDetails, orderIdFromParam]);
  useEffect(() => {
    if (
      isDetailsLoaded && // ⬅️ MUST BE TRUE
      a4PrintDetails &&
      a4PrintDetails?.order_id &&
      a4PrintDetails?.order_id == orderIdFromParam &&
      Array.isArray(a4PrintDetails?.products) &&
      a4PrintDetails?.products.length > 0
    ) {
      setTimeout(() => {
        handlePrint('80mm');
      }, 600);
    }
  }, [isDetailsLoaded, a4PrintDetails, orderIdFromParam]);
  //   const generatePDF = async () => {
  //     const totalsMap = {};
  //     a4PrintDetails?.totals?.forEach(item => {
  //       totalsMap[item.code] = parseFloat(item.value).toFixed(2);
  //     });

  //     return `
  //    <!DOCTYPE html>
  //    <html>
  //    <head>
  //      <meta charset="UTF-8" />
  //      <style>
  //        body {
  //          font-family: Arial, sans-serif;
  //          font-size: 14px;
  //          color: #000;
  //          margin: 0;
  //          padding: 20px;
  //        }
  //        h1 {
  //          font-size: 22px;
  //          margin-bottom: 15px;
  //        }
  //        table {
  //          width: 100%;
  //          border-collapse: collapse;
  //        }
  //        th, td {
  //          padding: 8px;
  //          border: 1px solid #e6e6e6;
  //          vertical-align: top;
  //        }
  //        th {

  //          text-align: left;
  //        }
  //        .section {
  //          border: 1px solid #e6e6e6;
  //          margin-bottom: 15px;
  //          margin-top: 20px;

  //        }
  //        .section-title {
  //          font-weight: bold;
  //          padding: 8px;
  //          border-bottom: 1px solid #e6e6e6;
  //        }
  //        .content-table td {
  //          padding: 10px;
  //          vertical-align: top;
  //        }
  //        .content-table td:first-child {
  //          border-right: 1px solid #e6e6e6;
  //        }
  //        a {
  //          color: #000;
  //          text-decoration: none;
  //        }
  //        .product-sub {
  //          font-size: 10px;
  //          color: #555;
  //        }
  //        .totals td {
  //          border: 1px solid #e6e6e6;
  //          padding: 8px;
  //        }
  //        .totals tr td:first-child {
  //          width: 80%;
  //        }
  //        .totals tr:last-child td {
  //          font-weight: bold;
  //        }
  //        .right {
  //          text-align: right;
  //        }
  //        .section1 {
  //          margin-top: 20px;
  //          border: 1px solid #e6e6e6;
  //          border-radius: 4px;
  //        }

  //  .section1-header {

  //    border-bottom: 1px solid #e6e6e6;
  //    padding: 8px 10px;
  //  }

  //  .section1-header h3 {
  //    margin: 0;
  //    font-size: 14px;
  //  }
  //  .address-row {
  //    display: flex;
  //    justify-content: space-between;
  //    padding: 0; /* remove default spacing */
  //    margin: 0;

  //  }
  //    .address-row1 {
  //    display: flex;

  //    font-weight: bold;
  //    border-bottom: 1px solid #e6e6e6;
  //      margin: 0;
  //    padding: 0;

  //  }
  //  .address-column {
  //    width: 50%;
  //    padding: 8px 10px;
  //    font-size: 13px;
  //    line-height: 1.4;
  //    box-sizing: border-box;
  //  }

  //  .address-column1 {
  //    width: 50%;
  //    font-size: 13px;
  //    padding: 8px 10px;
  //    box-sizing: border-box;
  //  }

  //  .left-column {
  //    border-right: 1px solid #e6e6e6;
  //  }

  //  .address-column h4 {
  //    margin-top: 0;
  //    font-size: 13.5px;
  //    font-weight: bold;
  //    margin-bottom: 5px;
  //    text-decoration: underline;

  //  }.address-column p {
  //    margin: 0;
  //    padding: 5px 0;
  //  }.bold-black {
  //    font-weight: bold;
  //    color: black;
  //     font-family: Arial, sans-serif;
  //  }@media print {
  //    html, body {
  //      width: 210mm;   /* A4 width */
  //      height: auto;   /* allow content to expand */
  //    }
  //    .section {
  //      page-break-inside: avoid;  /* don't split sections */
  //    }
  //    .page-break {
  //      display: block;
  //      page-break-before: always; /* force new page */
  //      break-before: always;
  //    }
  //  }
  //  </style>
  //    </head>
  //    <body>
  //      <h1>Invoice #${a4PrintDetails?.order_id}</h1>

  //      <!-- ORDER DETAILS -->
  //      <div class="section">
  //        <div class="section-title">Order Details</div>
  //        <table class="content-table">
  //          <tr>
  //            <td width="50%">
  //              <b>${a4PrintDetails?.settings?.config_name}</b><br/>
  //          ${a4PrintDetails?.settings?.config_address
  //            ?.trim()
  //            ?.replace(/\\r\\n/g, '<br/>')
  //            ?.replace(/,\s*/g, '<br/>')
  //            ?.replace(/(<br\/>)+/g, '<br/>')} <br/>
  //              <b>Telephone:</b> ${
  //                a4PrintDetails?.settings?.config_telephone
  //              }<br/>
  //              <b>Email:</b> <a href="mailto:${
  //                a4PrintDetails?.settings?.config_email
  //              }">${a4PrintDetails?.settings?.config_email}</a><br/>
  //              <b>Web Site:</b> <a href="${
  //                a4PrintDetails?.store_url
  //              }" target="_blank">${a4PrintDetails?.store_url}</a>
  //            </td>
  //            <td width="50%">
  //              <b>Date Added:</b> ${a4PrintDetails?.order_date}<br/>
  //              <b>Order ID:</b> ${a4PrintDetails?.order_id}<br/>
  //              <b>Payment Method:</b> ${a4PrintDetails?.payment_method}<br/>
  //              <b>Delivery Method:</b> ${a4PrintDetails?.shipping_method}
  //            </td>
  //          </tr>
  //        </table>
  //      </div>
  //      <div class="section1">
  //         <div class="address-row1">
  //         <div class="address-column1">
  //           <div>Payment Address</div>
  //            </div>
  //          <div class="address-column1">
  //           <div>Delivery Address</div>
  //            </div>
  //    </div>
  //    <div class="address-row">
  //      <div class="address-column left-column">
  //        <p>${a4PrintDetails?.shipping_firstname}${
  //       a4PrintDetails?.shipping_firstname
  //     }<br/>
  //              ${a4PrintDetails?.payment_company}<br/><br/>
  //              ${a4PrintDetails?.payment_address_1}<br/>
  //              ${a4PrintDetails?.payment_address_2}<br/>
  //              ${a4PrintDetails?.payment_city}<br/>
  //              ${a4PrintDetails?.payment_postcode}<br/>
  //              ${a4PrintDetails?.payment_country}<br/>
  //              ${a4PrintDetails?.payment_zone}<br/>
  //              ${a4PrintDetails?.payment_zone_id}
  //        </p>
  //      </div>
  //      <div class="address-column right-column">
  //          <p>${a4PrintDetails?.shipping_firstname}${
  //       a4PrintDetails?.shipping_firstname
  //     }<br/>
  //              ${a4PrintDetails?.shipping_company}<br/>
  //              ${a4PrintDetails?.shipping_address_1}<br/>
  //              ${a4PrintDetails?.shipping_address_2}<br/>
  //              ${a4PrintDetails?.shipping_city}<br/>
  //              ${a4PrintDetails?.shipping_postcode}<br/>
  //              ${a4PrintDetails?.shipping_country}<br/>
  //              ${a4PrintDetails?.shipping_zone}<br/>
  //              ${a4PrintDetails?.shipping_zone_id}

  //        </p>
  //      </div>
  //    </div>
  //  </div>
  //      <div class="section">
  //        <table>
  //          <thead>
  //            <tr>
  //              <th>No. of Products</th>
  //              <th>Model</th>
  //              <th>Quantity</th>
  //              <th>Price</th>
  //              <th>Total</th>
  //            </tr>
  //          </thead>
  //          <tbody>

  //          ${a4PrintDetails?.products
  //            .map(
  //              (item, index) => `
  //             <tr>
  //              <td>
  //                ${item?.name}<br/>
  //             ${
  //               item?.options
  //                 ? `<span class="product-sub">- ${item.options.name}: ${item.options.value}</span>`
  //                 : ''
  //             }
  //              </td>
  //              <td>${item?.model}</td>
  //              <td>${item?.quantity}</td>
  //             <td>£${Number(item?.price || 0).toFixed(2)}</td>
  //             <td>£${Number(item?.total || 0).toFixed(2)}</td>
  //            </tr>${
  //              (index + 1) % 20 === 0 ? '<div class="page-break"></div>' : ''
  //            }`,
  //            )
  //            .join('')}

  //          </tbody>
  //        </table>
  //      </div>

  //      <!-- TOTALS -->
  //  <div class="section">
  //    <table class="totals">
  //      ${a4PrintDetails?.totals
  //        .map(
  //          item => `
  //          <tr>
  //            <td class="right bold-black">${item.title}</td>
  //       <td class="right">£${Number(item?.value || 0).toFixed(2)}</td>
  //          </tr>
  //        `,
  //        )
  //        .join('')}
  //    </table>
  //  </div>
  //    </body>
  //    </html>
  //    `;
  //   };

  //   const generatePDF = async () => {
  //     const totalsMap = {};
  //     a4PrintDetails?.totals?.forEach(item => {
  //       totalsMap[item.code] = parseFloat(item.value).toFixed(2);
  //     });

  //     return `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <meta charset="UTF-8" />
  //   <style>
  //     body {
  //       font-family: Arial, sans-serif;
  //       font-size: 14px;
  //       color: #000;
  //       margin: 0;
  //       padding: 20px;
  //     }
  //     h1 {
  //       font-size: 22px;
  //       margin-bottom: 15px;
  //     }
  //     table {
  //       width: 100%;
  //       border-collapse: collapse;
  //     }
  //     th, td {
  //       padding: 8px;
  //       border: 1px solid #e6e6e6;
  //       vertical-align: top;
  //     }
  //     th {
  //       text-align: left;
  //     }
  //     .section {
  //       border: 1px solid #e6e6e6;
  //       margin-bottom: 15px;
  //       margin-top: 20px;
  //     }
  //     .section-title {
  //       font-weight: bold;
  //       padding: 8px;
  //       border-bottom: 1px solid #e6e6e6;
  //     }
  //     .content-table td {
  //       padding: 10px;
  //       vertical-align: top;
  //     }
  //     .product-sub {
  //       font-size: 10px;
  //       color: #555;
  //     }
  //     .totals td {
  //       border: 1px solid #e6e6e6;
  //       padding: 8px;
  //     }
  //     .totals tr td:first-child {
  //       width: 80%;
  //     }
  //     .totals tr:last-child td {
  //       font-weight: bold;
  //     }
  //     .right {
  //       text-align: right;
  //     }

  //     /* Address Box */
  //     .section1 {
  //       margin-top: 20px;
  //       border: 1px solid #e6e6e6;
  //       border-radius: 4px;
  //     }
  //     .address-row1 {
  //       display: flex;
  //       font-weight: bold;
  //       border-bottom: 1px solid #e6e6e6;
  //       padding: 0;
  //       margin: 0;
  //     }
  //     .address-column1 {
  //       width: 50%;
  //       font-size: 13px;
  //       padding: 8px 10px;
  //       box-sizing: border-box;
  //     }
  //     .address-row {
  //       display: flex;
  //       justify-content: space-between;
  //       margin: 0;
  //       padding: 0;
  //     }
  //     .address-column {
  //       width: 50%;
  //       padding: 8px 10px;
  //       font-size: 13px;
  //       line-height: 1.4;
  //       box-sizing: border-box;
  //     }
  //     .left-column {
  //       border-right: 1px solid #e6e6e6;
  //     }

  //     @media print {
  //       html, body {
  //         width: 210mm;
  //         height: auto;
  //       }
  //       .section {
  //         page-break-inside: avoid;
  //       }
  //       .page-break {
  //         display: block;
  //         page-break-before: always;
  //         break-before: always;
  //       }
  //     }
  //   </style>
  // </head>

  // <body>

  //   <div style="display: flex; align-items: center; justify-content: space-between;">
  //   <h1 style="margin: 0;">Invoice #${a4PrintDetails?.order_id}</h1>
  // <img src="https://nomansland.roncurry.co.uk/assets/roncurries-logo-2iaZ574S.png"
  //      style="width:150px;height:auto;" />
  // </div>

  //   <!-- ORDER DETAILS -->
  //   <div class="section">
  //     <div class="section-title">Order Details</div>
  //     <table class="content-table">
  //       <tr>
  //         <td width="50%">
  //           ${
  //             a4PrintDetails?.shipping_method === 'Delivery'
  //               ? `
  //                <b>${a4PrintDetails?.epos_customer_name}</b><br/>
  //                ${a4PrintDetails?.epos_customer_address}<br/>
  //                ${a4PrintDetails?.epos_customer_number}<br/>

  //               `
  //               : `
  //                 <b>${a4PrintDetails?.epos_customer_name}</b><br/>
  //                 ${a4PrintDetails?.epos_customer_number}<br/>
  //                 ${a4PrintDetails?.epos_car_detail}<br/>
  //               `
  //           }
  //         </td>

  //         <td width="50%">
  //           <b>Date Added:</b> ${
  //             a4PrintDetails?.shipping_method === 'Delivery'
  //               ? a4PrintDetails?.date_added
  //               : a4PrintDetails?.date_added
  //           }<br/>
  //              <b>Telephone:</b> ${companyDetails?.mobile}  <b>VAT#</b> ${
  //       companyDetails?.companyVat
  //     }<br/>
  //           <b>Order ID:</b> ${a4PrintDetails?.order_id}<br/>
  //           <b>Payment Method:</b> ${a4PrintDetails?.payment_method}<br/>
  //           <b>Delivery Method:</b> ${a4PrintDetails?.shipping_method}
  //         </td>
  //       </tr>
  //     </table>
  //   </div>

  //   <!-- SHOW BOTH ADDRESS SECTIONS ONLY IF DELIVER -->
  //   ${
  //     a4PrintDetails?.shipping_method === 'Delivery'
  //       ? `
  //   <div class="section1">
  //     <div class="address-row1">
  //       <div class="address-column1">Payment Address</div>
  //       <div class="address-column1">Delivery Address</div>
  //     </div>

  //     <div class="address-row">
  //       <div class="address-column left-column">
  //         <p>
  //           <b>${a4PrintDetails?.epos_customer_name} </b><br/>
  //           ${a4PrintDetails?.epos_customer_address}<br/>

  //         </p>
  //       </div>

  //       <div class="address-column right-column">
  //         <p>
  //           ${a4PrintDetails?.shipping_company}<br/>
  //           ${a4PrintDetails?.shipping_address_1}  ${a4PrintDetails?.shipping_address_2}<br/>

  //           ${a4PrintDetails?.shipping_city}<br/>
  //           ${a4PrintDetails?.shipping_postcode}<br/>
  //           ${a4PrintDetails?.shipping_country}<br/>
  //           ${a4PrintDetails?.shipping_zone}

  //         </p>
  //       </div>
  //     </div>
  //   </div>
  //       `
  //       : ''
  //   }

  //   <!-- PRODUCT LIST -->
  //   <div class="section">
  //     <table>
  //       <thead>
  //         <tr>
  //           <th>No. of Products</th>
  //           <th>Model</th>
  //           <th>Quantity</th>
  //           <th>Price</th>
  //           <th>Total</th>
  //         </tr>
  //       </thead>

  // <tbody>
  //   ${a4PrintDetails?.products
  //     ?.map(
  //       (item, index) => `
  //       <tr>
  //         <td>
  //           <div style="display:flex; align-items:center; gap:10px;">

  //             <img
  //               src="https://roncurry.co.uk/roncurry/public/image/${
  //                 item.product.image
  //               }"
  //               style="width:70px; height:auto; border-radius:5px;"
  //             />

  //             <div>
  //               ${item?.name}<br/>
  //               ${
  //                 item?.options
  //                   ? `<span class="product-sub">- ${item.options.name}: ${item.options.value}</span>`
  //                   : ''
  //               }
  //             </div>

  //           </div>
  //         </td>

  //         <td>${item?.model}</td>
  //         <td>${item?.quantity}</td>
  //         <td>£${Number(item?.price || 0).toFixed(2)}</td>
  //         <td>£${Number(item?.total || 0).toFixed(2)}</td>
  //       </tr>

  //       ${(index + 1) % 20 === 0 ? '<div class="page-break"></div>' : ''}
  //     `,
  //     )
  //     .join('')}
  // </tbody>
  //     </table>
  //   </div>

  //   <!-- TOTALS -->
  //   <div class="section">
  //     <table class="totals">
  //       ${a4PrintDetails?.totals
  //         .map(
  //           item => `
  //           <tr>
  //             <td class="right bold-black">${item.title}</td>
  //             <td class="right">£${Number(item?.value || 0).toFixed(2)}</td>
  //           </tr>
  //         `,
  //         )
  //         .join('')}
  //     </table>
  //   </div>

  // </body>
  // </html>
  // `;
  //   };

  //   const generate80mmInvoice = async () => {
  //     const totalsMap = Object.fromEntries(
  //       (a4PrintDetails?.totals || []).map(item => [
  //         item.code,
  //         Number(item.value || 0).toFixed(2),
  //       ]),
  //     );

  //     return `
  // <!DOCTYPE html>
  // <html>
  // <head>
  // <meta charset="UTF-8" />

  // <style>

  //   @page {
  //     size: 80mm auto;
  //     margin: 0;
  //   }

  //   body {
  //     margin: 0;
  //     padding: 5px;
  //     width: 100% !important;         /* Critical fix */
  //     font-family: Arial, Helvetica, sans-serif;
  //     font-size: 10px;
  //     color: #000;
  //   }

  //   .order-id {
  //     font-size: 10px;
  //     margin-top: 10px;
  //     margin-bottom: 2px;
  //   }

  //   .company-title {
  //     font-size: 15px;
  //     font-weight: bold;
  //     text-align: left;
  //     line-height: 1.1;
  //     margin-top: 2px;
  //   }

  //   .company-title .red { color: #b22222; }
  //   .company-title .black { color: #000; }

  //   .company-details {
  //     font-size: 10px;
  //     margin-bottom: 3px;
  //   }

  //   .bold-label {
  //     font-weight: bold;
  //     margin: 5px 0;
  //     font-size: 10px;
  //   }

  //   table {
  //   width: calc(100% - 12px);

  //   border-collapse: collapse;
  //   margin: 5px 0;

  //   }

  //   th, td {
  //     border: 1px solid #e6e6e6;
  //     padding: 4px;
  //     font-size: 10px;
  //   }

  //   th {
  //     font-weight: bold;
  //     background: #fff;
  //   }

  //   .qty, .price, .total {
  //     text-align: center;
  //   }

  //   .summary-row td {
  //     font-weight: bold;
  //     text-align: right;
  //     padding: 5px;
  //   }

  // </style>
  // </head>

  // <body>

  //   <div class="order-id">Order Id: ${a4PrintDetails?.order_id}</div>

  //   <div class="company-title">
  //     <span class="red">Ron Currie & Sons</span>
  //     <span class="black">Ltd</span>
  //   </div>

  //   <div class="company-details">
  //     Tel: ${a4PrintDetails?.settings?.config_telephone}<br>
  //     VAT: ${companyDetails?.companyVat}
  //   </div>

  //   <div class="bold-label">
  //     Date Added: ${
  //       a4PrintDetails?.shipping_method === 'Delivery'
  //         ? a4PrintDetails?.order_date
  //         : a4PrintDetails?.date_added
  //     }
  //   </div>

  //   <table>
  //     <tr>
  //       <th>Product</th>
  //       <th>Qty</th>
  //       <th>Price</th>
  //       <th>Total</th>
  //     </tr>

  //     ${a4PrintDetails?.products
  //       ?.map(
  //         product => `
  //         <tr>
  //           <td>${product?.name} ${
  //           product?.options
  //             ? `<div style="font-size:9px;">- ${product.options.name}: ${product.options.value}</div>`
  //             : ''
  //         }</td>
  //           <td class="qty">${product?.quantity}</td>
  //           <td class="price">£${Number(product?.price).toFixed(2)}</td>
  //           <td class="total">£${Number(product?.total).toFixed(2)}</td>
  //         </tr>
  //       `,
  //       )
  //       .join('')}

  //     <tr class="summary-row">
  //       <td colspan="3">Groups =</td>
  //       <td style="text-align:left;">${a4PrintDetails?.products?.length}</td>
  //     </tr>

  //     <tr class="summary-row">
  //       <td colspan="3">Inc VAT Sub-Total</td>
  //       <td>£${totalsMap['sub_total']}</td>
  //     </tr>

  //     <tr class="summary-row">
  //       <td colspan="3">Total (VAT = £${totalsMap['tax']})</td>
  //       <td>£${totalsMap['total']}</td>
  //     </tr>

  //   </table>

  // </body>
  // </html>
  //   `;
  //   };

  const generatePDF = async () => {
    const totalsMap = {};
    a4PrintDetails?.totals?.forEach(item => {
      totalsMap[item.code] = parseFloat(item.value).toFixed(2);
    });
    const vatItem = a4PrintDetails?.totals?.find(item => item.code === 'tax');

    const vatAmount = vatItem ? Number(vatItem.value || 0).toFixed(2) : '0.00';
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #000;
        margin: 0;
        padding: 20px;
      }
      h1 {
        font-size: 22px;
        margin-bottom: 15px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 8px;
        border: 1px solid #e6e6e6;
        vertical-align: top;
      }
      th {
        text-align: left;
      }
      .section {
        border: 1px solid #e6e6e6;
        margin-bottom: 15px;
        margin-top: 20px;
      }
      .section-title {
        font-weight: bold;
        padding: 8px;
        border-bottom: 1px solid #e6e6e6;
      }
      .content-table td {
        padding: 10px;
        vertical-align: top;
      }
      .product-sub {
        font-size: 10px;
        color: #555;
      }
      .totals td {
        border: 1px solid #e6e6e6;
        padding: 8px;
      }
      .totals tr td:first-child {
        width: 80%;
      }
      .totals tr:last-child td {
        font-weight: bold;
      }
      .right {
        text-align: right;
      }
  
      /* Address Box */
      .section1 {
        margin-top: 20px;
        border: 1px solid #e6e6e6;
        border-radius: 4px;
      }
      .address-row1 {
        display: flex;
        font-weight: bold;
        border-bottom: 1px solid #e6e6e6;
        padding: 0;
        margin: 0;
      }
      .address-column1 {
        width: 50%;
        font-size: 13px;
        padding: 8px 10px;
        box-sizing: border-box;
      }
      .address-row {
        display: flex;
        justify-content: space-between;
        margin: 0;
        padding: 0;
      }
      .address-column {
        width: 50%;
        padding: 8px 10px;
        font-size: 13px;
        line-height: 1.4;
        box-sizing: border-box;
      }
      .left-column {
        border-right: 1px solid #e6e6e6;
      }
  
      @media print {
        html, body {
          width: 210mm;
          height: auto;
        }
        .section {
          page-break-inside: avoid;
        }
        .page-break {
          display: block;
          page-break-before: always;
          break-before: always;
        }
      }
    </style>
  </head>
  
  <body>
  
   
    <div style="display: flex; align-items: center; justify-content: space-between;">
    <h1 style="margin: 0;">Invoice #${a4PrintDetails?.order_id}</h1>
  
  <img src="https://nomansland.roncurry.co.uk/assets/roncurries-logo-2iaZ574S.png" 
       style="width:150px;height:auto;" />
       
  </div>
  
    <!-- ORDER DETAILS -->
    <div class="section">
      <div class="section-title">Order Details</div>
      <table class="content-table">
        <tr>
          <td width="50%">
            ${
              a4PrintDetails?.shipping_method != 'Collection'
                ? `
                 <b>${a4PrintDetails?.epos_customer_name}</b><br/>
                 ${a4PrintDetails?.epos_customer_address}<br/>
                 ${a4PrintDetails?.epos_customer_number}<br/>
          
      
                `
                : `
                  <b>${a4PrintDetails?.epos_customer_name}</b><br/>
                  ${a4PrintDetails?.epos_customer_number}<br/>
                  ${a4PrintDetails?.epos_car_detail}<br/>
                `
            }
          </td>
  
          <td width="50%">
         <b>Date Added:</b> ${
           a4PrintDetails?.shipping_method != 'Collection'
             ? a4PrintDetails?.date_added
             : a4PrintDetails?.date_added
         }<br/>
               <b>Telephone:</b> ${companyDetails?.mobile}  <b>VAT#</b> ${
      companyDetails?.companyVat
    }<br/>
            <b>Order ID:</b> ${a4PrintDetails?.order_id}<br/>
            <b>Payment Method:</b> ${a4PrintDetails?.payment_method}<br/>
            <b>Delivery Method:</b> ${a4PrintDetails?.shipping_method}
          </td>
        </tr>
      </table>
    </div>
  
    <!-- SHOW BOTH ADDRESS SECTIONS ONLY IF DELIVER -->
    ${
      a4PrintDetails?.shipping_method != 'Collection'
        ? `
    <div class="section1">
      <div class="address-row1">
        <div class="address-column1">Payment Address</div>
        <div class="address-column1">Delivery Address</div>
      </div>
  
      <div class="address-row">
        <div class="address-column left-column">
          <p>
            <b>${a4PrintDetails?.epos_customer_name} </b><br/>
            ${a4PrintDetails?.epos_customer_address}<br/>
            
          </p>
        </div>
  
        <div class="address-column right-column">
          <p>
            ${a4PrintDetails?.shipping_company}<br/>
            ${a4PrintDetails?.shipping_address_1}  ${a4PrintDetails?.shipping_address_2}<br/>
         
            ${a4PrintDetails?.shipping_city}<br/>
            ${a4PrintDetails?.shipping_postcode}<br/>
            ${a4PrintDetails?.shipping_country}<br/>
            ${a4PrintDetails?.shipping_zone}
    
          </p>
        </div>
      </div>
    </div>
        `
        : ''
    }
  
    <!-- PRODUCT LIST -->
    <div class="section">
      <table>
        <thead>
          <tr>
            <th>No. of Products</th>
            <th>Model</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
  
  <tbody>
    ${a4PrintDetails?.products
      .map(
        (item, index) => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              
              <img 
                src="https://roncurry.co.uk/roncurry/public/image/${
                  item.product.image
                }" 
                style="width:70px; height:auto; border-radius:5px;" 
              />
  
              <div>
                ${item?.name}<br/>
                ${
                  item?.options
                    ? `<span class="product-sub">- ${item.options.name}: ${item.options.value}</span>`
                    : ''
                }
              </div>
  
            </div>
          </td>
  
          <td>${item?.model}</td>
          <td>${item?.quantity}</td>
          <td>£${Number(item?.price || 0).toFixed(2)}</td>
          <td>£${Number(item?.total || 0).toFixed(2)}</td>
        </tr>
  
        ${(index + 1) % 20 === 0 ? '<div class="page-break"></div>' : ''}
      `,
      )
      .join('')}
  </tbody>
      </table>
    </div>
  
    <!-- TOTALS -->
    <div class="section">
  
  
  
      <table class="totals">
    ${a4PrintDetails?.totals
      .map(item => {
        if (item.code === 'total') {
          return `
            <tr>
              <td class="right bold-black">
                ${item.title} (VAT £${vatAmount})
              </td>
              <td class="right">
                £${Number(item.value || 0).toFixed(2)}
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td class="right">${item.title}</td>
            <td class="right">£${Number(item.value || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join('')}
  </table>
    </div>
  <div class="section">
    <div class="section-title">
      History Updates (${a4PrintDetails?.order_history?.length || 0})
    </div>
  
    <table>
      <thead>
        <tr>
          <th width="25%">Date Added</th>
          <th width="25%">Order Status</th>
          <th width="50%">Comment</th>
        </tr>
      </thead>
  
      <tbody>
        ${
          a4PrintDetails?.order_history &&
          a4PrintDetails.order_history.length > 0
            ? a4PrintDetails.order_history
                .map(
                  history => `
                  <tr>
                    <td>${history?.date_added || '-'}</td>
                    <td>${history?.order_history_name?.name || '-'}</td>
                    <td>${history?.comment || '—'}</td>
                  </tr>
                `,
                )
                .join('')
            : `
              <tr>
                <td colspan="3" style="text-align:center; padding:12px;">
                  No customer updates
                </td>
              </tr>
            `
        }
      </tbody>
    </table>
  </div>
  </body>
  </html>
  `;
  };
  const generate80mmInvoice = async () => {
    const totalsMap = Object.fromEntries(
      (a4PrintDetails?.totals || []).map(item => [
        item.code,
        Number(item.value || 0).toFixed(2),
      ]),
    );

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 6px;
    width: 100% !important;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;               /* ⬆️ 3x readable */
    font-weight: 600;              /* ⬆️ stronger text */
    color: #000;
  }

  .order-id {
    font-size: 16px;
    font-weight: 900;
    margin-top: 10px;
    margin-bottom: 4px;
  }

  .company-title {
    font-size: 23px;               /* ⬆️ BIG & BOLD */
    font-weight: 900;
    text-align: left;
    line-height: 1.2;
    margin-top: 4px;
  }

  .company-title .red { color: #b22222; }
  .company-title .black { color: #000; }

  .company-details {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .bold-label {
    font-weight: 900;
    margin: 6px 0;
    font-size: 14px;
  }

  table {
    width: calc(100% - 10px);
    border-collapse: collapse;
    margin: 6px 0;
  }

  th, td {
    border: 1px solid #e6e6e6;
    padding: 6px;                 /* ⬆️ spacing */
    font-size: 16px;
    font-weight: 700;
  }

  th {
    font-weight: 900;
    background: #fff;
  }

  .qty, .price, .total {
    text-align: center;
    font-weight: 900;
  }

  .summary-row td {
    font-weight: 900;
    text-align: right;
    padding: 6px;
    font-size: 14px;
  }
</style>
</head>

<body>

  <div class="order-id">Order Id: ${a4PrintDetails?.order_id}</div>

  <div class="company-title">
    <span class="red">Ron Currie & Sons</span>
    <span class="black"> Ltd</span>
  </div>

  <div class="company-details">
    Tel: ${a4PrintDetails?.settings?.config_telephone}<br>
    VAT: ${companyDetails?.companyVat}
  </div>

  <div class="bold-label">
    Date Added: ${
      a4PrintDetails?.shipping_method === 'Delivery'
        ? a4PrintDetails?.order_date
        : a4PrintDetails?.date_added
    }
  </div>

  <table>
    <tr>
      <th>Product</th>
      <th>Qty</th>
      <th>Price</th>
      <th>Total</th>
    </tr>

    ${a4PrintDetails?.products
      ?.map(
        product => `
        <tr>
          <td>
            ${product?.name}
            ${
              product?.options
                ? `<div style="font-size:12px;font-weight:700;">- ${product.options.name}: ${product.options.value}</div>`
                : ''
            }
          </td>
          <td class="qty">${product?.quantity}</td>
          <td class="price">£${Number(product?.price).toFixed(2)}</td>
          <td class="total">£${Number(product?.total).toFixed(2)}</td>
        </tr>
      `,
      )
      .join('')}

    <tr class="summary-row">
      <td colspan="3">Groups</td>
      <td style="text-align:left;">${a4PrintDetails?.products?.length}</td>
    </tr>

    <tr class="summary-row">
      <td colspan="3">Inc VAT Sub-Total</td>
      <td>£${totalsMap['sub_total']}</td>
    </tr>

    <tr class="summary-row">
      <td colspan="3">Total (VAT £${totalsMap['tax']})</td>
      <td>£${totalsMap['total']}</td>
    </tr>
  </table>

</body>
</html>
  `;
  };
  const printWithStarPassPRNT = async html => {
    try {
      const encodedHTML = encodeURIComponent(html);
      const returnURL = encodeURIComponent('roncurrieapp://print-complete');

      const passprnt_uri =
        `starpassprnt://v1/print/nopreview?` +
        `size=3` +
        `&popup=disabled` +
        `&callback=${returnURL}` +
        `&back=${returnURL}` +
        `&html=${encodedHTML}`;

      // ✅ Try to open directly — Android canOpenURL ALWAYS fails
      await Linking.openURL(passprnt_uri);
    } catch (error) {
      // ✅ If fails → app is not installed
      Alert.alert(
        'Star PassPRNT Not Installed',
        'This device does not have the Star PassPRNT application installed. Please install it to proceed with printing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Install',
            onPress: () => {
              const storeUrl =
                Platform.OS === 'android'
                  ? 'https://play.google.com/store/apps/details?id=jp.star_m.passprnt'
                  : 'https://apps.apple.com/us/app/star-passprnt/id1348333945';

              Linking.openURL(storeUrl);
            },
          },
        ],
      );
    }
  };
  const handlePrint = async format => {
    try {
      let html =
        format === '80mm' ? await generate80mmInvoice() : await generatePDF();

      if (format === '80mm') {
        await printWithStarPassPRNT(html);
        // await RNPrint.print({ html });
      } else {
        await RNPrint.print({ html });
      }
    } catch (error) {
      console.log('Print error:', error);
    }
  };

  const handleItemPress = item => {
    dispatch(clearProducts());
    navigation.navigate('DisplayItems', { itemData: item });
  };

  const decodeHtml = text => {
    if (!text) return '';
    return text
      .replace(/&quot;/g, '')
      .replace(/&apos;/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/["']/g, '')
      .replace(/[^a-zA-Z0-9\s.,-]/g, '')
      .trim();
  };
  const renderItem = ({ item }) => {
    const imageUrl = item?.image ? ImageBaseUrl + item.image : null;

    const handleError = () => {
      setImageErrorMap(prev => ({ ...prev, [item.id]: true }));
    };

    const hasError = imageErrorMap[item.id] || false;

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleItemPress(item)}
      >
        {imageUrl && !hasError ? (
          <FastImage
            style={styles.itemImage}
            source={{
              uri: imageUrl,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
        ) : (
          <Ionicons name="images" size={moderateScale(80)} color={Color.GRAY} />
        )}

        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>
            {decodeHtml(item.name) || decodeHtml(item.descriptions?.name)}
          </Text>
          <Text style={styles.itemPrice}>
            £ {Number(item.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.leftContainer}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              }),
            );
          }}
        >
          <Image
            source={IconData.Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View> */}

      <SearchComponent
        onResults={setResults}
        onLoadMoreRef={setLoadMoreFunc}
        navigation={navigation}
        autoFocus={true}
      />
      {results?.length > 0 ? (
        <>
          <FlatList
            data={results}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) =>
              `${item.id || item.product_id || index}`
            }
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: moderateScale(120),
            }}
            onEndReached={() => loadMoreFunc && loadMoreFunc()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore && (
                <Text style={{ textAlign: 'center' }}>Loading...</Text>
              )
            }
          />
        </>
      ) : (
        <>
          <View
            style={{
              flex: 0.9,

              marginVertical: verticalScale(20),
            }}
          >
            <View
              style={{
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LottieView
                source={require('../assets/cart.json')}
                autoPlay
                loop={true} // ✅ plays only once
                style={{ width: 150, height: 150 }}
              />
              <Text style={styles.title}>Ordered Successfully</Text>
              <View
                style={{
                  width: moderateScale(100),
                  height: 3,
                  backgroundColor: Color.RED,
                  marginBottom: moderateScale(40),
                }}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Return ID: </Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: Color.RED,
                    fontSize: verticalScale(16),
                    fontFamily: FONT.BOLD,
                  },
                ]}
              >
                #{data?.data?.order_id}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Date: </Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: Color.BLACK2,
                    fontSize: verticalScale(16),
                    fontFamily: FONT.BOLD,
                  },
                ]}
              >
                {data?.timestamp}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Delivery Method: </Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: Color.BLACK2,
                    fontSize: verticalScale(16),
                    fontFamily: FONT.BOLD,
                  },
                ]}
              >
                {data?.data?.delivery_method}
              </Text>
            </View>
          </View>

          <View style={[styles.actionRow,{flex:isKeyboardOpen?0.15:0.1}]}>
            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={() => {
                handlePrint('A4');
              }}
            >
              <Text style={styles.createOrderText}>Print A4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={() => {
                handlePrint('80mm');
              }}
            >
              <Text style={styles.createOrderText}>Print 80mm</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  container1: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '10@s',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    gap: 10,
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logo: { width: '80%', height: moderateScale(40) },
  actionRow: {
  
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Color.GRAY3,
    padding: moderateScale(5),
    borderTopWidth: 1,
    gap: moderateScale(10),
    borderTopColor: Color.GRAY2,
  },
  createOrderBtn: {
    backgroundColor: Color.RED,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(8),
  },

  createOrderText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontFamily: FONT.BOLD,
  },
  title: {
    fontSize: '28@s',
    fontFamily: FONT.BOLD,
    color: Color.BLACK,
    borderBottomColor: Color.RED,
    marginTop: verticalScale(20),
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: '5@s',
    paddingHorizontal: '15@s',
    alignItems: 'center',
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: '16@s',
    fontFamily: FONT.BOLD,
    color: Color?.BLACK,
  },

  value: {
    fontSize: '13@s',
    fontWeight: FONT?.SEMIBOLD,
    color: '#333',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
    gap: moderateScale(5),
  },
  itemImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  itemName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: moderateScale(13),
    color: '#555',
  },
});

export default React.memo(OrderSuccessFull);
