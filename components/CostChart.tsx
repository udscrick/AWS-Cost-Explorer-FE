
import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Legend,
} from 'recharts';
import { CostData, Anomaly, ChartView, ChartGranularity } from '../types';

interface CostChartProps {
  view: ChartView;
  granularity: ChartGranularity;
  data: CostData[];
  detailedData: CostData[];
  anomalies: Anomaly[];
  onSelectAnomaly: (date: string) => void;
  selectedAnomalyDate?: string | null;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
        <p className="label text-gray-200 font-semibold">{`Date: ${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color || pld.stroke }}>
            {`${pld.name}: $${pld.value}`}
          </div>
        ))}
        {payload.length > 1 && (
            <div className="pt-2 mt-2 border-t border-gray-600 text-white font-bold">
                {`Total: $${Math.round(payload.reduce((sum, p) => sum + p.value, 0) * 100) / 100}`}
            </div>
        )}
      </div>
    );
  }
  return null;
};

// A vibrant color palette for chart series
const COLORS = [
  '#38bdf8', '#34d399', '#facc15', '#fb923c', '#f87171', '#c084fc', '#818cf8', 
  '#a7f3d0', '#fde68a', '#fed7aa', '#fecaca', '#e9d5ff', '#c7d2fe',
];

const formatXAxisTick = (tick: string, granularity: ChartGranularity) => {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };
    switch (granularity) {
        case 'year':
            options.year = 'numeric';
            break;
        case 'month':
            options.year = '2-digit';
            options.month = 'short';
            break;
        case 'day':
        default:
            options.month = 'short';
            options.day = 'numeric';
            break;
    }
    // Handle date strings that might not be parsed correctly otherwise
    const dateString = tick.includes('T') ? tick : `${tick}T00:00:00`;
    return new Date(dateString).toLocaleDateString('en-US', options);
};


const CostChart: React.FC<CostChartProps> = ({ view, granularity, data, detailedData, anomalies, onSelectAnomaly, selectedAnomalyDate }) => {
  const { stackedBarData, serviceKeys, serviceColors } = useMemo(() => {
    if (view !== 'stacked-bar') return { stackedBarData: [], serviceKeys: [], serviceColors: {} };

    const services = [...new Set(detailedData.map(d => d.service))].sort();
    const colors = services.reduce((acc, service, i) => {
        acc[service] = COLORS[i % COLORS.length];
        return acc;
    }, {} as Record<string, string>);

    const dataByDate = detailedData.reduce((acc, { date, service, cost }) => {
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][service] = (acc[date][service] || 0) + cost;
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(dataByDate);
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { stackedBarData: chartData, serviceKeys: services, serviceColors: colors };
  }, [detailedData, view]);
  
  const CommonComponents = ({ hasAnomalies = false }) => (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
      <XAxis 
        dataKey="date" 
        stroke="#9CA3AF" 
        tick={{ fontSize: 12 }} 
        angle={-20} 
        textAnchor="end" 
        height={50}
        tickFormatter={(tick) => formatXAxisTick(tick, granularity)}
       />
      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
      <Tooltip content={<CustomTooltip />} />
      {hasAnomalies && anomalies.map((anomaly) => (
        <ReferenceDot
          key={anomaly.date}
          x={anomaly.date}
          y={anomaly.cost}
          r={selectedAnomalyDate === anomaly.date ? 10 : 6}
          fill={selectedAnomalyDate === anomaly.date ? "#F59E0B" : "#F43F5E"}
          stroke={selectedAnomalyDate === anomaly.date ? "#fff" : "#F43F5E"}
          strokeWidth={2}
          onClick={() => onSelectAnomaly(anomaly.date)}
          cursor="pointer"
        />
      ))}
    </>
  );

  const renderChart = () => {
    switch (view) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 15, right: 30, left: 20, bottom: 20 }}>
            <CommonComponents hasAnomalies />
            <Bar dataKey="cost" fill="#0EA5E9" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 15, right: 30, left: 20, bottom: 20 }}>
            <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CommonComponents hasAnomalies />
            <Area type="monotone" dataKey="cost" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
          </AreaChart>
        );
      case 'stacked-bar':
        return (
            <BarChart data={stackedBarData} margin={{ top: 15, right: 30, left: 20, bottom: 20 }}>
                <CommonComponents />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", bottom: -5}} />
                {serviceKeys.map((key) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={serviceColors[key]} />
                ))}
            </BarChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={data} margin={{ top: 15, right: 30, left: 20, bottom: 20 }}>
            <CommonComponents hasAnomalies />
            <Line type="monotone" dataKey="cost" stroke="#0EA5E9" strokeWidth={2} dot={false} />
          </LineChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default CostChart;
