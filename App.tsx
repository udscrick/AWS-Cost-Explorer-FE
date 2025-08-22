
import React from 'react';
import Header from './components/Header';
import DataProvider from './components/DataProvider';
import Dashboard from './components/Dashboard';
import { useCloudData } from './hooks/useCloudData';

function App(): React.ReactNode {
  const cloudDataState = useCloudData();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        {!cloudDataState.cloudProvider ? (
          <DataProvider
            onSelectProvider={cloudDataState.handleSelectProvider}
          />
        ) : (
          <Dashboard
            {...cloudDataState}
          />
        )}
      </main>
    </div>
  );
}

export default App;