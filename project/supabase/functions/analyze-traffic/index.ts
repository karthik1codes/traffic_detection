import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DetectionResult {
  vehicle_type: string;
  confidence: number;
  bbox: [number, number, number, number];
  lane_number: number;
}

interface LaneData {
  lane_number: number;
  vehicle_count: number;
  vehicle_types: Record<string, number>;
  congestion_level: 'low' | 'medium' | 'high';
  priority_score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = performance.now();
    const { imageData } = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
          40 + Math.random() * 80,
        ],
        lane_number: laneNumber,
      });

      vehicleTypeCounts[vehicleType] = (vehicleTypeCounts[vehicleType] || 0) + 1;
    }

    const laneData: LaneData[] = [];
    for (let lane = 1; lane <= numLanes; lane++) {
      const laneVehicles = detections.filter((d) => d.lane_number === lane);
      const laneVehicleTypes: Record<string, number> = {};

      laneVehicles.forEach((v) => {
        laneVehicleTypes[v.vehicle_type] =
          (laneVehicleTypes[v.vehicle_type] || 0) + 1;
      });

      const vehicleCount = laneVehicles.length;
      let congestionLevel: 'low' | 'medium' | 'high';
      if (vehicleCount < 5) congestionLevel = 'low';
      else if (vehicleCount < 10) congestionLevel = 'medium';
      else congestionLevel = 'high';

      const priorityScore =
        vehicleCount *
        (congestionLevel === 'high' ? 3 : congestionLevel === 'medium' ? 2 : 1);

      laneData.push({
        lane_number: lane,
        vehicle_count: vehicleCount,
        vehicle_types: laneVehicleTypes,
        congestion_level: congestionLevel,
        priority_score: priorityScore,
      });
    }

    laneData.sort((a, b) => b.priority_score - a.priority_score);

    const signalRecommendation = `Lane ${laneData[0].lane_number} (${laneData[0].vehicle_count} vehicles, ${laneData[0].congestion_level} congestion)`;

    const totalPriorityScore = laneData.reduce(
      (sum, lane) => sum + lane.priority_score,
      0
    );
    const optimizationScore = Math.min(
      (laneData[0].priority_score / totalPriorityScore) * 100,
      100
    );

    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    const result = {
      total_vehicles: numVehicles,
      vehicle_types: vehicleTypeCounts,
      lanes_detected: numLanes,
      lane_data: laneData,
      signal_recommendation: signalRecommendation,
      optimization_score: optimizationScore,
      processing_time: processingTime,
      detections,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-traffic function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});