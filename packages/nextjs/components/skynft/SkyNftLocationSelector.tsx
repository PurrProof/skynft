import React, { createRef, RefObject } from "react";
import { MapContainer, useMapEvents, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LeafletMouseEvent, LatLng } from "leaflet";

interface Coordinates {
  lat: number;
  lng: number;
}

interface SkyNftLocationSelectorProps {
  onLocationSelect: (param: Coordinates) => void;
}

interface MyComponentProps {
  onLocationFound: (location: LatLng) => void;
}

const SkyNftLocationSelector: React.FC<SkyNftLocationSelectorProps> = ({ onLocationSelect }) => {
  const mapRef: RefObject<L.Map> = createRef();
  //const [mapReady, setMapReady] = useState(false);

  return (
    <MapContainer
      ref={mapRef}
      whenReady={() => {
        //setMapReady(true);
      }}
      scrollWheelZoom={false}
      center={[40.4378373, -3.8443427]}
      zoom={11}
      className="z-0 h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MyComponent onLocationFound={onLocationSelect} />
    </MapContainer>
  );
};

function MyComponent({ onLocationFound }: MyComponentProps) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onLocationFound(e.latlng);
    },
  });
  return null;
}

export default SkyNftLocationSelector;
