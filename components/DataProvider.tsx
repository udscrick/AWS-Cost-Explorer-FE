import React from 'react';
import type { CloudProvider } from '../types';
import { AwsIcon, CloudIcon } from './icons';

interface DataProviderProps {
  onSelectProvider: (provider: CloudProvider) => void;
}

const ProviderButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 w-60 h-48"
        aria-label={label}
    >
        {icon}
        <span className="mt-4 text-lg font-semibold text-gray-200">{label}</span>
    </button>
);


const DataProvider: React.FC<DataProviderProps> = ({ onSelectProvider }) => {
  return (
    <div className="text-center max-w-4xl mx-auto mt-10 sm:mt-20">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Choose a Data Source</h2>
      <p className="text-lg text-gray-400 mb-12">
        Analyze your AWS cost data or use our sample demo data to explore the dashboard's features.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
          <ProviderButton icon={<AwsIcon className="fa-4x" />} label="Analyze AWS Data" onClick={() => onSelectProvider('aws')} />
          <ProviderButton icon={<CloudIcon className="fa-4x" />} label="Use Demo Data" onClick={() => onSelectProvider('mock')} />
      </div>
    </div>
  );
};

export default DataProvider;
