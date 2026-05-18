import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { stopRepository } from '@/infra/repository/stop';
import type { NearbyStopDto } from '@/core/domain/entities/Stop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Fix for Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const NearbyStopsComponent: React.FC = () => {
  const { coordinates, loading: geoLoading, error: geoError, requestPermission } = useGeolocation();
  const [stops, setStops] = useState<NearbyStopDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch nearby stops when coordinates are available
  useEffect(() => {
    if (coordinates) {
      fetchNearbyStops();
    }
  }, [coordinates]);

  const fetchNearbyStops = async () => {
    if (!coordinates) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const nearbyStops = await stopRepository.findNearbyStops(
        coordinates.latitude,
        coordinates.longitude,
        100,
        1000
      );
      setStops(nearbyStops);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener paraderos cercanos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    if (coordinates) {
      fetchNearbyStops();
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(stops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStops = stops.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="w-8 h-8" />
          Buscar Paraderos Cercanos
        </h1>
        <p className="text-gray-600">Encuentra los paraderos cercanos a tu ubicación (5 por página)</p>
      </div>

      {/* Location Permission Card */}
      {!coordinates && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Solicitar Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Para encontrar paraderos cercanos, necesitamos acceso a tu ubicación GPS. Tu ubicación es privada y solo se usa para esta búsqueda.
            </p>
            {geoError && (
              <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{geoError}</p>
              </div>
            )}
            <Button
              onClick={requestPermission}
              disabled={geoLoading}
              size="lg"
              className="w-full"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detectando ubicación...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Permitir Acceso a Ubicación
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coordinates Display */}
      {coordinates && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="text-green-800 font-semibold">Ubicación detectada</p>
                <p className="text-green-700">
                  Lat: {coordinates.latitude.toFixed(4)}, Lon: {coordinates.longitude.toFixed(4)}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={requestPermission}
                disabled={geoLoading}
              >
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      {coordinates && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Paraderos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96 rounded-lg overflow-hidden border">
              <MapContainer
                center={[coordinates.latitude, coordinates.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                <Marker
                  position={[coordinates.latitude, coordinates.longitude]}
                  icon={L.icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>Tu ubicación actual</Popup>
                </Marker>

                {/* Stops markers */}
                {stops.map((stop) => (
                  <Marker
                    key={stop.id}
                    position={[stop.latitude, stop.longitude]}
                    icon={L.icon({
                      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                    })}
                  >
                    <Popup>
                      <div className="text-sm font-semibold">{stop.name}</div>
                      <div className="text-xs text-gray-600">
                        {(stop.distance ?? 0).toFixed(0)}m de distancia
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              Error al buscar paraderos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
            {coordinates && (
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="mt-4"
                variant="outline"
              >
                Intentar de nuevo
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <p>Buscando paraderos cercanos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stops List */}
      {stops.length > 0 && !loading && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Paraderos Cercanos ({stops.length})</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Página {currentPage} de {totalPages}</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                    {startIndex + index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{stop.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {(stop.distance ?? 0).toFixed(0)}m de distancia
                    </p>
                    {stop.routes && stop.routes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Rutas disponibles:</p>
                        <div className="flex flex-wrap gap-2">
                          {stop.routes.map((route) => (
                            <span
                              key={route.id}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold"
                            >
                              {route.code} - {route.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {coordinates && !loading && stops.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron paraderos cercanos en el radio de 1km</p>
              <Button
                onClick={handleRefresh}
                className="mt-4"
              >
                Buscar de nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
