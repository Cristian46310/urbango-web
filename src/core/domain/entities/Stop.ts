export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  routes?: Route[];
}

export interface Route {
  id: string;
  name: string;
  code: string;
}

export interface NearbyStopDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  routes: Route[];
}
