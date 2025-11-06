import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { scale } from 'react-native-size-matters';
import { ImageBaseUrl } from '../../utility/api';
import RenderHTML from 'react-native-render-html';
import { decode } from 'html-entities';
import { FONT } from '../../Component/Image';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

const ProductModal = ({ visible, onClose, product }) => {
  const { width } = useWindowDimensions();

  const decodedHtml = decode(product?.descriptions?.description);

  const tagsStyles = {
    h3: { fontSize: 18, fontWeight: FONT.EXTRABOLD, marginBottom: 8 },
    ul: { marginVertical: 8, paddingLeft: 20 },
    li: { fontSize: 14, marginBottom: 6, lineHeight: 20 },
    p: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.bottomSheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>

          <FlatList
            data={product?.images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <FastImage
                style={styles.productImage}
                source={{
                  // uri: ImageBaseUrl + item.image,
                  uri: `${ImageBaseUrl}${item?.image}?w=150&h=150`,
                priority: FastImage.priority.high,

                  cache: FastImage.cacheControl.immutable,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            )}
          />

          <Text style={styles.title}>{product?.isbn}</Text>
          <Text style={styles.model}>Model: {product?.model}</Text>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Specification:</Text>

            <RenderHTML
              contentWidth={width}
              source={{ html: decodedHtml }}
              tagsStyles={tagsStyles}
              renderersProps={{
                ul: { enableExperimentalRenders: true },
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: '85%',
    padding: scale(16),
  },
  closeBtn: {
    alignSelf: 'flex-end',
  },
  closeBtnText: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  productImage: {
    width: scale(width * 0.4),
    height: scale(100),
    marginRight: scale(10),
    borderRadius: scale(8),
    resizeMode: 'contain',
    marginBottom: scale(50),
  },
  title: {
    fontSize: scale(18),
    fontWeight: '700',
    color: 'maroon',
    marginTop: scale(10),
  },
  model: {
    fontSize: scale(14),
    color: '#444',
    marginVertical: scale(5),
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: scale(16),
    marginVertical: scale(10),
  },
  description: {
    fontSize: scale(14),
    color: '#333',
    lineHeight: scale(22),
  },
  scrollContainer: {
    marginTop: scale(10),
  },
});

export default ProductModal;
