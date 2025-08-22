
import React from 'react';
import { CloudIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex items-center">
        <CloudIcon className="fa-2x text-sky-400 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">
          Cloud FinOps Copilot
        </h1>
      </div>
    </header>
  );
};

export default Header;
