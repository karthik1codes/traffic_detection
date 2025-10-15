import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { WebcamCapture } from './components/WebcamCapture';
import { AnalysisResults } from './components/AnalysisResults';
import { HistoryPanel } from './components/HistoryPanel';
import { supabase, type TrafficAnalysis } from './lib/supabase';
import { Activity, Upload, Camera, History } from 'lucide-react';

type TabType = 'upload' | 'webcam' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [processing, setProcessing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<TrafficAnalysis | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const analyzeImage = async (imageData: string, inputType: 'image' | 'video' | 'webcam') => {
    setProcessing(true);
    setCurrentAnalysis(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-traffic`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();

      const { data, error } = await supabase
        .from('traffic_analyses')
        .insert([
          {
            input_type: inputType,
            total_vehicles: result.total_vehicles,
            vehicle_types: result.vehicle_types,
            lanes_detected: result.lanes_detected,
            lane_data: result.lane_data,
            signal_recommendation: result.signal_recommendation,
            optimization_score: result.optimization_score,
            processing_time: result.processing_time,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentAnalysis(data);
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async (file: File, type: 'image' | 'video') => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      await analyzeImage(imageData, type);
    };
    reader.readAsDataURL(file);
  };

  const handleWebcamCapture = async (imageData: string) => {
    await analyzeImage(imageData, 'webcam');
  };

  const handleSelectAnalysis = (analysis: TrafficAnalysis) => {
    setCurrentAnalysis(analysis);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Traffic Management System</h1>
              <p className="text-sm text-gray-600 mt-1">
                YOLO-powered vehicle detection and signal optimization
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === 'upload'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setActiveTab('webcam')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === 'webcam'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                    Live Webcam
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === 'history'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <History className="w-5 h-5" />
                    History
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {processing && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                      <p className="text-blue-700 font-medium">Analyzing traffic patterns...</p>
                    </div>
                  </div>
                )}

                {activeTab === 'upload' && (
                  <FileUpload onFileSelect={handleFileSelect} disabled={processing} />
                )}

                {activeTab === 'webcam' && (
                  <WebcamCapture onCapture={handleWebcamCapture} disabled={processing} />
                )}

                {activeTab === 'history' && (
                  <HistoryPanel
                    onSelectAnalysis={handleSelectAnalysis}
                    refreshTrigger={refreshHistory}
                  />
                )}
              </div>
            </div>

            {currentAnalysis && (
              <AnalysisResults analysis={currentAnalysis} />
            )}
          </div>

          <div className="lg:col-span-1">
            <HistoryPanel
              onSelectAnalysis={handleSelectAnalysis}
              refreshTrigger={refreshHistory}
            />

            <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <p>Upload an image, video, or use live webcam feed</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <p>YOLO AI model detects vehicles and analyzes traffic patterns</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <p>System identifies lanes and counts vehicles by type</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <p>Get optimized signal recommendations for traffic flow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
