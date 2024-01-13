import React, { memo } from "react";
import { MapContainer, useMapEvents, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LeafletMouseEvent } from "leaflet";

function MyComponent({ onLocationFound }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onLocationFound(e.latlng);
    },
  });
  return null;
}

const areEqual = (prevProps, nextProps) => true;

const DynamicMapComponent = ({ onLocationSelect }) => {
  return (
    <MapContainer center={[40.4378373, -3.8443427]} zoom={10} className="h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MyComponent onLocationFound={onLocationSelect} />
    </MapContainer>
  );
};

export default memo(DynamicMapComponent, areEqual);
