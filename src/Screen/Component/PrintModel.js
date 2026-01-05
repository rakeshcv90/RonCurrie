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
  console.log('a4PrintDetails', a4PrintDetails);
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
              `
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
