import { Car, Truck, Bus, Bike, TrendingUp, Signal, Clock, Gauge } from 'lucide-react';
import type { TrafficAnalysis } from '../lib/supabase';

interface AnalysisResultsProps {
  analysis: TrafficAnalysis;
}

const vehicleIcons: Record<string, any> = {
  car: Car,
  truck: Truck,
  bus: Bus,
  motorcycle: Bike,
  bicycle: Bike,
};

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Signal className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Signal Optimization</h2>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <p className="text-sm text-blue-100 mb-2">Recommended Action:</p>
          <p className="text-xl font-bold">Make GREEN: {analysis.signal_recommendation}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analysis.total_vehicles}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Lanes Detected</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analysis.lanes_detected}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gauge className={`w-5 h-5 ${getScoreColor(analysis.optimization_score)}`} />
            </div>
            <p className="text-sm font-medium text-gray-600">Optimization</p>
          </div>
          <p className={`text-3xl font-bold ${getScoreColor(analysis.optimization_score)}`}>
            {analysis.optimization_score.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Process Time</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analysis.processing_time.toFixed(2)}s</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicle Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analysis.vehicle_types).map(([type, count]) => {
            const Icon = vehicleIcons[type] || Car;
            return (
              <div key={type} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Icon className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-sm font-medium text-gray-600 capitalize">{type}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Lane Analysis</h3>
        <div className="space-y-3">
          {analysis.lane_data.map((lane) => (
            <div key={lane.lane_number} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg font-bold">
                    {lane.lane_number}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Lane {lane.lane_number}</p>
                    <p className="text-sm text-gray-600">{lane.vehicle_count} vehicles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCongestionColor(lane.congestion_level)}`}>
                    {lane.congestion_level.toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="text-lg font-bold text-gray-900">{lane.priority_score}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(lane.vehicle_types).map(([type, count]) => {
                  const Icon = vehicleIcons[type] || Car;
                  return (
                    <div key={type} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 capitalize">{type}: {count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
