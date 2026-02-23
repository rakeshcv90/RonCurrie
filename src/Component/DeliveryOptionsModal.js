import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import Ionicons from '@react-native-vector-icons/ionicons';
import { postData } from '../utility/ApiCall';
import { Api } from '../utility/api';
import Loader from './Loader';
import { Color, FONT } from './Image';

const DeliveryOptionsModal = ({
  visible,
  onClose,
  onApply,
  cartData,
  addressData,
  areaPin,
}) => {
  const [selected, setSelected] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [listData, setListData] = useState([]);
  const [loader, setLoader] = useState(true);
  const [openDrop, setOpenDrop] = useState(null);

  const [selectedName, setSelectedName] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    if (visible) {
      deliverOption();
    }
  }, [visible]);

  const deliverOption = async () => {
    setLoader(true);
    const parts = addressData?.originalAddress
      .split(',')
      .map(item => item.trim());

    let addressObj = {};

    if (parts?.length === 2) {
      addressObj = {
        address1: parts[0],
        city: parts[1],
      };
    } else if (parts?.length === 3) {
      addressObj = {
        company: parts[0],
        address1: parts[1],
        city: parts[2],
      };
    } else if (parts?.length === 4) {
      addressObj = {
        company: parts[0],
        address1: parts[1],
        address2: parts[2],
        city: parts[3],
      };
    }

    try {
      const payloadData = {
        shipping_type: 'delivery',
        country_id: addressData?.country_id,
        zone_id: addressData?.zone_id,
        company: addressObj.company || '',
        address_1: addressObj.address1 || '',
        address_2: addressObj.address2 || '',
        city: addressObj.city || '',
        postcode: areaPin,

        // cart_data: cartData?.map(item => ({

        //   product_id: item?.product_id,
        //   option: {
        //     [item?.product_option_id ?? 0]:
        //       item.product_option_value_id &&
        //       item.product_option_value_id !== ''
        //         ? item.product_option_value_id
        //         : '0',
        //   },
        //   quantity: item?.cart_quantity,
        // })),

        cart_data: cartData?.map(item => {
          let optionObj = {};

          if (item?.additional_option) {
            try {
              const parsedOption = JSON.parse(item.additional_option);
              const [key, value] = Object.entries(parsedOption)[0];

              optionObj = {
                [key]: value,
              };
            } catch (err) {
              optionObj = {};
            }
          }
          // Else fallback to normal option logic
          else if (item?.product_option_id) {
            optionObj = {
              [item.product_option_id]:
                item.product_option_value_id &&
                item.product_option_value_id !== ''
                  ? item.product_option_value_id
                  : '0',
            };
          }

          return {
            product_id: item?.product_id,
            option: optionObj, // blank {} if no option
            quantity: item?.cart_quantity,
          };
        }),
      };

      const response = await postData(Api.GET_SHIPPING, payloadData);

      if (response?.status === 200) {
        const shippingList = response.data?.data?.ocaaspro?.quote ?? [];
        setListData(shippingList);

        if (shippingList.length > 0 && shippingList.length == 1) {
          const first = shippingList[0];

          setSelected(first.detail_id);

          // SAVE NAME & PRICE
          setSelectedName(first.title);
          setSelectedPrice(first.text);

          const estimate = first?.delivery_dates?.delivery_estimate;

          if (Array.isArray(estimate)) {
            setSelectedDates({
              [first.detail_id]: estimate[0],
            });
          } else if (typeof estimate === 'string') {
            setSelectedDates({
              [first.detail_id]: estimate?.estimate,
            });
          } else if (typeof estimate === 'object' && estimate !== null) {
            const firstValue = Object.values(estimate)[0];
            setSelectedDates({ [first.detail_id]: firstValue });
          }
        } else {
          const first = shippingList[1];

          setSelected(first.detail_id);

          // SAVE NAME & PRICE
          setSelectedName(first.title);
          setSelectedPrice(first.text);

          const estimate = first?.delivery_dates?.delivery_estimate;

          if (Array.isArray(estimate)) {
            setSelectedDates({
              [first.detail_id]: estimate[0],
            });
          } else if (typeof estimate === 'string') {
            setSelectedDates({
              [first.detail_id]: estimate?.estimate,
            });
          } else if (typeof estimate === 'object' && estimate !== null) {
            const firstValue = Object.values(estimate)[0];
            setSelectedDates({ [first.detail_id]: firstValue });
          }
        }
      }
    } catch (e) {
      console.log('Delivery Option Error:', e);
    } finally {
      setLoader(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback>
        <View style={styles.overlay}>
          <View style={styles.bottomModal}>
            {loader ? (
              <Loader visible={loader} />
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* <Text style={styles.title}>Delivery Options</Text> */}

                <View style={styles.headerRow}>
                  <Text style={styles.title}>Delivery Options</Text>

                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#b20000" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>
                  Please select the preferred delivery method
                </Text>
                {listData?.length > 0 ? (
                  <>
                    {listData.map((item, idx) => {
                      const estimate = item?.delivery_dates?.delivery_estimate;

                      return (
                        <View key={idx}>
                          <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => {
                              setSelected(item.detail_id);

                              // SAVE NAME & PRICE
                              setSelectedName(item.title);
                              setSelectedPrice(item.text);

                              if (Array.isArray(estimate)) {
                                setSelectedDates(prev => ({
                                  ...prev,
                                  [item.detail_id]: estimate[0],
                                }));
                              } else {
                                setSelectedDates(prev => ({
                                  ...prev,
                                  [item.detail_id]: estimate?.estimate,
                                }));
                              }
                            }}
                          >
                            <Ionicons
                              name={
                                selected === item.detail_id
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={20}
                              color="#b20000"
                            />
                            <Text style={styles.optionText}>
                              {item.title} - {item.text}
                            </Text>
                          </TouchableOpacity>

                          {/* IF ESTIMATE ARRAY → SHOW DROPDOWN */}
                          {Array.isArray(estimate) && (
                            <>
                              <Text style={styles.label}>
                                Select Preferred Date
                              </Text>

                              <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() =>
                                  setOpenDrop(openDrop === idx ? null : idx)
                                }
                              >
                                <Text style={styles.dropdownText}>
                                  {selectedDates[item.detail_id] ||
                                    'Select date'}
                                </Text>
                                <Ionicons name="chevron-down" size={18} />
                              </TouchableOpacity>

                              {openDrop === idx && (
                                <View style={styles.dateList}>
                                  {estimate.map((dt, i) => (
                                    <TouchableOpacity
                                      key={i}
                                      style={styles.dateItem}
                                      onPress={() => {
                                        setSelectedDates(prev => ({
                                          ...prev,
                                          [item.detail_id]: dt,
                                        }));
                                        setOpenDrop(null);
                                      }}
                                    >
                                      <Text style={styles.dateText}>{dt}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </>
                          )}

                          {typeof estimate === 'object' &&
                            !Array.isArray(estimate) && (
                              <View>
                                <Text style={styles.label}>
                                  Estimated Delivery:
                                </Text>

                                {Object.entries(estimate).map(
                                  ([key, value]) => (
                                    <Text key={key} style={styles.estimate}>
                                      {value}
                                    </Text>
                                  ),
                                )}
                              </View>
                            )}

                          <View style={styles.divider} />
                        </View>
                      );
                    })}

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onClose}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() =>
                          onApply({
                            id: selected,
                            date: selectedDates[selected],
                            name: selectedName,
                            price: selectedPrice,
                          })
                        }
                      >
                        <Text style={styles.applyText}>Apply To Order</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.subtitle,
                        {
                          fontSize: 18,
                          color: Color.RED,
                          fontFamily: FONT.BOLD,
                          textAlign: 'center',
                        },
                      ]}
                    >
                      No Delivery options are available
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)', // FIXED
  },

  bottomModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: '20@ms',
    borderTopRightRadius: '20@ms',
    paddingHorizontal: '15@ms',
    paddingTop: '10@ms',
    maxHeight: '80%', // 🔥 Scroll only if height > 80%
    width: '100%',
  },
  title: {
    fontSize: '20@ms',
    fontWeight: '700',
    color: '#b20000',
    marginBottom: '5@ms',
  },

  subtitle: {
    fontSize: '13@ms',
    color: '#555',
    marginBottom: '15@ms',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '10@ms',
  },

  optionText: {
    fontSize: '15@ms',
    marginLeft: '10@ms',
    color: '#222',
    fontWeight: '600',
    flex: 1,
  },

  label: {
    fontSize: '16@ms',
    color: '#888888',
    fontFamily: FONT.BOLD,
    marginBottom: '5@ms',
  },

  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '6@ms',
    padding: '10@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6@ms',
  },

  dropdownText: {
    fontSize: '14@ms',
    color: '#777',
  },

  link: {
    color: '#b20000',
    fontSize: '12@ms',
    marginBottom: '5@ms',
  },

  info: {
    fontSize: '11@ms',
    color: '#444',
    marginBottom: '15@ms',
  },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: '10@ms',
  },

  estimateLabel: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#444',
  },

  estimate: {
    fontSize: '16@ms',
    color: '#888888',
    fontFamily: FONT.REGULAR,
    marginBottom: '5@ms',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '15@ms',
  },

  cancelBtn: {
    backgroundColor: '#888888',
    padding: '12@ms',
    borderRadius: '6@ms',
    width: '45%',
    alignItems: 'center',
  },

  cancelText: {
    fontSize: '14@ms',
    color: '#fff',
    fontWeight: '700',
  },

  applyBtn: {
    backgroundColor: '#cc0000',
    padding: '12@ms',
    borderRadius: '6@ms',
    width: '45%',
    alignItems: 'center',
  },

  applyText: {
    fontSize: '14@ms',
    color: '#fff',
    fontWeight: '700',
  },
  dateList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },

  dateItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dateText: {
    fontSize: 14,
    color: '#222',
  },
  headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '5@ms',
},

closeBtn: {
  padding: 5,
},
});

export default DeliveryOptionsModal;
