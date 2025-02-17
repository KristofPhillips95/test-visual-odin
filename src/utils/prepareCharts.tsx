import { Line,Bar } from "react-chartjs-2";
import { Chart } from "react-chartjs-2";
import "chart.js/auto";
import { DateTime } from "luxon";
import { useRef,useEffect } from 'react';


function formatTimeLabels(labels:string[]){
  // Convert UTC timestamps to Europe/Brussels and format them
  const formattedLabels = labels.map((timestamp) =>
    DateTime.fromISO(timestamp, { zone: "utc" })
      .setZone("Europe/Brussels")
      .toFormat("HH:mm") // Example: "11 Feb 19:00"
    );
    return formattedLabels
  }

export function CombinedBarLineForecastAndHistChart({
  title,
  x_labels,
  x_labels_fc,
  lineData,
  lineDataFc,
  barData,
  shadedData1,
  quantiles,
  price_label,
  si_label,
  price_color,
  si_color,
}: {
  title: string;
  x_labels: string[];
  x_labels_fc: string[];
  lineData: number[];
  lineDataFc: number[];
  barData: number[];
  shadedData1:number[][],
  quantiles: number[],
  price_label: string;
  si_label: string;
  price_color: string;
  si_color: string;
}){
  // console.log(quantiles)
  const cleanedLabels = [...x_labels, ...x_labels_fc].map(label =>
    label instanceof Date ? label.toISOString() : label
  );
  
  const formattedLabels = formatTimeLabels(cleanedLabels);
    // Find the absolute max value to ensure symmetry
  const maxAbsValue_si = Math.max(
    Math.abs(Math.min(...barData, 0)),
    Math.abs(Math.max(...barData, 0))
  );
  // console.log(price_data)
  const maxAbsValue_price = Math.max(
    Math.abs(Math.min(...lineData, 0)),
    Math.abs(Math.max(...lineData, 0)),
  );
  const datasetsHist = [
    {
      type: "line",
      label: price_label,
      data: lineData,
      borderColor: price_color,
      backgroundColor: `${price_color}40`,
      yAxisID: "y1",
    },
    {
      type: "line",
      label: "Fct price",
      data: new Array(lineData.length).fill(null).concat(lineDataFc),
      borderColor: "rgba(75, 192, 192, 0.62)",
      backgroundColor: "rgba(75, 192, 192, 0)",
      yAxisID: "y1",
    },
    {
      type: "bar",
      label: si_label,
      data: barData,
      backgroundColor: si_color,
      borderColor: `${si_color}80`,
      yAxisID: "y2",
    },
  ];
  
  // Generate shaded forecast datasets with quantiles and historical data
  const shadedForecastchartDatasets = shadedFCDatasets(quantiles, shadedData1, lineData.length);
  
  const chartData = {
    labels: formattedLabels,
    datasets: [...datasetsHist, ...shadedForecastchartDatasets], // Combine all datasets
  };
  
  const options = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 12,
        },
      },
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: price_label },
        suggestedMin: -maxAbsValue_price,
        suggestedMax: maxAbsValue_price,
      },
      y2: {
        type: "linear",
        position: "right",
        title: { display: true, text: si_label },
        suggestedMin: -maxAbsValue_si,
        suggestedMax: maxAbsValue_si,
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        onClick: function (e, legendItem, legend) {
          // Custom behavior for toggling datasets, ensuring the shaded datasets are toggled
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = !meta.hidden;
          ci.update();
        },
      },
    },
  };
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <Chart type="bar" data={chartData} options={options}  />
    </div>
  );

}

function shadedFCDatasets(quantiles: number[], shadedData1: number[][], historicalLength: number) {
  const shadedDatasets = quantiles.slice(0, -1).map((q, i) => ({
    type: "line",
    label: `SI Forecast (${quantiles[i] * 100}–${quantiles[i + 1] * 100}%)`, // Proper label for each shaded area
    data: Array(historicalLength).fill(null).concat(shadedData1[i]),
    borderColor: "rgba(0, 0, 0, 0)", // Invisible line
    backgroundColor: `rgba(0, 0, 255, ${1.5 * (quantiles[i + 1] - quantiles[i])})`, // Color with opacity for shading
    fill: "-1", // Fill between this and the next quantile
    yAxisID: "y2",
    hidden: false, // Set this to 'false' to make it visible by default (can be toggled)
  }));

  // Add a dummy dataset just for the legend (this will be toggled with the rest of the shaded datasets)
  const legendDataset = {
    type: "line",
    label: "SI Forecast Uncertainty", // Single legend entry
    data: Array(historicalLength).fill(null), // Empty data, serves only as a legend item
    borderColor: "rgba(0, 0, 0, 0)", // Invisible line
    backgroundColor: "rgba(0, 0, 255, 0.3)", // Representative color for the legend
    fill: true,
    yAxisID: "y2",
    hidden: false, // Make it visible by default
  };

  // Return both the legend dataset and the shaded datasets
  return [legendDataset, ...shadedDatasets];
}
