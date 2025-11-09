import React from 'react';
import { Bar, Line } from 'recharts';

/**
 * A component to dynamically render Bar or Line series for a Recharts chart.
 * @param {string} chartType - The type of chart to render ('bar' or 'line').
 * @param {Array<object>} data - The dataset for the chart.
 * @param {object} colorMapping - An object mapping data keys to color values.
 */
const ChartSeries = ({ chartType, data, colorMapping }) => {
  const seriesKeys = Object.keys(colorMapping);

  if (chartType === 'line') {
    return seriesKeys.map(key => (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        name={key.charAt(0).toUpperCase() + key.slice(1)}
        stroke={colorMapping[key]}
        strokeWidth={2}
      />
    ));
  }

  // Default to 'bar'
  return seriesKeys
    .filter(key => data.some(d => d && d[key] > 0)) // Only render bars if data exists for them
    .map(key => (
      <Bar key={key} dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={colorMapping[key]} />
    ));
};

export default ChartSeries;
