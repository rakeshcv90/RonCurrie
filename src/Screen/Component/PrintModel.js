import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Color, FONT } from '../../Component/Image';
import RNPrint from 'react-native-print';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearA4Products,
  fetchA4PrintDetails,
} from '../../Redux/Slice/A4PrintSlice';
import { useFocusEffect } from '@react-navigation/native';
import { showToast } from '../../utility/showToast';
import { fetch80MMPrintDetails } from '../../Redux/Slice/Print80mmSlice';

const PrintModel = ({ visible, onClose, printData }) => {
  const dispatch = useDispatch();
  const { a4PrintDetails, loading, error } = useSelector(
    state => state.a4PrintData,
  );

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
      .content-table td:first-child {
        border-right: 1px solid #e6e6e6;
      }
      a {
        color: #000;
        text-decoration: none;
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
      .section1 {
        margin-top: 20px;
        border: 1px solid #e6e6e6;
        border-radius: 4px;
      }

.section1-header {

  border-bottom: 1px solid #e6e6e6;
  padding: 8px 10px;
}

.section1-header h3 {
  margin: 0;
  font-size: 14px;
}
.address-row {
  display: flex;
  justify-content: space-between;
  padding: 0; /* remove default spacing */
  margin: 0;

}
  .address-row1 {
  display: flex;

  font-weight: bold;
  border-bottom: 1px solid #e6e6e6;
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

.address-column1 {
  width: 50%;
  font-size: 13px;
  padding: 8px 10px;
  box-sizing: border-box;
}

.left-column {
  border-right: 1px solid #e6e6e6; 
}

.address-column h4 {
  margin-top: 0;
  font-size: 13.5px;
  font-weight: bold;
  margin-bottom: 5px;
  text-decoration: underline;
    
}.address-column p {
  margin: 0;
  padding: 5px 0;
}.bold-black {
  font-weight: bold;
  color: black;
   font-family: Arial, sans-serif;
}@media print {
  html, body {
    width: 210mm;   /* A4 width */
    height: auto;   /* allow content to expand */
  }
  .section {
    page-break-inside: avoid;  /* don't split sections */
  }
  .page-break {
    display: block;
    page-break-before: always; /* force new page */
    break-before: always;
  }
}
</style>
  </head>
  <body>
    <h1>Invoice #${a4PrintDetails?.order_id}</h1>

    <!-- ORDER DETAILS -->
    <div class="section">
      <div class="section-title">Order Details</div>
      <table class="content-table">
        <tr>
          <td width="50%">
            <b>${a4PrintDetails?.settings?.config_name}</b><br/>
        ${a4PrintDetails?.settings?.config_address
          ?.trim()
          ?.replace(/\\r\\n/g, '<br/>')
          ?.replace(/,\s*/g, '<br/>')
          ?.replace(/(<br\/>)+/g, '<br/>')} <br/>
            <b>Telephone:</b> ${a4PrintDetails?.settings?.config_telephone}<br/>
            <b>Email:</b> <a href="mailto:${
              a4PrintDetails?.settings?.config_email
            }">${a4PrintDetails?.settings?.config_email}</a><br/>
            <b>Web Site:</b> <a href="${
              a4PrintDetails?.store_url
            }" target="_blank">${a4PrintDetails?.store_url}</a>
          </td>
          <td width="50%">
            <b>Date Added:</b> ${a4PrintDetails?.order_date}<br/>
            <b>Order ID:</b> ${a4PrintDetails?.order_id}<br/>
            <b>Payment Method:</b> ${a4PrintDetails?.payment_method}<br/>
            <b>Delivery Method:</b> ${a4PrintDetails?.shipping_method}
          </td>
        </tr>
      </table>
    </div>
    <div class="section1">
       <div class="address-row1">
       <div class="address-column1">
         <div>Payment Address</div>
          </div>
        <div class="address-column1">
         <div>Delivery Address</div>
          </div>
  </div>
  <div class="address-row">
    <div class="address-column left-column">
      <p>${a4PrintDetails?.shipping_firstname}${
      a4PrintDetails?.shipping_firstname
    }<br/>
            ${a4PrintDetails?.payment_company}<br/><br/>
            ${a4PrintDetails?.payment_address_1}<br/>
            ${a4PrintDetails?.payment_address_2}<br/>
            ${a4PrintDetails?.payment_city}<br/>
            ${a4PrintDetails?.payment_postcode}<br/>
            ${a4PrintDetails?.payment_country}<br/>
            ${a4PrintDetails?.payment_zone}<br/>
            ${a4PrintDetails?.payment_zone_id}
      </p>
    </div>
    <div class="address-column right-column">
        <p>${a4PrintDetails?.shipping_firstname}${
      a4PrintDetails?.shipping_firstname
    }<br/>
            ${a4PrintDetails?.shipping_company}<br/>
            ${a4PrintDetails?.shipping_address_1}<br/>
            ${a4PrintDetails?.shipping_address_2}<br/>
            ${a4PrintDetails?.shipping_city}<br/>
            ${a4PrintDetails?.shipping_postcode}<br/>
            ${a4PrintDetails?.shipping_country}<br/>
            ${a4PrintDetails?.shipping_zone}<br/>
            ${a4PrintDetails?.shipping_zone_id}
     
      </p>
    </div>
  </div>
</div>
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
              ${item?.name}<br/>
           ${
             item?.options
               ? `<span class="product-sub">- ${item.options.name}: ${item.options.value}</span>`
               : ''
           }
            </td>
            <td>${item?.model}</td>
            <td>${item?.quantity}</td>
            <td>£${item?.price}</td>
            <td>£${item?.total}</td>
          </tr>${
            (index + 1) % 20 === 0 ? '<div class="page-break"></div>' : ''
          }`,
          )
          .join('')}
         
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
<div class="section">
  <table class="totals">
    ${a4PrintDetails?.totals
      .map(
        item => `
        <tr>
          <td class="right bold-black">${item.title}</td>
          <td class="right">£${item.value}</td>
        </tr>
      `,
      )
      .join('')}
  </table>
</div>
  </body>
  </html>
  `;
  };

  const generate80mmInvoice = async () => {
    const totalsMap = {};
    a4PrintDetails?.totals?.forEach(item => {
      totalsMap[item.code] = parseFloat(item.value).toFixed(2);
    });

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
        color: #000;
        width: 70mm;
        margin-left: 10px;
        padding: 0;
        height: auto;
      }
      .order-id {
        font-size: 10px;
        margin-bottom: 2px;
        margin-top: 10px;
      }
      .company-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0;
        margin-top: 2px;
        line-height: 1.1;
        letter-spacing: .5px;
      }
      .company-title .red {
        color: #b22222;
      }
      .company-title .black {
        color: #000;
      }
      .company-details {
        font-size: 10px;
        margin-bottom:1px;
      }
      .bold-label {
        font-weight: bold;
        margin-top: 2px;
        margin-bottom: 7px;
        font-size: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        margin-bottom: 5px;
        box-sizing: border-box;
      }
      th, td {
        border: 1px solid #e6e6e6;
        padding: 7px 6px;
        font-size: 10px;
        vertical-align: top;
        text-align: left;
      }
      th {
        background: #fff;
        font-size: 10px;
        font-weight: bold;
        text-align: left;
      }
      .product-desc {

        font-size: 10px;
        font-weight: normal;
      }
      .qty, .price, .total {
        text-align: center;
        font-size: 12px;
      }
      .center-row td {
        text-align: center;
        border: none;
        font-weight: bold;
        font-size: 12px;
        padding:10px 0;
        background:transparent;
      }
      .summary-row td {
        font-weight: bold;
        font-size: 12px;
        text-align: right;
        border: 1px solid #e6e6e6;
        background:transparent;
      }
      .bold-summary {
        font-size: 12px;
        font-weight: bold;
        background:transparent;
      }
      .bold-vat {
        font-size: 12px;
        font-weight: bold;
        background:transparent;
      }

  }

    </style>
  </head>
  <body>
    <div class="order-id">Order Id: ${a4PrintDetails?.order_id}</div>
    <div class="company-title">
      <span class="red">Ron Currie & Sons</span> <span class="black">Ltd</span>
    </div>
    <div class="company-details">
      Tel:${a4PrintDetails?.settings?.config_telephone},<br>VAT:1183885755
    </div>
    <div class="bold-label">Date Added: ${a4PrintDetails?.order_date}</div>
    <table>
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
          ${a4PrintDetails?.products
            ?.map(
              (product,index) => `
             <tr>
             <td class="product-desc">${product?.name}  ${
             product?.options
               ? `<span class="product-sub">- ${product.options.name}: ${product.options.value}</span>`
               : ''
           }</td>
             <td class="qty"> ${product?.quantity}</td>
             <td class="price">£${product?.price}</</td>
             <td class="total">£${product?.total}</</td>
            </tr>`,
            )
            .join('')}

      <tr class="summary-row"">
        <td colspan="3">Groups =</td>
        <td colspan="2" style="text-align: left;">${a4PrintDetails?.products.length}</td>
      </tr>
      <tr class="summary-row">
        <td colspan="3" class="bold-summary">Inc VAT Sub-Total</td>
         <td>£${totalsMap['sub_total'] || '0.00'}</td>
      </tr>
      <tr class="summary-row">
        <td colspan="3" class="bold-vat">Total (VAT = ££${
          totalsMap['tax'] || '0.00'
        })</td>
        <td>£${totalsMap['total'] || '0.00'}</td>
      </tr>
    </table>
  </body>
  </html>
    `;
  };
  
  
//   const generate80mmInvoice = async () => {
//   const totalsMap = {};
//   a4PrintDetails?.totals?.forEach(item => {
//     totalsMap[item.code] = parseFloat(item.value).toFixed(2);
//   });

//   return `
//   <!DOCTYPE html>
//   <html>
//   <head>
//     <meta charset="UTF-8" />
//     <style>
//       body {
//         font-family: 'Arial', sans-serif;
//         width: 80mm;
//         font-size: 13px;
//         color: #000;
//         margin: 0;
//         padding: 0 5px;
//       }

