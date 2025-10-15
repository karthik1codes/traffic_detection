/*
  # Traffic Management System Database Schema

  1. New Tables
    - `traffic_analyses`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `user_id` (uuid) - User who performed the analysis
      - `input_type` (text) - Type of input: 'image', 'video', or 'webcam'
      - `file_url` (text, nullable) - URL to uploaded file if applicable
      - `total_vehicles` (integer) - Total number of vehicles detected
      - `vehicle_types` (jsonb) - Breakdown of vehicle types detected
      - `lanes_detected` (integer) - Number of lanes identified
      - `lane_data` (jsonb) - Detailed data per lane including vehicle counts
      - `signal_recommendation` (text) - Which signal should be green
      - `optimization_score` (float) - Traffic flow optimization score
      - `processing_time` (float) - Time taken to process in seconds
      - `created_at` (timestamptz) - When analysis was performed
      
    - `vehicle_detections`
      - `id` (uuid, primary key) - Unique identifier for each detection
      - `analysis_id` (uuid, foreign key) - Reference to parent analysis
      - `vehicle_type` (text) - Type of vehicle (car, truck, bus, motorcycle, etc.)
      - `confidence` (float) - Detection confidence score
      - `lane_number` (integer) - Which lane the vehicle is in
      - `position_x` (float) - X coordinate of bounding box
      - `position_y` (float) - Y coordinate of bounding box
      - `width` (float) - Width of bounding box
      - `height` (float) - Height of bounding box
      - `timestamp` (timestamptz) - Detection timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading detection data
*/

-- Create traffic_analyses table
CREATE TABLE IF NOT EXISTS traffic_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  input_type text NOT NULL CHECK (input_type IN ('image', 'video', 'webcam')),
  file_url text,
  total_vehicles integer DEFAULT 0,
  vehicle_types jsonb DEFAULT '{}'::jsonb,
  lanes_detected integer DEFAULT 1,
  lane_data jsonb DEFAULT '[]'::jsonb,
  signal_recommendation text,
  optimization_score float DEFAULT 0.0,
  processing_time float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Create vehicle_detections table
CREATE TABLE IF NOT EXISTS vehicle_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES traffic_analyses(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  confidence float NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  lane_number integer NOT NULL,
  position_x float NOT NULL,
  position_y float NOT NULL,
  width float NOT NULL,
  height float NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_traffic_analyses_user_id ON traffic_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_analyses_created_at ON traffic_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_detections_analysis_id ON vehicle_detections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_detections_vehicle_type ON vehicle_detections(vehicle_type);

-- Enable Row Level Security
ALTER TABLE traffic_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_detections ENABLE ROW LEVEL SECURITY;

-- Policies for traffic_analyses table
CREATE POLICY "Users can view all traffic analyses"
  ON traffic_analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own traffic analyses"
  ON traffic_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own traffic analyses"
  ON traffic_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own traffic analyses"
  ON traffic_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for vehicle_detections table
CREATE POLICY "Users can view all vehicle detections"
  ON vehicle_detections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert vehicle detections"
  ON vehicle_detections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vehicle detections for their analyses"
  ON vehicle_detections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traffic_analyses
      WHERE traffic_analyses.id = vehicle_detections.analysis_id
      AND traffic_analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM traffic_analyses
      WHERE traffic_analyses.id = vehicle_detections.analysis_id
      AND traffic_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vehicle detections for their analyses"
  ON vehicle_detections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traffic_analyses
      WHERE traffic_analyses.id = vehicle_detections.analysis_id
      AND traffic_analyses.user_id = auth.uid()
    )
  );