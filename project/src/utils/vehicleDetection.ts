import type { LaneData, VehicleDetection } from '../lib/supabase';

export interface DetectionResult {
  vehicle_type: string;
  confidence: number;
  bbox: [number, number, number, number];
  lane_number: number;
}

export interface AnalysisResult {
  total_vehicles: number;
  vehicle_types: Record<string, number>;
  lanes_detected: number;
  lane_data: LaneData[];
  signal_recommendation: string;
  optimization_score: number;
  detections: DetectionResult[];
}

export function simulateYOLODetection(imageData: string): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const numLanes = Math.floor(Math.random() * 3) + 2;
      const vehicleTypes = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
      const detections: DetectionResult[] = [];
      const vehicleTypeCounts: Record<string, number> = {};

      const numVehicles = Math.floor(Math.random() * 30) + 10;

      for (let i = 0; i < numVehicles; i++) {
        const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const confidence = 0.7 + Math.random() * 0.3;
        const laneNumber = Math.floor(Math.random() * numLanes) + 1;

        detections.push({
          vehicle_type: vehicleType,
          confidence,
          bbox: [
            Math.random() * 800,
            Math.random() * 600,
            50 + Math.random() * 100,
            40 + Math.random() * 80
          ],
          lane_number: laneNumber
        });

        vehicleTypeCounts[vehicleType] = (vehicleTypeCounts[vehicleType] || 0) + 1;
      }

      const laneData: LaneData[] = [];
      for (let lane = 1; lane <= numLanes; lane++) {
        const laneVehicles = detections.filter(d => d.lane_number === lane);
        const laneVehicleTypes: Record<string, number> = {};

        laneVehicles.forEach(v => {
          laneVehicleTypes[v.vehicle_type] = (laneVehicleTypes[v.vehicle_type] || 0) + 1;
        });

        const vehicleCount = laneVehicles.length;
        let congestionLevel: 'low' | 'medium' | 'high';
        if (vehicleCount < 5) congestionLevel = 'low';
        else if (vehicleCount < 10) congestionLevel = 'medium';
        else congestionLevel = 'high';

        const priorityScore = vehicleCount * (congestionLevel === 'high' ? 3 : congestionLevel === 'medium' ? 2 : 1);

        laneData.push({
          lane_number: lane,
          vehicle_count: vehicleCount,
          vehicle_types: laneVehicleTypes,
          congestion_level: congestionLevel,
          priority_score: priorityScore
        });
      }

      laneData.sort((a, b) => b.priority_score - a.priority_score);

      const signalRecommendation = `Lane ${laneData[0].lane_number} (${laneData[0].vehicle_count} vehicles, ${laneData[0].congestion_level} congestion)`;

      const totalPriorityScore = laneData.reduce((sum, lane) => sum + lane.priority_score, 0);
      const optimizationScore = Math.min((laneData[0].priority_score / totalPriorityScore) * 100, 100);

      resolve({
        total_vehicles: numVehicles,
        vehicle_types: vehicleTypeCounts,
        lanes_detected: numLanes,
        lane_data: laneData,
        signal_recommendation: signalRecommendation,
        optimization_score: optimizationScore,
        detections
      });
    }, 1500);
  });
}

export function processVideoFrame(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  return '';
}

export function calculateTrafficMetrics(laneData: LaneData[]) {
  const totalVehicles = laneData.reduce((sum, lane) => sum + lane.vehicle_count, 0);
  const avgVehiclesPerLane = totalVehicles / laneData.length;

  const congestionLevels = {
    high: laneData.filter(l => l.congestion_level === 'high').length,
    medium: laneData.filter(l => l.congestion_level === 'medium').length,
    low: laneData.filter(l => l.congestion_level === 'low').length
  };

  return {
    totalVehicles,
    avgVehiclesPerLane: avgVehiclesPerLane.toFixed(1),
    congestionLevels,
    criticalLanes: laneData.filter(l => l.congestion_level === 'high').map(l => l.lane_number)
  };
}
