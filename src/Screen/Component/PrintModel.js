import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color, companyDetails, FONT } from '../../Component/Image';
import RNPrint from 'react-native-print';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearA4Products,
  fetchA4PrintDetails,
} from '../../Redux/Slice/A4PrintSlice';

const PrintModel = ({ visible, onClose, printData }) => {
  const dispatch = useDispatch();
  const { a4PrintDetails, loading, error } = useSelector(
    state => state.a4PrintData,
  );

  const STAR_PASSPRNT_SCHEME = 'starpassprnt://';
  const [selectedOption, setSelectedOption] = useState('A4');

  useEffect(() => {
    if (printData) {
      const fetchData = async () => {
        try {
          await dispatch(fetchA4PrintDetails(printData)).unwrap();
        } catch (error) {
          console.log('API Error:', error);
        }
      };
      fetchData();
    }
  }, [visible, dispatch, printData]);

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
   
    thead {
      display: table-header-group;
    }
  
    tfoot {
      display: table-footer-group;
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
                      ${
                        a4PrintDetails?.epos_customer_number?.trim()
                          ? a4PrintDetails?.epos_customer_number
                          : a4PrintDetails?.telephone
                      }<br/>
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
  
      <b>Telephone:</b> ${
        a4PrintDetails?.settings?.config_telephone
      }  <b>VAT#</b> ${a4PrintDetails?.settings?.config_vat_number}<br/>
           
            <b>Payment Method:</b> ${a4PrintDetails?.payment_method}<br/>
                    <b>Delivery Method:</b> 
 <span style="color: red;">
   ${a4PrintDetails?.shipping_method || ''}
 </span><br/>

    ${
      a4PrintDetails?.shipping_method != 'Collection'
        ? `<b>Est. Delivery Date:</b> 
 <span style="color: red;">
   ${a4PrintDetails?.order_date || ''}
 </span>`
        : ''
    }


 
 
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
      <th colspan="2" class="no-border">Order ID: ${
        a4PrintDetails?.order_id
      }</th>
      <th>Model</th>
      <th>Qty</th>
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
              ${item?.product?.isbn}<br/>
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
  
 <!-- TOTALS – SAME DESIGN, NEW PAGE -->
 <div class="section totals-section">
   <table>
     <tbody>
 ${
   a4PrintDetails?.comment
     ? `
  <tr>
    <td colspan="6" style="font-weight:bold; font-size:13px;">

      <span style="font-weight:normal;">
        ${a4PrintDetails?.comment}
      </span>
    </td>
  </tr>
`
     : ''
 }
    
    ${a4PrintDetails?.totals
      ?.filter(item => item.code === 'miscellaneous')
      .map(
        misc => `
       <tr>
         <td colspan="5" style="font-weight:bold; font-size:13px;">
           ${misc.title}
         </td>
         <td class="right">
           £${Number(misc.value || 0).toFixed(2)}
         </td>
       </tr>
     `,
      )
      .join('')}
      <!-- GROUP ROW -->
       <tr>
         <td colspan="5" class="right" style="font-weight:bold; font-size:13px;">
           Group=
         </td>
         <td class="right">
           ${a4PrintDetails?.products?.length}
         </td>
       </tr>

          
 
       <!-- WEIGHT + TOTAL ROWS -->
       ${a4PrintDetails?.totals
         .filter(
           item => !['sub_total', 'tax', 'miscellaneous'].includes(item.code),
         )
         .map(
           item => `
           <tr>
             <!-- LEFT EMPTY / LABEL COLUMN -->
             <td style="font-weight:bold; font-size:13px;">
               ${item.code === 'total' ? 'Weight (kg)' : ''}
             </td>
 
             <!-- WEIGHT VALUE -->
             <td colspan="2">
               ${
                 item.code === 'total'
                   ? `${Number(a4PrintDetails?.total_order_weight || 0).toFixed(
                       2,
                     )} kg`
                   : ''
               }
             </td>
 
             <!-- TOTAL LABEL -->
             <td colspan="2" class="right" style="font-weight:500; font-size:13px;">
               ${item.title}
               ${item.code === 'total' ? ` (VAT £${vatAmount})` : ''}
             </td>
 
             <!-- TOTAL VALUE -->
             <td class="right" style="font-weight:600;">
               £${Number(item.value || 0).toFixed(2)}
             </td>
           </tr>
         `,
         )
         .join('')}
 
     </tbody>
   </table>
 </div>
  
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

  ${
    a4PrintDetails?.comment
      ? `
        <tr>
          <td>-</td>
          <td><strong>Main Comment</strong></td>
          <td>${a4PrintDetails.comment}</td>
        </tr>
      `
      : ''
  }
</tbody>
        </table>
      `
      : `
      
        <div style="text-align:left; padding:12px; ">
          No customer updates
        </div>

        ${
          a4PrintDetails?.comment
            ? `
        <table style="margin-top:10px;">
          <tbody>
            <tr>
              <td width="25%" style="font-weight:600;">Notes</td>
              <td width="75%">${a4PrintDetails.comment}</td>
            </tr>
          </tbody>
        </table>
      `
            : ''
        }
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
    console.log('a4PrintDetails', a4PrintDetails);
    const decodeHtml = text => {
      if (!text) return '';

      const htmlEntities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
      };

      return text.replace(
        /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g,
        match => htmlEntities[match],
      );
    };
    const shippingItem = a4PrintDetails?.totals?.find(
      item => item.code === 'shipping',
    );
    const shippingAmount = shippingItem
      ? Number(shippingItem.value).toFixed(2)
      : '0.00';

    const miscellaneousItems =
      a4PrintDetails?.totals?.filter(
        item =>
          item.code === 'miscellaneous' &&
          item.title !== 'undefined' &&
          item.value !== '0.0000',
      ) || [];

    const shippingTitle = shippingItem ? shippingItem.title : 'Collection';
    const productsHtml = (a4PrintDetails?.products || [])
      .map(product => {
        return `
      <tr>

        <td class="product-name">
     
${decodeHtml(product?.product_details?.isbn)}
${
  Array.isArray(product?.order_options) && product.order_options.length > 0
    ? product.order_options
        .map(
          opt => `
        <div class="product-sub">
          -${opt.name}: ${opt.value}
        </div>
      `,
        )
        .join('')
    : ''
}

        </td>

        <td class="qty">${product.quantity}</td>

        <td class="price">£${Number(product.price).toFixed(2)}</td>

     <td class="total ${product?.refund == 1 ? 'redPrice' : ''}">
£${product?.refund == 1 ? '-' : ''}${Number(product.total).toFixed(2)}
</td>

      </tr>
    `;
      })
      .join('');
    const miscellaneousHtml = miscellaneousItems
      ?.map(item => {
        return `
      <tr>

        <td class="product-name">
          ${item.title}


        </td>

        <td class="qty"></td>

        <td class="price"></td>

        <td class="total">£${Number(item.value).toFixed(2)}</td>

      </tr>
    `;
      })
      .join('');
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

    return `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8"/>

<style>

@page{
  margin:0;
}

html, body{
  width:145mm;
  margin:0;
  padding:0;
}

body{
  font-family: Arial, sans-serif;
  font-size:30px;
  color:#000;
  padding:0;
  line-height:1.3;
}

/* HEADER */

.order-id{
  font-size:50px;
  font-weight:600;
  margin-top:0;
  margin-bottom:2px;
}
.redPrice{
  color:red;
  font-weight:600;
}
.company-title{
  font-size:45px;
  font-weight:600;
}

.company-details{
  font-size:30px;
  margin-bottom:2px;
}

.bold-label{
  font-size:30px;
  margin-bottom:6px;
}

/* TABLE */

table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  
}

th{
  font-size:30px;
  text-align:left;
  padding:4px 2px;
  font-weight:600;
    overflow:hidden;

}

td{
  font-size:27px;
  padding:3px 2px;
  vertical-align:top;
  word-break:break-word;
    overflow:hidden;

}

/* COLUMN WIDTH */

.product-name{
  width:40%;


}

.qty{
  width:10%;
  text-align:center;

}

.price{
  width:22%;
  text-align:right;
  white-space: nowrap;
  
}

.total{
  width:22%;
  text-align:right;
  white-space: nowrap;

}



.product-sub{
  font-size:22px;
  width:100%;
}
.nowrap {
  white-space: nowrap;
}
/* SUMMARY */

.summary-row td{
 
  padding-top:4px;
}

.summary-label{
  text-align:right;
  font-weight:600;
}
.summary-label1{
  text-align:right;
   font-size:30px;

}
.summary-right{
  text-align:right;
  font-weight:500;
  white-space: nowrap;
}
.summary-right1{
  text-align:right;
  font-weight:700;
  white-space: nowrap;
}
/* PRINT FIX */

*{
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

</style>

</head>

<body>

<div class="order-id">
Order ID: ${a4PrintDetails?.order_id}
</div>

<div class="company-title">
Ron Currie & Sons Ltd
</div>

<div class="company-details">
  <span style="font-weight:600; margin-right:5px;">Tel:</span> ${
    a4PrintDetails?.settings?.config_telephone
  }, 
  
  <span style="font-weight:600;">VAT#</span>${
    a4PrintDetails?.settings?.config_vat_number
  }
</div>

<div class="bold-label">
  <span style="font-weight:600;">Date Added:</span> ${dateAdded}
</div>
${
  a4PrintDetails?.shipping_method !== 'Collection' &&
  a4PrintDetails?.epos_customer_name
    ? `<div class="bold-label">
        <span style="font-weight:600;">Customer Name:</span> ${a4PrintDetails.epos_customer_name}
      </div>`
    : ''
}
${
  a4PrintDetails?.shipping_method !== 'Collection' &&
  (a4PrintDetails?.shipping_company ||
    a4PrintDetails?.shipping_address_1 ||
    a4PrintDetails?.shipping_city)
    ? `<div class="bold-label">
        <span style="font-weight:600;">Address:</span> 
        ${[
          a4PrintDetails?.shipping_company,
          a4PrintDetails?.shipping_address_1,
          a4PrintDetails?.shipping_address_2,
          a4PrintDetails?.shipping_city,
          a4PrintDetails?.shipping_postcode,
          a4PrintDetails?.shipping_country,
          a4PrintDetails?.shipping_zone,
        ]
          .filter(item => item && item.trim())
          .join(', ')}
      </div>`
    : ''
}

${
  a4PrintDetails?.shipping_method !== 'Collection' &&
  a4PrintDetails?.epos_customer_number?.trim()
    ? `<div class="bold-label">
        <span style="font-weight:600;">Tel:</span> ${a4PrintDetails.epos_customer_number}
      </div>`
    : ''
}
  ${
    a4PrintDetails?.shipping_method != 'Collection'
      ? `<div class="bold-label">
  <span style="font-weight:600;">Est. Delivery Date:</span> ${a4PrintDetails?.order_date}
</div>`
      : ''
  }




<table>

<tr>
<th class="product-name">Product</th>
<th class="qty">Qty</th>
<th class="price">Price</th>
<th class="total">Total</th>
</tr>

${productsHtml}
${miscellaneousHtml}

<tr class="summary-row">
<td colspan="3" class="summary-label1">Groups =</td>
<td class="summary-right">
${a4PrintDetails?.products?.length || 0}
</td>
</tr>   

${
  shippingTitle !== 'Collection' ? (
    <tr>
      <td colspan="3" class="summary-label">
        ${shippingTitle}
      </td>
      <td class="summary-right">£${shippingAmount}</td>
    </tr>
  ) : (
    ''
  )
}

<tr>
<td colspan="3" class="summary-label1">
Total (VAT £${totalsMap.tax || '0.00'})
</td>
<td class="summary-right1">
£${totalsMap.total || '0.00'}
</td>
</tr>
${
  a4PrintDetails?.comment?.trim()
    ? `
<tr>
  <td  style="font-weight:600; text-align:left;">
    Notes
  </td>
  <td colspan="3" style="text-align:left;">
    ${a4PrintDetails.comment}
  </td>
</tr>
`
    : ''
}
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
        await printWithStarPassPRNT(html); // ✅ Star PassPRNT
        // await RNPrint.print({ html });
      } else {
        await RNPrint.print({ html }); // ✅ A4 print
      }

      onClose();
    } catch (error) {
      console.log('Print error:', error);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Print</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={moderateScale(20)} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.underline} />
          <Text style={styles.message}>Print order details</Text>

          <View style={{ marginTop: moderateScale(10) }}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedOption('A4')}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === 'A4' && styles.radioOuterActive,
                ]}
              >
                {selectedOption === 'A4' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Print customer copy A4</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedOption('80mm')}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedOption === '80mm' && styles.radioOuterActive,
                ]}
              >
                {selectedOption === '80mm' && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Print customer copy 80mm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.printBtn}
              // onPress={() => {
              //   handlePrint(selectedOption), onClose();
              // }}
              onPress={async () => {
                try {
                  await handlePrint(selectedOption); // wait for print to finish
                  onClose();
                } catch (error) {
                  console.log('Print error:', error);
                }
              }}
            >
              <Text style={styles.printText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: moderateScale(36), fontFamily: FONT.BOLD, color: '#000' },
  underline: {
    height: moderateScale(3),
    backgroundColor: '#a00',
    width: moderateScale(50),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(2),
  },
  message: {
    fontSize: moderateScale(14),
    fontFamily: FONT.REGULAR,
    color: '#777',
    marginBottom: moderateScale(10),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(5),
  },
  radioOuter: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  radioOuterActive: { borderColor: '#a00' },
  radioInner: {
    height: moderateScale(10),
    width: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#a00',
  },
  radioLabel: {
    fontSize: moderateScale(16),
    color: Color.BLACK2,
    fontFamily: FONT.MEDIUM,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: moderateScale(25),
  },
  cancelBtn: {
    backgroundColor: Color.BLACK3,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  cancelText: {
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
  printBtn: {
    backgroundColor: Color.RED,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(5),
  },
  printText: {
    color: '#fff',
    fontFamily: FONT.SEMIBOLD,
    fontSize: moderateScale(14),
  },
});

export default PrintModel;
