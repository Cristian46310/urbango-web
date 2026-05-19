export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationData {
  coordinates: GeolocationCoordinates | null;
  timestamp: number | null;
}