//       .order-id {
//         font-size: 14px;
//         font-weight: bold;
//         margin-bottom: 4px;
//         text-align: left;
//       }

//       .company-title {
//         font-size: 16px;
//         font-weight: bold;
//         text-align: left;
//         margin-bottom: 2px;
//       }

//       .company-details {
//         font-size: 13px;
//         text-align: left;
//         margin-bottom: 8px;
//       }

//       .bold-label {
//         font-weight: bold;
//         margin: 5px 0;
//         font-size: 13px;
//       }

//       table {
//         width: 100%;
//         border-collapse: collapse;
//         font-size: 13px;
//       }

//       th, td {
//         padding: 4px 2px;
//         text-align: left;
//       }

//       th {
//         border-bottom: 1px solid #000;
//         font-weight: bold;
//       }

//       .qty, .price, .total {
//         text-align: right;
//       }

//       .summary-row td {
//         font-weight: bold;
//         border-top: 1px solid #000;
//         padding-top: 6px;
//         font-size: 13px;
//       }

//       .footer-text {
//         margin-top: 8px;
//         text-align: left;
//         font-size: 12px;
//       }
//     </style>
//   </head>

//   <body>
//     <div class="order-id">Order Id: ${a4PrintDetails?.order_id}</div>
//     <div class="company-title">Ron Currie & Sons Ltd</div>
//     <div class="company-details">
//       Tel: ${a4PrintDetails?.settings?.config_telephone}<br/>
//       VAT: 1183885755
//     </div>
//     <div class="bold-label">Date Added: ${a4PrintDetails?.order_date}</div>

