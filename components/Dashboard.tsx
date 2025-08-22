import React, { useState, useEffect } from 'react';
import type { useCloudData } from '../hooks/useCloudData';
import type { ChartView, ChartGranularity } from '../types';
import CostChart from './CostChart';
import AnomalyCard from './AnomalyCard';
import RecommendationCard from './RecommendationCard';
import Chatbot from './Chatbot';
import LoadingSpinner from './LoadingSpinner';
import { AwsIcon, BackIcon, ChartLineIcon, ChartBarIcon, ChartAreaIcon, ChartStackedIcon, CloudIcon } from './icons';

type DashboardProps = ReturnType<typeof useCloudData>;

const DateRangePicker: React.FC<{
    startDate: string;
    endDate: string;
    onApply: (start: string, end: string) => void;
    isFetching: boolean;
}> = ({ startDate, endDate, onApply, isFetching }) => {
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    useEffect(() => {
        setStart(startDate);
        setEnd(endDate);
    }, [startDate, endDate]);

    const handleApply = () => {
        onApply(start, end);
    };

    return (
        <div className="flex items-center gap-2">
             <div className="relative">
                <label htmlFor="startDate" className="absolute -top-2 left-3 bg-gray-900 px-1 text-xs text-gray-400">Start Date</label>
                <input
                    type="date"
                    id="startDate"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
                    disabled={isFetching}
                />
            </div>
            <div className="relative">
                 <label htmlFor="endDate" className="absolute -top-2 left-3 bg-gray-900 px-1 text-xs text-gray-400">End Date</label>
                <input
                    type="date"
                    id="endDate"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
                    disabled={isFetching}
                />
            </div>
            <button
                onClick={handleApply}
                disabled={isFetching}
                className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
                Refresh
            </button>
        </div>
    );
};

const ChartViewSelector: React.FC<{
    currentView: ChartView;
    onViewChange: (view: ChartView) => void;
}> = ({ currentView, onViewChange }) => {
    const views: { id: ChartView, icon: React.ReactNode, label: string }[] = [
        { id: 'line', icon: <ChartLineIcon />, label: 'Line Chart' },
        { id: 'bar', icon: <ChartBarIcon />, label: 'Bar Chart' },
        { id: 'area', icon: <ChartAreaIcon />, label: 'Area Chart' },
        { id: 'stacked-bar', icon: <ChartStackedIcon />, label: 'Stacked Bar Chart' },
    ];

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-md flex items-center gap-1">
            {views.map(view => (
                <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                        currentView === view.id
                            ? 'bg-sky-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    aria-label={view.label}
                    title={view.label}
                >
                    {view.icon}
                </button>
            ))}
        </div>
    );
};

const GranularitySelector: React.FC<{
    currentGranularity: ChartGranularity;
    onGranularityChange: (granularity: ChartGranularity) => void;
    isFetching: boolean;
}> = ({ currentGranularity, onGranularityChange, isFetching }) => {
    const granularities: { id: ChartGranularity, label: string }[] = [
        { id: 'day', label: 'Day' },
        { id: 'month', label: 'Month' },
        { id: 'year', label: 'Year' },
    ];

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-md flex items-center gap-1">
            {granularities.map(g => (
                <button
                    key={g.id}
                    onClick={() => onGranularityChange(g.id)}
                    disabled={isFetching}
                    className={`px-3 py-1 rounded-md transition-colors text-xs font-semibold ${
                        currentGranularity === g.id
                            ? 'bg-sky-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Group by ${g.label}`}
                    title={`Group by ${g.label}`}
                >
                    {g.label}
                </button>
            ))}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({
  cloudProvider,
  startDate,
  endDate,
  costData,
  detailedCostData,
  anomalies,
  selectedAnomaly,
  anomalyDetails,
  recommendations,
  chatHistory,
  isProcessing,
  chartView,
  setChartView,
  chartGranularity,
  handleGranularityChange,
  handleSelectAnomaly,
  handleSendMessage,
  handleDateRangeChange,
  resetState,
}) => {
  let ProviderIcon;
  let providerName;

  if (cloudProvider === 'aws') {
      ProviderIcon = <AwsIcon className="fa-2x text-white" />;
      providerName = 'Amazon Web Services';
  } else {
      ProviderIcon = <CloudIcon className="fa-2x text-white" />;
      providerName = 'Demo Environment';
  }


  return (
    <div className="space-y-6">
       <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
            {ProviderIcon}
            <h2 className="text-2xl font-bold">{providerName} Cost Analysis</h2>
        </div>
        <div className="flex items-center gap-4">
             <DateRangePicker 
                startDate={startDate}
                endDate={endDate}
                onApply={handleDateRangeChange}
                isFetching={isProcessing.anomalies}
            />
            <button 
                onClick={resetState}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
            >
                <BackIcon className="mr-2" />
                Change Provider
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Chart and Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[400px] relative">
             {isProcessing.anomalies && <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center rounded-lg z-10"><LoadingSpinner /></div>}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                <GranularitySelector 
                    currentGranularity={chartGranularity}
                    onGranularityChange={handleGranularityChange}
                    isFetching={isProcessing.anomalies}
                />
                <ChartViewSelector currentView={chartView} onViewChange={setChartView} />
            </div>
            <CostChart
              view={chartView}
              granularity={chartGranularity}
              data={costData}
              detailedData={detailedCostData}
              anomalies={anomalies}
              onSelectAnomaly={(date) => {
                const anomaly = anomalies.find(a => a.date === date);
                if (anomaly) handleSelectAnomaly(anomaly);
              }}
              selectedAnomalyDate={selectedAnomaly?.date}
            />
          </div>

          {selectedAnomaly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnomalyCard 
                anomaly={selectedAnomaly} 
                anomalyDetails={anomalyDetails} 
                isLoading={isProcessing.details} 
              />
              <div className="space-y-4">
                  {isProcessing.details ? (
                      [...Array(2)].map((_, i) => <div key={i} className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse h-24"></div>)
                  ) : recommendations.length > 0 ? (
                      recommendations.map((rec, index) => (
                          <RecommendationCard key={index} recommendation={rec} />
                      ))
                  ) : (
                      <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full flex items-center justify-center">
                          <p className="text-gray-400">No recommendations available.</p>
                      </div>
                  )}
              </div>
            </div>
          )}
          {!selectedAnomaly && !isProcessing.anomalies && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h3 className="text-lg font-semibold text-white">
                    {anomalies.length > 0 ? "Select an Anomaly" : "No Anomalies Detected"}
                </h3>
                <p className="text-gray-400 mt-2">
                    {anomalies.length > 0 ? "Click on a highlighted point in the chart to view details and recommendations." : (costData.length > 0 ? "Good job! Your cloud spending appears stable for this period." : "No data available for the selected period.")}
                </p>
            </div>
          )}
        </div>

        {/* Side Content: Chatbot */}
        <div className="lg:col-span-1">
          <Chatbot 
            messages={chatHistory} 
            onSendMessage={handleSendMessage}
            isLoading={isProcessing.chat}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;