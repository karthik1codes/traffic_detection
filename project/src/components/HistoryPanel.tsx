import { Clock, Image, Video, Camera, ChevronRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type TrafficAnalysis } from '../lib/supabase';

interface HistoryPanelProps {
  onSelectAnalysis: (analysis: TrafficAnalysis) => void;
  refreshTrigger?: number;
}

export function HistoryPanel({ onSelectAnalysis, refreshTrigger }: HistoryPanelProps) {
  const [analyses, setAnalyses] = useState<TrafficAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('traffic_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const { error } = await supabase
        .from('traffic_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAnalyses(analyses.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis');
    }
  };

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'webcam': return Camera;
      default: return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Analyses</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Analyses</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No analyses yet</p>
          <p className="text-sm">Upload an image, video, or use webcam to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Analyses</h3>
      <div className="space-y-2">
        {analyses.map((analysis) => {
          const Icon = getInputIcon(analysis.input_type);
          return (
            <div
              key={analysis.id}
              onClick={() => onSelectAnalysis(analysis)}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {analysis.total_vehicles} vehicles, {analysis.lanes_detected} lanes
                  </p>
                  <p className="text-sm text-gray-600">{formatDate(analysis.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(analysis.id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
