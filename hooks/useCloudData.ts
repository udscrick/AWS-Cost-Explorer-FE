import React, { useState, useCallback, useMemo } from 'react';
import {
  CloudProvider,
  CostData,
  Anomaly,
  Recommendation,
  ChatMessage,
  ChartView,
  ChartGranularity,
} from '../types';
import * as geminiService from '../services/geminiService';
import { fetchAnalysisData } from '../services/awsService';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const useCloudData = () => {
  const [cloudProvider, setCloudProvider] = useState<CloudProvider | null>(null);
  
  const defaultEndDate = useMemo(() => new Date(), []);
  const defaultStartDate = useMemo(() => {
    const date = new Date(defaultEndDate);
    date.setDate(date.getDate() - 89);
    return date;
  }, [defaultEndDate]);
  
  const [startDate, setStartDate] = useState<string>(formatDate(defaultStartDate));
  const [endDate, setEndDate] = useState<string>(formatDate(defaultEndDate));
  
  const [costData, setCostData] = useState<CostData[]>([]); // Aggregated for chart
  const [detailedCostData, setDetailedCostData] = useState<CostData[]>([]); // Granular for AI
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [anomalyDetails, setAnomalyDetails] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatHistoryForApi, setChatHistoryForApi] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [chartView, setChartView] = useState<ChartView>('line');
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('month');
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({
    anomalies: false,
    details: false,
    chat: false,
  });

  const setLoading = (key: string, value: boolean) => {
    setIsProcessing(prev => ({ ...prev, [key]: value }));
  };
  
  const resetState = () => {
    setCloudProvider(null);
    setCostData([]);
    setDetailedCostData([]);
    setAnomalies([]);
    setSelectedAnomaly(null);
    setAnomalyDetails(null);
    setRecommendations([]);
    setChatHistory([]);
    setChatHistoryForApi([]);
    setStartDate(formatDate(defaultStartDate));
    setEndDate(formatDate(defaultEndDate));
    setChartView('line');
    setChartGranularity('day');
    setIsProcessing({ anomalies: false, details: false, chat: false });
  };

  const handleSelectAnomaly = useCallback(async (anomaly: Anomaly | null, data: CostData[], provider: CloudProvider, granularity: ChartGranularity) => {
    if (!anomaly) {
      setSelectedAnomaly(null);
      setAnomalyDetails(null);
      setRecommendations([]);
      return;
    }

    setSelectedAnomaly(anomaly);
    setLoading('details', true);
    setAnomalyDetails(null);
    setRecommendations([]);
    
    try {
      const { anomalyDetails, recommendations } = await geminiService.getAnomalyDetails(anomaly, data, provider, startDate, endDate, granularity);
      setAnomalyDetails(anomalyDetails);
      setRecommendations(recommendations);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setAnomalyDetails(`Error fetching details: ${errorMessage}`);
    } finally {
      setLoading('details', false);
    }
  }, []);

  const fetchAndProcessData = useCallback(async (provider: CloudProvider, start: string, end: string, granularity: ChartGranularity) => {
    setLoading('anomalies', true);
    setAnomalies([]);
    setSelectedAnomaly(null);
    setAnomalyDetails(null);
    setRecommendations([]);

    try {
        const { detailedCostData, costData, anomalies } = await fetchAnalysisData(provider, start, end, granularity);
        
        setDetailedCostData(detailedCostData);
        setCostData(costData);
        setAnomalies(anomalies);

        if (anomalies.length > 0) {
          handleSelectAnomaly(anomalies[0], detailedCostData, provider, granularity);
        }

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setChatHistory(prev => [...prev, { sender: 'bot', text: `Error fetching data: ${errorMessage}` }]);
        if(error instanceof Error && (error.message.includes('credentials') || error.message.includes('backend'))) {
            resetState(); // Force user to re-select provider on critical errors
        }
    } finally {
        setLoading('anomalies', false);
    }
  }, [handleSelectAnomaly]);

  const handleSelectProvider = useCallback(async (provider: CloudProvider) => {
    setCloudProvider(provider);
    await fetchAndProcessData(provider, startDate, endDate, chartGranularity);
  }, [fetchAndProcessData, startDate, endDate, chartGranularity]);
  
  const handleDateRangeChange = useCallback(async (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    if(cloudProvider) {
        await fetchAndProcessData(cloudProvider, newStart, newEnd, chartGranularity);
    }
  }, [cloudProvider, fetchAndProcessData, chartGranularity]);

  const handleGranularityChange = useCallback(async (newGranularity: ChartGranularity) => {
    setChartGranularity(newGranularity);
    if (cloudProvider) {
      await fetchAndProcessData(cloudProvider, startDate, endDate, newGranularity);
    }
  }, [cloudProvider, startDate, endDate, fetchAndProcessData]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing.chat || !cloudProvider) return;

    const newChatHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newChatHistory);
    setLoading('chat', true);
    
    const newUserMessageForApi = { role: 'user', parts: [{ text: message }] };

    try {
      const botResponse = await geminiService.askCopilot(message, chatHistoryForApi, detailedCostData, cloudProvider);
      setChatHistory(prev => [...prev, { sender: 'bot', text: botResponse }]);
      const newBotMessageForApi = { role: 'model', parts: [{ text: botResponse }] };
      setChatHistoryForApi(prev => [...prev, newUserMessageForApi, newBotMessageForApi]);

    } catch (error)      {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "The copilot is unavailable.";
      setChatHistory(prev => [...prev, { sender: 'bot', text: errorMessage }]);
    } finally {
      setLoading('chat', false);
    }
  }, [chatHistory, isProcessing.chat, detailedCostData, chatHistoryForApi, cloudProvider]);

  return {
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
    handleSelectProvider,
    handleSelectAnomaly: (anomaly: Anomaly | null) => {
        if(cloudProvider) {
            handleSelectAnomaly(anomaly, detailedCostData, cloudProvider, chartGranularity);
        }
    },
    handleSendMessage,
    handleDateRangeChange,
    resetState,
  };
};