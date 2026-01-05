import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { useEffect } from 'react';
import { moderateScale } from 'react-native-size-matters';
import { Color, FONT } from '../Component/Image';
import { useDispatch, useSelector } from 'react-redux';
import { fetchA4PrintDetails } from '../Redux/Slice/A4PrintSlice';
import Ionicons from '@react-native-vector-icons/ionicons';


const DownloadPdf = ({ visible, onClose, printData }) => {
  const dispatch = useDispatch();
  const { a4PrintDetails, loading, error } = useSelector(
    state => state.a4PrintData,
  );

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
    const p = a4PrintDetails; // short reference

    // Check if payment address exists
    const hasPaymentAddress =
      p?.payment_firstname ||
      p?.payment_address_1 ||
      p?.payment_city ||
      p?.payment_postcode;

    // Check if delivery address exists
    const hasShippingAddress =
      p?.shipping_firstname ||
      p?.shipping_address_1 ||
      p?.shipping_city ||
      p?.shipping_postcode;

    // Build Payment address block
    const paymentHTML = hasPaymentAddress
      ? `
      <div class="address-column left-column">
        <p>
          ${p?.payment_firstname || ''} ${p?.payment_lastname || ''}<br/>
          ${p?.payment_company || ''}<br/>
          ${p?.payment_address_1 || ''}<br/>
          ${p?.payment_address_2 || ''}<br/>
          ${p?.payment_city || ''}<br/>
          ${p?.payment_postcode || ''}<br/>
          ${p?.payment_country || ''}<br/>
          ${p?.payment_zone || ''}
        </p>
      </div>`
      : '';

    // Build Delivery address block
    const shippingHTML = hasShippingAddress
      ? `
      <div class="address-column right-column">
        <p>
          ${p?.shipping_firstname || ''} ${p?.shipping_lastname || ''}<br/>
          ${p?.shipping_company || ''}<br/>
          ${p?.shipping_address_1 || ''}<br/>
          ${p?.shipping_address_2 || ''}<br/>
          ${p?.shipping_city || ''}<br/>
          ${p?.shipping_postcode || ''}<br/>
          ${p?.shipping_country || ''}<br/>
          ${p?.shipping_zone || ''}
        </p>
      </div>`
      : '';

    // Show section only if ANY address exists
    const addressSection =
      hasPaymentAddress || hasShippingAddress
        ? `
      <div class="section1">
        <div class="address-row1">
          ${
            hasPaymentAddress
              ? `<div class="address-column1">Payment Address</div>`
              : ''
          }
          ${
            hasShippingAddress
              ? `<div class="address-column1">Delivery Address</div>`
              : ''
          }
        </div>
        <div class="address-row">
          ${paymentHTML}
          ${shippingHTML}
        </div>
      </div>`
        : '';

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial; font-size: 14px; padding: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e6e6e6; padding: 8px; }
      .section { border: 1px solid #e6e6e6; margin-top: 20px; }
      .section-title { padding: 8px; font-weight: bold; border-bottom: 1px solid #e6e6e6; }
      .product-sub { font-size: 10px; color: #555; }
      .right { text-align: right; }
      .bold-black { font-weight: bold; color: black; }
      .section1 { margin-top: 20px; border: 1px solid #e6e6e6; border-radius: 4px; }
      .address-row { display: flex; }
      .address-column { width: 50%; padding: 10px; }
      .left-column { border-right: 1px solid #e6e6e6; }
      @media print {
        html, body { width: 210mm; height: auto; }
        .page-break { page-break-before: always; }
      }
    </style>
  </head>
  <body>
    <h1>Invoice #${p?.order_id}</h1>

    <!-- ORDER DETAILS -->
    <div class="section">
      <div class="section-title">Order Details</div>
      <table>
        <tr>
          <td width="50%">
            <b>${p?.settings?.config_name}</b><br/>
            ${(p?.settings?.config_address || '')
              .trim()
              .replace(/\r\n/g, '<br/>')
              .replace(/,\s*/g, '<br/>')
              .replace(/(<br\/>)+/g, '<br/>')}<br/>
            <b>Telephone:</b> ${p?.settings?.config_telephone}<br/>
            <b>Email:</b> ${p?.settings?.config_email}<br/>
            <b>Website:</b> ${p?.store_url}
          </td>

          <td width="50%">
            <b>Date Added:</b> ${p?.order_date}<br/>
            <b>Order ID:</b> ${p?.order_id}<br/>
            <b>Payment Method:</b> ${p?.payment_method}<br/>
            <b>Delivery Method:</b> ${p?.shipping_method}
          </td>
        </tr>
      </table>
    </div>

    ${addressSection}

    <!-- PRODUCT TABLE -->
    <div class="section">
      <table>
        <thead>
          <tr>
            <th>No. of Products</th>
            <th>Model</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
        ${p?.products
          .map(
            (item, index) => `
              <tr>
                <td>${item?.name}
                  ${
                    item?.options
                      ? `<div class="product-sub">- ${item.options.name}: ${item.options.value}</div>`
                      : ''
                  }
                </td>
                <td>${item?.model}</td>
                <td>${item?.quantity}</td>
                <td>£${Number(item?.price).toFixed(2)}</td>
                <td>£${Number(item?.total).toFixed(2)}</td>
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
        ${p?.totals
          .map(
            item => `
            <tr>
              <td class="right bold-black">${item.title}</td>
              <td class="right">£${Number(item?.value).toFixed(2)}</td>
            </tr>`,
          )
          .join('')}
      </table>
    </div>

  </body>
  </html>`;
  };

const savePDF = async () => {

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

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={async () => {
                savePDF();
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

export default DownloadPdf;
