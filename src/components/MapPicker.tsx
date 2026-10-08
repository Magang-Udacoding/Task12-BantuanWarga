'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Loader } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { toast } from '@/lib/notify';

interface MapPickerProps {
  value: string;
  onChange: (address: string) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const isInitialMount = useRef(true);

  // Keep onChangeRef fresh without triggering effect re-runs
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(value || '');

  // Load Leaflet CSS dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Centralized method to immediately move the map view and marker
  const setMapLocation = (lat: number, lng: number, zoom = 16) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // Helper for reverse geocoding (coordinates -> address string)
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'WargaBantu-App/1.0',
          },
        }
      );
      if (!response.ok) throw new Error('Gagal menghubungi layanan geocoding');
      const data = await response.json();
      
      const displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setResolvedAddress(displayName);
      onChangeRef.current(displayName);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal mendapatkan alamat dari titik koordinat.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map ONCE on mount
  useEffect(() => {
    const container = mapRef.current;
    if (typeof window === 'undefined' || !container) return;

    if (mapInstanceRef.current) return;

    // Dynamically import Leaflet to ensure it's client-only
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) return;

      // Default coordinate: Jakarta
      const defaultLat = -6.2088;
      const defaultLng = 106.8456;

      const map = L.map(container, { attributionControl: false }).setView([defaultLat, defaultLng], 13);
      mapInstanceRef.current = map;

      // Standard colorful OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Custom SVG Pin Icon using React icon MapPin (Vibrant colored pin)
      const pinIcon = L.divIcon({
        html: ReactDOMServer.renderToString(
          <div className="filter drop-shadow-md flex items-center justify-center">
            <MapPin size={36} fill="#E11D48" className="text-rose-600 stroke-white" strokeWidth={1.5} />
          </div>
        ),
        className: 'custom-pin-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([defaultLat, defaultLng], { icon: pinIcon, draggable: true }).addTo(map);
      markerInstanceRef.current = marker;

      // Reverse geocode default position on initial mount if empty
      if (!value && isInitialMount.current) {
        reverseGeocode(defaultLat, defaultLng);
        isInitialMount.current = false;
      }

      // Handle map click to move marker
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      // Handle marker drag end
      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        reverseGeocode(lat, lng);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Geolocation GPS detection
  const handleGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung layanan Geolocation.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapLocation(latitude, longitude, 16);
        reverseGeocode(latitude, longitude);
        toast.success('Lokasi GPS Anda berhasil dideteksi. Peta telah diarahkan ke posisi Anda saat ini.', {
          title: 'GPS BERHASIL DIDETEKSI',
        });
      },
      (err) => {
        setLoading(false);
        const msg = err.code === 1
          ? 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.'
          : 'Gagal mendeteksi lokasi GPS Anda. Pastikan GPS aktif dan coba lagi.';
        setErrorMsg(msg);
        toast.error(msg, { title: 'GPS TIDAK TERDETEKSI' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search address (Nominatim API)
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'WargaBantu-App/1.0',
          },
        }
      );
      if (!response.ok) throw new Error('Gagal menghubungi layanan pencarian');
      const data = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
        const notFoundMsg = 'Lokasi tidak ditemukan. Coba ketik nama kelurahan, kecamatan, atau kota yang lebih jelas.';
        setErrorMsg(notFoundMsg);
        toast.error(notFoundMsg, { title: 'LOKASI TIDAK DITEMUKAN' });
      } else {
        // Otomatis langsung pindahkan peta dan pin ke hasil pertama yang paling relevan!
        const topResult = data[0];
        const lat = parseFloat(topResult.lat);
        const lon = parseFloat(topResult.lon);
        setMapLocation(lat, lon, 16);
        setResolvedAddress(topResult.display_name);
        onChangeRef.current(topResult.display_name);
        toast.success(`Titik peta berhasil dipindahkan ke: ${topResult.display_name.slice(0, 50)}...`, {
          title: 'LOKASI DITEMUKAN',
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal mencari lokasi.');
      toast.error('Gagal menghubungi server pencarian lokasi.', { title: 'KENDALA PENCARIAN' });
    } finally {
      setIsSearching(false);
    }
  };

  // Select a search result from dropdown
  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const displayName = result.display_name;

    setResolvedAddress(displayName);
    onChangeRef.current(displayName);
    setSearchResults([]);
    setSearchQuery('');
    setErrorMsg(null);

    // Langsung pindahkan tampilan peta dan pin marker!
    setMapLocation(lat, lon, 16);
  };

  return (
    <div className="w-full flex flex-col gap-3 transition-colors duration-300">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-3 top-3 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
            placeholder="Cari lokasi di peta (contoh: Padang, Bandung)..."
            className="w-full pl-9 pr-4 py-2 border-2 border-border-custom bg-input-bg text-text-primary font-mono text-xs sm:text-sm focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={isSearching}
          className="px-4 py-2 border-2 border-border-custom bg-card hover:bg-bg-slate-gray text-text-primary font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center min-w-[70px] disabled:opacity-50"
        >
          {isSearching ? <Loader size={14} className="animate-spin" /> : 'Cari'}
        </button>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <ul className="bg-card border-2 border-border-custom max-h-48 overflow-y-auto divide-y divide-border-custom shadow-lg text-xs font-mono">
          {searchResults.map((result, idx) => (
            <li
              key={idx}
              onClick={() => handleSelectResult(result)}
              className="px-4 py-2.5 hover:bg-bg-slate-gray text-text-primary cursor-pointer truncate"
              title={result.display_name}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* Action bar (GPS button and Status) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleGPS}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-border-custom bg-card hover:bg-bg-slate-gray text-text-primary disabled:opacity-75 disabled:cursor-wait text-xs font-mono uppercase tracking-wider transition-colors"
        >
          <Navigation size={13} className="fill-current" />
          {loading ? 'Mendeteksi GPS...' : 'Gunakan GPS Saya'}
        </button>

        {loading && (
          <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
            <Loader size={12} className="animate-spin text-text-primary" />
            Mendapatkan alamat...
          </span>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <p className="font-mono text-xs text-text-primary bg-bg-slate-gray p-2.5 border-2 border-border-custom">
          [ PERHATIAN ]: {errorMsg}
        </p>
      )}

      {/* Map Container */}
      <div className="w-full relative border-2 border-border-custom overflow-hidden bg-card">
        <div ref={mapRef} className="w-full h-[260px] z-0" />
        
        {/* Subtle Map Hint Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-card/95 px-2.5 py-1 text-[10px] font-mono text-text-muted border border-border-custom pointer-events-none">
          Geser pin atau klik peta untuk ubah lokasi
        </div>
      </div>

      {/* Selected Address Display */}
      {resolvedAddress && (
        <div className="flex items-start gap-2 bg-card p-3 border-2 border-border-custom font-mono text-xs text-text-primary leading-relaxed">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="font-bold uppercase tracking-wider mb-0.5">Alamat Terpilih:</p>
            <p className="text-[11px] leading-relaxed break-all text-text-muted">{resolvedAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
}
