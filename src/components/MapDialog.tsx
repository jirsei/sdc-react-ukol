import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { User } from '../types/User';

interface MapDialogProps {
  open: boolean;
  users: User[];
  selectedIds?: string[];
  onClose: () => void;
}

export default function MapDialog({ open, users, selectedIds, onClose }: MapDialogProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const visibleUsers = useMemo(() => {
    if (!selectedIds?.length) return users;

    return users.filter((user) => selectedIds.includes(user.uid));
  }, [selectedIds, users]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([50.0755, 14.4378], 6);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      map.invalidateSize();
      setMapReady(true);
    };

    const initializationTimeout = window.setTimeout(initializeMap, 250);
    return () => {
      window.clearTimeout(initializationTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [open]);

  useEffect(() => {
    const map = mapRef.current;
    if (!open || !mapReady || !map) return;

    const markers = visibleUsers.flatMap((user) => {
      if (!user.location) return [];

      const coordinates = user.location
        .replace(/[()[\]]/g, '')
        .split(',')
        .map((value) => Number(value.trim()));

      if (coordinates.length !== 2 || coordinates.some(Number.isNaN)) {
        return [];
      }

      const [latitude, longitude] = coordinates;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];

      const userMarkerIcon = L.icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIconRetina,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: user.accessAllowed ? 'access-marker--allowed' : 'access-marker--denied',
      });

      return [
        L.marker([latitude, longitude], { icon: userMarkerIcon }).bindTooltip(
          `${user.firstName} ${user.lastName}`,
          { direction: 'top', offset: [0, -35] },
        ),
      ];
    });

    const markerLayer = L.featureGroup(markers).addTo(map);
    if (markers.length > 0) {
      map.fitBounds(markerLayer.getBounds(), { padding: [24, 24], maxZoom: 13 });
    }

    map.invalidateSize();
    return () => {
      markerLayer.remove();
    };
  }, [mapReady, open, visibleUsers]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Map</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box ref={mapContainerRef} sx={{ height: 480, width: '100%' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
