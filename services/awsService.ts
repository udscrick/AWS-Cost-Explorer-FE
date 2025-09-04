import type { CloudProvider, CostData, Anomaly, ChartGranularity } from '../types';

interface AnalysisData {
    detailedCostData: CostData[];
    costData: CostData[];
    anomalies: Anomaly[];
}

// --- MOCK DATA GENERATION ---
const MOCK_SERVICES = [
    { name: 'Amazon EC2', baseCost: 50, fluctuation: 20 },
    { name: 'Amazon S3', baseCost: 15, fluctuation: 5 },
    { name: 'Amazon RDS', baseCost: 25, fluctuation: 10 },
    { name: 'AWS Lambda', baseCost: 5, fluctuation: 3 },
];

const generateMockDetailedData = (start: Date, end: Date): { detailedCostData: CostData[], anomalyDate: string } => {
    const data: CostData[] = [];
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    // Anomaly will be roughly 7 days before the end date, if possible
    const anomalyDayOffset = Math.max(diffDays - 7, 2);
    const anomalyDateObj = new Date(start);
    anomalyDateObj.setDate(anomalyDateObj.getDate() + anomalyDayOffset - 1);
    const anomalyDate = anomalyDateObj.toISOString().split('T')[0];

    for (let i = 0; i < diffDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        MOCK_SERVICES.forEach(service => {
            let cost = service.baseCost + (Math.random() - 0.5) * service.fluctuation;
            
            // Inject anomaly
            if (dateStr === anomalyDate && service.name === 'Amazon EC2') {
                cost *= 3.5; // Spike for EC2
            }
             if (dateStr === anomalyDate && service.name === 'Amazon S3') {
                cost *= 1.8; // smaller spike for S3
            }

            data.push({
                date: dateStr,
                service: service.name,
                cost: parseFloat(cost.toFixed(2)),
                region: 'us-east-1', // Mock region
            });
        });
    }
    return { detailedCostData: data, anomalyDate };
};

const aggregateData = (detailedData: CostData[], granularity: ChartGranularity): CostData[] => {
    const aggregationFormat = (date: Date): string => {
        const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // Adjust for UTC
        if (granularity === 'year') return `${d.getUTCFullYear()}-01-01`;
        if (granularity === 'month') return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-01`;
        return d.toISOString().split('T')[0];
    };

    const aggregated = detailedData.reduce((acc, item) => {
        const key = aggregationFormat(new Date(item.date));
        if (!acc[key]) {
            acc[key] = { date: key, cost: 0, service: 'Total', region: 'N/A' };
        }
        acc[key].cost += item.cost;
        return acc;
    }, {} as Record<string, CostData>);

    return Object.values(aggregated)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({ ...item, cost: parseFloat(item.cost.toFixed(2)) }));
};

const generateMockAnalysisData = (startDate: string, endDate: string, granularity: ChartGranularity): AnalysisData => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate detailed cost data
    const data = generateMockDetailedData(start, end);
    
    // Create anomalies from the detailed data
    const anomaliesByDate: Record<string, { cost: number, services: Set<string> }> = {};
    
    data.detailedCostData.forEach(item => {
        if (!anomaliesByDate[item.date]) {
            anomaliesByDate[item.date] = { cost: 0, services: new Set() };
        }
        anomaliesByDate[item.date].cost += item.cost;
        anomaliesByDate[item.date].services.add(item.service);
    });

    // Filter for significant anomalies (cost > $1)
    const significantAnomalies = Object.entries(anomaliesByDate)
        .filter(([_, aggr]) => aggr.cost > 1)
        .slice(0, 5); // Limit to 5 anomalies

    const anomalies: Anomaly[] = significantAnomalies.map(([date, aggr]) => {
        const totalCost = aggr.cost;
        const expectedCost = totalCost * 0.6; // Create a plausible expected cost
        const services = Array.from(aggr.services).slice(0, 2).join(', ');
        return {
            date,
            cost: parseFloat(totalCost.toFixed(2)),
            expectedCost: parseFloat(expectedCost.toFixed(2)),
            description: `Unusually high spend of $${totalCost.toFixed(2)} detected on ${services}${aggr.services.size > 2 ? ' and others' : ''}. Forecast was $${expectedCost.toFixed(2)}.`
        };
    });

    const costData = aggregateData(data.detailedCostData, granularity);

    return {
        detailedCostData: data.detailedCostData,
        costData: costData,
        anomalies: anomalies
    };
};

// --- API FETCHING ---

export const fetchAnalysisData = async (provider: CloudProvider, startDate: string, endDate: string, granularity: ChartGranularity): Promise<AnalysisData> => {
    console.log("Provider: ",provider);
    if (provider === 'mock') {
        // Simulate network delay for a more realistic demo
        await new Promise(resolve => setTimeout(resolve, 600));
        return Promise.resolve(generateMockAnalysisData(startDate, endDate, granularity));
    }
    
    try {
        // Use local Python API for non-mock providers
        const response = await fetch(`https://cloud-cost-explorer.onrender.com/analysis?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Origin': 'https://cloud-cost-explorer.onrender.com'
            },
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error("Error fetching analysis data:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown network error occurred while fetching analysis data.");
    }
};
