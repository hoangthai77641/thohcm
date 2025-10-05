import React, { useState, useEffect } from 'react';

const MapComponent = ({ onLocationSelect, defaultLocation }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    // Load Google Maps Script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const initMap = () => {
    const center = defaultLocation || { lat: 10.7769, lng: 106.7009 }; // TP.HCM center
    
    const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: center,
      styles: [
        // Custom styling for professional look
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add click listener
    mapInstance.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Update marker
      if (marker) {
        marker.setPosition({ lat, lng });
      } else {
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          draggable: true
        });
        setMarker(newMarker);
        
        // Add drag listener
        newMarker.addListener('dragend', () => {
          const pos = newMarker.getPosition();
          reverseGeocode(pos.lat(), pos.lng());
        });
      }
      
      reverseGeocode(lat, lng);
    });

    // Places Autocomplete
    const input = document.getElementById('location-input');
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'VN' },
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(10.3, 106.3), // SW corner of HCM
        new window.google.maps.LatLng(11.2, 107.1)  // NE corner of HCM
      )
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        mapInstance.setCenter({ lat, lng });
        
        if (marker) {
          marker.setPosition({ lat, lng });
        } else {
          const newMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance
          });
          setMarker(newMarker);
        }
        
        parseAddress(place, lat, lng);
      }
    });

    setMap(mapInstance);
  };

  const reverseGeocode = (lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        parseAddress(results[0], lat, lng);
      }
    });
  };

  const parseAddress = (place, lat, lng) => {
    const addressComponents = place.address_components || [];
    let district = '';
    let ward = '';
    let fullAddress = place.formatted_address || '';

    addressComponents.forEach(component => {
      const types = component.types;
      if (types.includes('administrative_area_level_2')) {
        district = component.long_name;
      }
      if (types.includes('administrative_area_level_3') || types.includes('sublocality_level_1')) {
        ward = component.long_name;
      }
    });

    // Notify parent component
    if (onLocationSelect) {
      onLocationSelect({
        coordinates: [lng, lat],
        district,
        ward,
        fullAddress,
        placeId: place.place_id
      });
    }
  };

  return (
    <div className="map-container">
      <input 
        id="location-input" 
        type="text" 
        placeholder="Tìm địa chỉ hoặc click trên bản đồ..."
        className="location-search-input"
      />
      <div id="map" style={{ height: '300px', width: '100%', borderRadius: '8px' }}></div>
    </div>
  );
};

export default MapComponent;