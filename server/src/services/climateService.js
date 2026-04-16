// server/src/services/climateService.js
const axios = require('axios');

//  Fetch Historical Weather Data (What happened?)
const getHistoricalWeather = async (lat, lon) => {
    try {
        const url = `https://archive-api.open-meteo.com/v1/archive`;
        const response = await axios.get(url, {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: '2010-01-01', // 10 years of data
                end_date: '2020-12-31',
                daily: 'temperature_2m_max,precipitation_sum',
                timezone: 'auto'
            }
        });
        return response.data.daily;
    } catch (error) {
        console.error("Error fetching history:", error.message);
        return null;
    }
};

// 2. Fetch Future (What WILL happen? - CMIP6 Model)
const getFutureClimate = async (lat, lon) => {
    try {
        // Using the Climate Change API (Projections to 2050)
        const url = `https://climate-api.open-meteo.com/v1/climate`;
        const response = await axios.get(url, {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: '2040-01-01',
                end_date: '2050-12-31',
                models: 'MRI_AGCM3_2_S', // Standard climate model
                daily: 'temperature_2m_max,precipitation_sum',
                timezone: 'auto'
            }
        });
        return response.data.daily;
    } catch (error) {
        console.error("Error fetching future:", error.message);
        return null;
    }
};

// 3. Calculate the Difference (The "Delta")
const calculateImpact = (history, future) => {
    // Helper to get average of an array
    const getAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const historicalAvgTemp = getAvg(history.temperature_2m_max);
    const futureAvgTemp = getAvg(future.temperature_2m_max);
    
    const historicalRain = getAvg(history.precipitation_sum);
    const futureRain = getAvg(future.precipitation_sum);

    return {
        temp_increase: (futureAvgTemp - historicalAvgTemp).toFixed(1), // e.g., "+2.1"
        rain_change_pct: (((futureRain - historicalRain) / historicalRain) * 100).toFixed(0), // e.g., "+15%"
        raw_stats: {
            past_temp: historicalAvgTemp.toFixed(1),
            future_temp: futureAvgTemp.toFixed(1)
        }
    };
};

if (require.main === module) {
    (async () => {
        console.log("Fetching Data for Mumbai...");

        // 1. Get Data
        const past = await getHistoricalWeather(19.07, 72.87);
        const future = await getFutureClimate(19.07, 72.87);

        // 2. Analyze
        if (past && future) {
            const impact = calculateImpact(past, future);
            console.log("✅ SUCCESS! Calculated Impact:");
            console.table(impact);
        } else {
            console.log("❌ Failed to fetch data.");
        }
    })();
}

module.exports = { getHistoricalWeather, getFutureClimate, calculateImpact };
