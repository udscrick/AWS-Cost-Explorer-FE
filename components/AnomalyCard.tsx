
import React from 'react';
import { Anomaly } from '../types';
import { AlertTriangleIcon, SparklesIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface AnomalyCardProps {
  anomaly: Anomaly;
  anomalyDetails: string | null;
  isLoading: boolean;
}

const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, anomalyDetails, isLoading }) => {
  const deviation = anomaly.cost - anomaly.expectedCost;
  // Handle case where expected cost is 0 or negative to avoid division by zero or nonsensical percentages.
  const deviationPercent = anomaly.expectedCost > 0 ? Math.round(((deviation / anomaly.expectedCost) * 100)) : 0;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-rose-500/20 rounded-full">
           <AlertTriangleIcon className="fa-lg text-rose-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Cost Anomaly Detected</h3>
          {deviationPercent > 0 && (
            <p className="text-sm text-gray-400 mt-1">
                This represents a <span className="font-semibold text-rose-400">{deviationPercent}% increase</span> over the expected cost.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
         <div className="flex items-center space-x-2 mb-2">
            <SparklesIcon className="fa-lg text-sky-400 fa-fw" />
            <h4 className="font-semibold text-gray-200">AI-Powered Explanation</h4>
         </div>
         {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-400">
                <LoadingSpinner className="w-4 h-4" />
                <span>Generating insights...</span>
            </div>
         ) : (
            <p className="text-gray-300 text-sm">{anomalyDetails || "No explanation available."}</p>
         )}
      </div>
    </div>
  );
};

export default AnomalyCard;