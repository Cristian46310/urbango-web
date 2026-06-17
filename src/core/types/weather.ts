export type NotificationChannel = "email" | "whatsapp" | "push";

export interface WeatherAlert {
  id: string;
  user_id: string;
  user_email: string;
  travel_hour: number;
  city_name: string;
  city_lat: number;
  city_lon: number;
  preferred_channel: NotificationChannel;
  is_active: boolean;
  last_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeatherAlertRequest {
  user_id: string;
  user_email: string;
  travel_hour: number;
  city_name: string;
  preferred_channel?: NotificationChannel;
}

export interface UpdateWeatherAlertRequest {
  user_email: string;
  travel_hour: number;
  city_name: string;
  preferred_channel?: NotificationChannel;
}

export interface ForecastHour {
  dt: number;
  dt_txt: string;
  temp: number;
  description: string;
  icon: string;
}
