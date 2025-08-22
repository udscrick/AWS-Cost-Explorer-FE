
import React from 'react';
import { Recommendation } from '../types';
import { LightBulbIcon } from './icons';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4 transition-all hover:bg-gray-700/50">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-500/20 rounded-full">
        <LightBulbIcon className="fa-lg text-emerald-400" />
      </div>
      <div>
        <h4 className="font-bold text-white">{recommendation.title}</h4>
        <p className="text-sm text-gray-400 mt-1">{recommendation.description}</p>
      </div>
    </div>
  );
};

export default RecommendationCard;