//     <table>
//       <tr>
//         <th>Product</th>
//         <th>Qty</th>
//         <th>Price</th>
//         <th>Total</th>
//       </tr>

//       ${a4PrintDetails?.products
//         ?.map(
//           (product, index) => `
//             <tr>
//               <td>${product?.name}${product?.options ? `<br><small>${product.options.name}: ${product.options.value}</small>` : ''}</td>
//               <td class="qty">${product?.quantity}</td>
//               <td class="price">£${product?.price}</td>
//               <td class="total">£${product?.total}</td>
//             </tr>
//           `
//         )
//         .join('')}

//       <tr class="summary-row">
//         <td colspan="3">Groups =</td>
//         <td>${a4PrintDetails?.products.length}</td>
//       </tr>
//       <tr class="summary-row">
//         <td colspan="3">Inc VAT Sub-Total</td>
//         <td>£${totalsMap['sub_total'] || '0.00'}</td>
//       </tr>
//       <tr class="summary-row">
//         <td colspan="3">Total (VAT = £${totalsMap['tax'] || '0.00'})</td>
//         <td>£${totalsMap['total'] || '0.00'}</td>
//       </tr>
//     </table>

//     <div class="footer-text">
//       Thank you for your purchase!
//     </div>
//   </body>
//   </html>
//   `;
// };

  
  const handlePrint = async format => {
    if (format == '80mm') {
      try {
        const html = await generate80mmInvoice();
        await RNPrint.print({ html });
      } catch (error) {
        console.log('Print error:', error);
      }
    } else {
      try {
        const html = await generatePDF(); // await here
        await RNPrint.print({ html });
      } catch (error) {
        console.log('Print error:', error);
      }
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
