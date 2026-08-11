import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

const STORE_CENTER = {
  latitude: 53.12001,
  longitude: -1.23972,
};

const AddressMapPin = ({
  addressQuery,
  initialLat,
  initialLng,
  onConfirm,
  onPinMoved,
}) => {
  const GOOGLE_KEY = 'AIzaSyBe9eGx0SfahnDahbBDTLnT8t387uyWI9U';

  Geocoder.init(GOOGLE_KEY);
  const [region, setRegion] = useState(
    initialLat && initialLng
      ? {
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }
      : null,
  );

  const [pinPosition, setPinPosition] = useState(
    initialLat && initialLng
      ? {
          latitude: initialLat,
          longitude: initialLng,
        }
      : null,
  );

  const [confirmed, setConfirmed] = useState(!!initialLat);

  const [loading, setLoading] = useState(false);

  const [mapType, setMapType] = useState('satellite');

  useEffect(() => {
    if (addressQuery) {
      getCoordinates(addressQuery);
    } else if (!initialLat || !initialLng) {
      getCurrentLocation();
    }
  }, [addressQuery]);

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setPinPosition({ latitude, longitude });
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
          });
        },
        error => {
          console.log('Geolocation error', error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } catch (err) {
      console.warn(err);
    }
  };

  const getCoordinates = async address => {
    try {
      setLoading(true);

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${GOOGLE_KEY}`;

      const response = await fetch(url);

      const data = await response.json();

      console.log('Geocoding API Full Response:', data);

      if (data.results && data.results.length > 0) {
        console.log('Xccxcxcccccccccc', data.results[0].geometry.location);
        const location = data.results[0].geometry.location;

        const coords = {
          latitude: location.lat,

          longitude: location.lng,
        };

        setPinPosition(coords);

        setRegion({
          ...coords,

          latitudeDelta: 0.001,

          longitudeDelta: 0.001,
        });

        setConfirmed(false);
      } else {
        console.log('Address not found');
      }
    } catch (error) {
      console.log('Geocode Error', error);
    } finally {
      setLoading(false);
    }
  };

  const markerMoved = event => {
    const coords = event.nativeEvent.coordinate;

    setPinPosition(coords);

    setConfirmed(false);

    if (onPinMoved) {
      onPinMoved(coords);
    }
  };

  const confirmLocation = () => {
    if (!pinPosition) return;

    setConfirmed(true);

    onConfirm?.({
      lat: pinPosition.latitude,

      lng: pinPosition.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Pin Location *</Text>

      <Text style={styles.helper}>Drag the pin to exact delivery location</Text>

      {loading && <ActivityIndicator />}

      {region && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            mapType={mapType}
            zoomControlEnabled={true}
            onRegionChangeComplete={newRegion => {
              if (!pinPosition) return;

              const latDiff = Math.abs(
                newRegion.latitude - pinPosition.latitude,
              );
              const lngDiff = Math.abs(
                newRegion.longitude - pinPosition.longitude,
              );

              if (latDiff < 0.00001 && lngDiff < 0.00001) {
                return; // Ignore tiny micro-jitters from layout updates
              }

              const coords = {
                latitude: newRegion.latitude,
                longitude: newRegion.longitude,
              };
              setPinPosition(coords);
              setRegion(newRegion);
              setConfirmed(false);
              if (onPinMoved) {
                onPinMoved(coords);
              }
            }}
          ></MapView>

          {/* Fixed Center Pin (Uber Style) */}
          <View style={styles.fixedPinContainer} pointerEvents="none">
            <Text style={styles.fixedPin}>📍</Text>
          </View>

          <View style={styles.mapTypeToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mapType === 'standard' && styles.toggleButtonActive,
                { borderRightWidth: 1, borderColor: '#eee' },
              ]}
              onPress={() => setMapType('standard')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mapType === 'standard' && styles.toggleTextActive,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mapType === 'satellite' && styles.toggleButtonActive,
              ]}
              onPress={() => setMapType('satellite')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mapType === 'satellite' && styles.toggleTextActive,
                ]}
              >
                Satellite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.bottom}>
        <Text
          style={{
            color: confirmed ? '#28a745' : '#666',
            fontWeight: confirmed ? 'bold' : 'normal',
          }}
        >
          {confirmed ? '✅ Location confirmed' : 'Location not confirmed'}
        </Text>

        <TouchableOpacity
          disabled={!pinPosition || confirmed}
          style={[
            styles.button,
            (!pinPosition || confirmed) && styles.disabled,
          ]}
          onPress={confirmLocation}
        >
          <Text style={styles.buttonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  helper: {
    marginVertical: 8,
    color: '#666',
  },

  mapContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  mapTypeToggle: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },

  toggleButtonActive: {
    backgroundColor: '#e6e6e6',
  },

  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  toggleTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },

  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },

  disabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#fff',
  },

  fixedPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15, // Half of typical emoji width
    marginTop: -35, // Adjust up so the bottom point of the emoji hits the center
    zIndex: 10,
  },

  fixedPin: {
    fontSize: 30,
  },
});

export default AddressMapPin;
