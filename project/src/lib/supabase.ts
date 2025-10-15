import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TrafficAnalysis {
  id: string;
  user_id?: string;
  input_type: 'image' | 'video' | 'webcam';
  file_url?: string;
  total_vehicles: number;
  vehicle_types: Record<string, number>;
  lanes_detected: number;
  lane_data: LaneData[];
  signal_recommendation: string;
  optimization_score: number;
  processing_time: number;
  created_at: string;
}

export interface LaneData {
  lane_number: number;
  vehicle_count: number;
  vehicle_types: Record<string, number>;
  congestion_level: 'low' | 'medium' | 'high';
  priority_score: number;
}

export interface VehicleDetection {
  id: string;
  analysis_id: string;
  vehicle_type: string;
  confidence: number;
  lane_number: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  timestamp: string;
}
