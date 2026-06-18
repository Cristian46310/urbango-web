import React, { useCallback, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { stopRepository } from '@/infra/repository/stop';
import { dashboardRepository } from '@/infra/repository/business/DashboardRepository';
import type { NearbyStopDto } from '@/core/domain/entities/Stop';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Fix for Leaflet icons
const iconDefaultPrototype = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: () => string;
};
delete iconDefaultPrototype._getIconUrl;
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
  const [selectedNotificationStop, setSelectedNotificationStop] = useState<NearbyStopDto | null>(null);
  const [selectedNotificationRouteId, setSelectedNotificationRouteId] = useState<string>("");
  const [anticipationMinutes, setAnticipationMinutes] = useState<number>(5);
  const [notificationEmail, setNotificationEmail] = useState<string>("");
  const [subscribing, setSubscribing] = useState(false);
  const itemsPerPage = 5;

  const lastFetchCoordsRef = React.useRef<{ lat: number; lon: number } | null>(null);

  const fetchNearbyStops = useCallback(async () => {
    if (!coordinates) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const nearbyStops = await stopRepository.findNearbyStops(
        coordinates.latitude,
        coordinates.longitude,
        5,
        1000
      );
      setStops(nearbyStops);
      lastFetchCoordsRef.current = {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener paraderos cercanos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    if (!coordinates) return;

    const last = lastFetchCoordsRef.current;
    if (!last) {
      void fetchNearbyStops();
      return;
    }

    const movedKm =
      Math.hypot(coordinates.latitude - last.lat, coordinates.longitude - last.lon) *
      111;
    if (movedKm >= 0.15) {
      void fetchNearbyStops();
    }
  }, [coordinates, fetchNearbyStops]);

  const handleRefresh = () => {
    setCurrentPage(1);
    if (coordinates) {
      void fetchNearbyStops();
    }
  };

  const handleSelectNotificationStop = (stop: NearbyStopDto) => {
    setSelectedNotificationStop(stop);
    setSelectedNotificationRouteId(stop.routes?.[0]?.id ?? "");
  };

  const handleSendNotification = async () => {
    if (!selectedNotificationStop) {
      toast.error("Selecciona un paradero primero.");
      return;
    }

    if (!notificationEmail.trim()) {
      toast.error("Ingresa un correo válido para recibir la notificación.");
      return;
    }

    setSubscribing(true);
    try {
      await dashboardRepository.createArrivalNotification({
        stopId: selectedNotificationStop.id,
        routeId: selectedNotificationRouteId || selectedNotificationStop.routeId,
        email: notificationEmail.trim(),
        anticipationMinutes,
      });

      toast.success("Notificación creada. Te avisaremos antes de la llegada.");
      setNotificationEmail("");
      setAnticipationMinutes(5);
      setSelectedNotificationStop(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "No se pudo crear la notificación.";
      toast.error(errorMessage);
    } finally {
      setSubscribing(false);
    }
  };

  // Pagination logic
  const stopsList = Array.isArray(stops) ? stops : [];
  const totalPages = Math.ceil(stopsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStops = stopsList.slice(startIndex, endIndex);

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
              onClick={() => {
                void requestPermission();
              }}
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
                onClick={() => {
                  void requestPermission();
                }}
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
                {stopsList.map((stop) => (
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
                        {stop.distance.toFixed(0)}m de distancia
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
      {stopsList.length > 0 && !loading && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Paraderos Cercanos ({stopsList.length})</CardTitle>
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
                  className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-gray-50 transition md:flex-row md:items-start"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                      {startIndex + index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{stop.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {stop.distance.toFixed(0)}m de distancia
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    {stop.routes.length > 0 && (
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
                  <div className="flex-shrink-0 md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectNotificationStop(stop)}
                    >
                      {selectedNotificationStop?.id === stop.id ? 'Seleccionado' : 'Notificar llegada'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedNotificationStop && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Suscripción de llegada</h3>
                    <p className="text-sm text-slate-600">
                      Activa una notificación cuando el bus de la ruta seleccionada esté cerca de este paradero.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {selectedNotificationStop.name}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="notification-email" className="mb-1 block text-sm font-medium text-slate-700">
                      Correo electrónico
                    </Label>
                    <Input
                      id="notification-email"
                      type="email"
                      value={notificationEmail}
                      onChange={(event) => setNotificationEmail(event.target.value)}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="route-select" className="mb-1 block text-sm font-medium text-slate-700">
                      Ruta
                    </Label>
                    <Select value={selectedNotificationRouteId} onValueChange={setSelectedNotificationRouteId}>
                      <SelectTrigger id="route-select" className="w-full">
                        <SelectValue placeholder="Selecciona ruta" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedNotificationStop.routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.code} - {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="anticipation-minutes" className="mb-1 block text-sm font-medium text-slate-700">
                      Minutos antes
                    </Label>
                    <Input
                      id="anticipation-minutes"
                      type="number"
                      min={1}
                      max={60}
                      value={anticipationMinutes}
                      onChange={(event) => setAnticipationMinutes(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleSendNotification}
                    disabled={subscribing || !notificationEmail.trim()}
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Guardar alerta'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNotificationStop(null)}
                    disabled={subscribing}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); }}
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
                      onClick={() => { setCurrentPage(page); }}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); }}
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
      {coordinates && !loading && stopsList.length === 0 && !error && (
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
