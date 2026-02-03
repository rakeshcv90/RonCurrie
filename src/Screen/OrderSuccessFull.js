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
  console.log('a4PrintDetails', isKeyboardOpen);
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
       margin: 0 !important;
       padding: 10px 35px 10px 35px !important;
       height: auto !important;
       width: 100% !important;
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
       border: 1px solid #dddddd;
       vertical-align: top;
     }
     th {
       text-align: left;
     }
     .section {
       border: 1px solid #dddddd;
       margin-bottom: 15px;
      
     }
     .section-title {
       font-weight: bold;
       padding: 8px;
       border-bottom: 1px solid #dddddd;
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
       border: 1px solid #dddddd;
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
       margin-bottom: 20px;
       border: 1px solid #dddddd;
       border-radius: 4px;
     }
     .address-row1 {
       display: flex;
       font-weight: bold;
       border-bottom: 1px solid #dddddd;
       padding: 0;
       margin: 0;
     }
     .address-column1 {
       width: 50%;
       font-size: 13px;
       padding: 8px 10px;
       box-sizing: border-box;
       border-right: 1px solid #dddddd;
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
       border-right: 1px solid #dddddd;
     }
 .no-right-border {
   border-right: none !important;
 }
 
 .no-left-border {
   border-left: none !important;
 }
   .no-border {
   border-left: none !important;
   border-right: none !important;
   text-align: left;
 }
   .totals tr:first-child td {
   border-bottom: none;
   font-weight: bold;
 }
  .groups-table {
   width: 50%;         
   border-collapse: collapse;
   margin-left: auto;   
   margin-right: 0;
     margin-top: -15px;
 }
 
 .groups-table td {
   border: none;
   padding: 4px 8px;
   font-size: 14px;
    vertical-align: middle;
 }
 
 .groups-table td:first-child {
   width: 80%;
   text-align: right;
   font-weight: bold;
   border-right: 1px solid #dddd; /* optional divider */
   padding-right: 10px;
   
 }
 tfoot td {
   border-top: 1px solid #ddd;
   padding: 8px;
 }
 
 .groups-table td:last-child {
    text-align: left;  /* align value to left */
   font-weight: bold;
   padding-left: 15px; 
 }
 
 /* remove margins from outer container */
 .no-margin {
   margin: 0 !important;
   padding: 0 !important;
 }
 
 .no-outer-border {
   border: none !important;
 }
 @media print {
   html, body {
     width: 210mm;
     height: auto;
   }
 
   /* allow table to break naturally */
   table {
     page-break-inside: auto;
   }
 
   thead {
     display: table-header-group;
   }
 
   tfoot {
     display: table-footer-group;
   }
 
   tr {
     page-break-inside: avoid;
     page-break-after: auto;
   }
 
   /* KEEP your section rule */
 .section {
   page-break-inside: avoid;
 }
 
 /* allow product list to split across pages */
 .product-section {
   page-break-inside: auto !important;
 }
 
 }
 @page {
   margin-top: 10mm;
 
 }
     
   </style>
 </head>
 
 <body>
 
  
   <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
        <h1 style="margin: 0; font-size: 30px; font-weight: 600;">Order ID: ${
          a4PrintDetails?.order_id
        }</h1>
 
       <img src="https://nomansland.roncurry.co.uk/assets/roncurries-logo-2iaZ574S.png" 
      style="width:400px;height:auto;" />
      
   </div>
 
   <!-- ORDER DETAILS -->
 <div class="section product-section">
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
     <b>Date Added:</b> ${(() => {
       if (!a4PrintDetails?.date_added) return '-';
 
       const d = new Date(a4PrintDetails.date_added);
       const day = String(d.getDate()).padStart(2, '0');
       const month = String(d.getMonth() + 1).padStart(2, '0');
       const year = String(d.getFullYear());
 
       return `${day}/${month}/${year}`;
     })()}
     <br/>
 
     <b>Telephone:</b> ${companyDetails?.mobile}  <b>VAT#</b> ${
       companyDetails?.companyVat
     }<br/>
          
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
  <div class="section product-section">
     <table>
       <thead>
       <tr>
     <th colspan="2" class="no-border">Order ID: ${a4PrintDetails?.order_id}</th>
     <th>Model</th>
     <th>Quantity</th>
     <th>Price</th>
     <th>Total</th>
      </tr>
       </thead>
 
 <tbody>
 ${a4PrintDetails?.products
   .map((item, index) => {
     const BASE_IMAGE_URL = 'https://roncurry.co.uk/roncurry/public/image/';
     const NO_IMAGE_URL =
       'https://roncurry.co.uk/roncurry/public/image/no-image.png';
     const optionImage =
       item?.options?.product_option_value_dimension?.option_image;
     // const finalImage =
     //   optionImage && optionImage !== '' ? optionImage : item?.product?.image;
 
     const finalImage =
       optionImage && optionImage !== ''
         ? optionImage
         : item?.product?.image
         ? item.product.image
         : NO_IMAGE_URL;
 
     // If finalImage is NOT a full URL, prepend base URL
     const imageSrc = finalImage.startsWith('http')
       ? finalImage
       : `${BASE_IMAGE_URL}${finalImage}`;
 
     return `
       <tr>
         
 <td style="width:130px; text-align:center; vertical-align:middle;">
   <div style="display:flex; justify-content:center; align-items:center;">
     <img 
       src="${imageSrc}"
 
   style="
     width:120px;
     height:80px;
     object-fit:contain;
     border-radius:5px;
   "
       alt="${item?.name || 'Product Image'}"
     />
   </div>
 </td>
         <td>
           <div style="display:flex; align-items:center; gap:10px;">
           
             <div>
               ${item?.name}<br/>
          ${
            Array.isArray(item?.order_options) && item.order_options.length > 0
              ? item.order_options
                  .map(
                    opt => `
             <span class="product-sub">
               - ${opt.name}: ${opt.value}
             </span><br/>
           `,
                  )
                  .join('')
              : ''
          }
             </div>
           </div>
         </td>
         <td>${item?.model}</td>
         <td>${item?.quantity}</td>
         <td>£${Number(item?.price || 0).toFixed(2)}</td>
 <td style="${item?.refund == 1 ? 'color:#ff0000' : ''}">
   £${item?.refund == 1 ? '-' : ''}${Number(item?.total || 0).toFixed(2)}
 </td>
       </tr>
     
     `;
   })
   .join('')}
 </tbody>
 </tbody>
 
 <tfoot>
 
   <!-- GROUP ROW (optional) -->
 
         <tr>
           <td colspan="5" class="right" style="font-weight:bold; font-size: 13px;">
             Group
           </td>
           <td class="right" >
             ${a4PrintDetails?.products?.length}
           </td>
         </tr>
 
 ${(() => {
   const misc = a4PrintDetails?.totals?.find(
     item => item.code === 'miscellaneous',
   );
 
   return misc
     ? `
         <tr>
           <!-- TITLE LEFT -->
           <td colspan="5" style="font-weight:bold; text-align:left; font-size: 13px;">
             ${misc.title}
           </td>
 
           <!-- VALUE RIGHT -->
           <td style=" text-align:right; font-size: 13px;">
             £${Number(misc.value || 0).toFixed(2)}
           </td>
         </tr>
       `
     : '';
 })()}
 
 
 
   <!-- WEIGHT + TOTAL ROW -->
 ${a4PrintDetails?.totals
   .filter(item => !['sub_total', 'tax', 'miscellaneous'].includes(item.code))
   .map(
     item => `
     <tr>
       <!-- IMAGE COLUMN -->
       <td style="font-weight:bold; font-size: 13px;">
         ${item.code === 'total' ? 'Weight (kg):' : ''}
       </td>
 
       <!-- WEIGHT VALUE -->
       <td colspan="2">
         ${
           item.code === 'total'
             ? `<span style="font-weight:normal;">
                  ${Number(a4PrintDetails?.total_order_weight || 0).toFixed(
                    2,
                  )} kg
                </span>`
             : ''
         }
       </td>
 
       <!-- TOTAL LABEL -->
      <td colspan="2" class="right" style="font-weight:bold; white-space: nowrap; font-size: 13px;">
        ${item.title}${item.code === 'total' ? ` (VAT £${vatAmount})` : ''}
        </td>
 
 
       <!-- TOTAL VALUE -->
       <td class="right" >
         £${Number(item.value || 0).toFixed(2)}
       </td>
     </tr>
   `,
   )
   .join('')}
 
 
 
 </tfoot>
 
 
   </table>
 </div>
 
 
 
 
 
   </div>
 <div class="section">
   <div class="section-title">
     History Updates${
       a4PrintDetails?.order_history?.length > 0
         ? ` (${a4PrintDetails.order_history.length})`
         : '()'
     }
   </div>
 
 ${
   a4PrintDetails?.order_history && a4PrintDetails.order_history.length > 0
     ? `
       <table>
         <thead>
           <tr>
             <th width="25%">Date Added</th>
             <th width="25%">Order Status</th>
             <th width="50%">Comment</th>
           </tr>
         </thead>
 
         <tbody>
           ${a4PrintDetails.order_history
             .map(
               history => `
                 <tr>
                   <td>${history?.date_added || '-'}</td>
                   <td>${history?.order_history_name?.name || '-'}</td>
                   <td>${history?.comment || '—'}</td>
                 </tr>
               `,
             )
             .join('')}
         </tbody>
       </table>
     `
     : `
       <div style="text-align:left; padding:12px; ">
         No customer updates
       </div>
     `
 }
 
 </div>
 </body>
 </html>
 `;
   };
 

 const generate80mmInvoice = () => {
    const totalsMap = Object.fromEntries(
      (a4PrintDetails?.totals || []).map(item => [
        item.code,
        Number(item.value || 0).toFixed(2),
      ]),
    );

    // Products HTML
    const productsHtml = (a4PrintDetails?.products || [])
      .map(product => {
        return `
        <tr>
          <td>
            ${product.name}
        ${
          Array.isArray(product?.order_options) &&
          product.order_options.length > 0
            ? product.order_options
                .map(
                  opt => `
            <span class="product-sub">
              - ${opt.name}: ${opt.value}
            </span><br/>
          `,
                )
                .join('')
            : ''
        }

          </td>
          <td class="qty">${product.quantity}</td>
          <td class="price">£${Number(product.price).toFixed(2)}</td>
          <td class="total">£${Number(product.total).toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');

    // Date logic
    const dateAdded = (() => {
      const rawDate =
        a4PrintDetails?.shipping_method === 'Delivery'
          ? a4PrintDetails?.order_date
          : a4PrintDetails?.date_added;

      if (!rawDate) return '-';

      const d = new Date(rawDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return `${day}/${month}/${year}`;
    })();

    // Return HTML
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
@page { margin: 0; }

html, body {
  width: 80mm;
  margin: 0;
  padding: 0;
}

body {
  padding: 6px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.order-id { font-size: 16px; font-weight: 900; margin-top: 10px; }
.company-title { font-size: 23px; font-weight: 900; line-height: 1.2; }
.company-title .red { color: #b22222; }
.company-title .black { color: #000; }
.company-details { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.bold-label { font-weight: 900; margin: 6px 0; font-size: 14px; }

table {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0;
}

th, td {
  border: 1px solid #e6e6e6;
  padding: 6px;
  font-size: 16px;
  font-weight: 700;
}

th { font-weight: 900; }
.qty, .price, .total { text-align: center; font-weight: 900; }
.summary-row td { font-weight: 900; text-align: right; font-size: 14px; }
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

<div class="bold-label">Date Added: ${dateAdded}</div>

<table>
<tr>
  <th>Product</th>
  <th>Qty</th>
  <th>Price</th>
  <th>Total</th>
</tr>

${productsHtml}

<tr class="summary-row">
  <td colspan="3">Groups</td>
  <td style="text-align:left;">${a4PrintDetails?.products?.length || 0}</td>
</tr>

<tr class="summary-row">
  <td colspan="3">Inc VAT Sub-Total</td>
  <td>£${totalsMap.sub_total || '0.00'}</td>
</tr>

<tr class="summary-row">
  <td colspan="3">Total (VAT £${totalsMap.tax || '0.00'})</td>
  <td>£${totalsMap.total || '0.00'}</td>
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
          <FastImage
            style={styles.itemImage}
            source={ImageData?.NOIMAGE}
            resizeMode={FastImage.resizeMode.cover}
            onError={handleError}
          />
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

          <View
            style={[styles.actionRow, { flex: isKeyboardOpen ? 0.15 : 0.1 }]}
          >
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
