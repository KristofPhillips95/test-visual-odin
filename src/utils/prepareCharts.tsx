import { Chart } from "react-chartjs-2";
import "chart.js/auto";
import { DateTime } from "luxon";
import {ChartData,ChartDataset,ChartOptions, ChartTypeRegistry} from "chart.js"

function formatTimeLabels(labels: string[]) {
  // Convert UTC timestamps to Europe/Brussels and format them
  return labels.map((timestamp) =>
    DateTime.fromISO(timestamp, { zone: "utc" })
      .setZone("Europe/Brussels")
      .toFormat("HH:mm")
  );
}
// function shadedFCDatasets(
//   quantiles: number[],
//   shadedData1: number[][],
//   historicalLength: number
// ) {
//   const groupLabel = "SI Forecast Uncertainty";
//   // Create quantile datasets (these won't have their own legend entry)
//   const shadedDatasets = quantiles.slice(0, -1).map((q, i) => ({
//     type: "line",
//     label: "", // No individual label
//     group: groupLabel, // Add a custom group property
//     data: Array(historicalLength).fill(null).concat(shadedData1[i]),
//     borderColor: "rgba(0, 0, 0, 0)",
//     // Adjust opacity scaling as desired
//     backgroundColor: `rgba(0, 0, 255, ${1.5 * (quantiles[i + 1] - quantiles[i])})`,
//     fill: "-1", // Fill toward the next dataset
//     yAxisID: "y2",
//     hidden: false,
//     pointRadius: 0,      // Remove the dots
//     pointHoverRadius: 0, // Remove hover dots
//   }));

//   // Create a dummy dataset for the legend (this is the one that appears in the legend)
//   const legendDataset = {
//     type: "line",
//     label: groupLabel,
//     group: groupLabel,
//     data: Array(historicalLength).fill(null), // No actual data plotted
//     borderColor: "rgba(0, 0, 0, 0)",
//     backgroundColor: "rgba(0, 0, 255, 0.3)",
//     fill: true,
//     yAxisID: "y2",
//     hidden: false,
//   };

//   // Return the legend dataset first, then all the quantile datasets.
//   return [legendDataset, ...shadedDatasets];
// }

function shadedFCBarDatasets(
  quantiles: number[],
  // Here, shadedData1 is an array where each element is a time series for a specific forecast quantile.
  // For example, shadedData1[0] are forecast values for quantile q0,
  // shadedData1[1] for quantile q1, and so on.
  shadedData1: number[][], 
  historicalLength: number,
  si_color: string
) {
  const groupLabel = "SI Forecast";
  const datasets = quantiles.slice(0, -1).map((q, i) => {
    // For each quantile interval, build the floating bar data:
    // For forecast times, each data point is [lower, upper] where:
    //   lower = forecast value for quantile i, and
    //   upper = forecast value for quantile i+1.
    const forecastData = shadedData1[i].map((lower, idx) => {
      const upper = shadedData1[i + 1][idx];
      return [lower, upper];
    });
    // Prepend historical values as null so that bars appear only in forecast times:
    const data = Array(historicalLength).fill(null).concat(forecastData);
    // Use a scaling factor (here, 1.5) similar to your opacity computation:
    const opacity =3 * (quantiles[i + 1] - quantiles[i]);
    return {
      type: "bar",
      label: "", // hide individual legend entry
      group: groupLabel, // assign to the group
      data,
      backgroundColor: adjustOpacity(si_color,opacity),
      borderColor: si_color,
      yAxisID: "y2",
      // Force all bars into the same stack so that they overlap:
      stack: groupLabel,
      // Optionally control bar width (adjust these as needed):
      barPercentage: 1,
      categoryPercentage: 1,
      barThickness: 5,
    } as CustomChartDataset<"bar">;
  });

  // Create a dummy dataset that will serve as the single legend item:
  const legendDataset = {
    type: "bar",
    label: groupLabel,
    group: groupLabel,
    data: Array(historicalLength).fill(null), // no actual data needed here
    backgroundColor: adjustOpacity(si_color,0.3),
    borderColor: si_color,
    yAxisID: "y2",
    stack: groupLabel,
  };

  return [legendDataset, ...datasets];
}

export function CombinedBarLineForecastAndHistChart_2({
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
  x_labels_fc: string[] | Date[];
  lineData: number[];
  lineDataFc: number[];
  barData: number[];
  shadedData1: number[][]; // each element is a time series (for one quantile band)
  quantiles: number[];
  price_label: string;
  si_label: string;
  price_color: string;
  si_color: string;
}) {
  const cleanedLabels = [...x_labels, ...x_labels_fc].map((label) =>
    label instanceof Date ? label.toISOString() : label
  );
  const formattedLabels = formatTimeLabels(cleanedLabels);
  // Helper to filter out NaNs before computing min/max
  const filterNaN = (arr: number[]) => arr.filter((v) => !isNaN(v));
  // Calculate axis ranges
  const maxAbsValue_si = Math.max(
    Math.abs(Math.min(...filterNaN(barData), 0)),
    Math.abs(Math.max(...filterNaN(barData), 0)),
    Math.abs(Math.min(...filterNaN(shadedData1.flat()), 0)),
    Math.abs(Math.max(...filterNaN(shadedData1.flat()), 0))
  );


  const maxAbsValue_price = Math.max(
    Math.abs(Math.min(...filterNaN(lineData), 0)),
    Math.abs(Math.max(...filterNaN(lineData), 0)),
    Math.abs(Math.min(...filterNaN(lineDataFc), 0)),
    Math.abs(Math.max(...filterNaN(lineDataFc), 0)),
  );

    const roundUpDynamic = (value) => {
      if (value === 0) return 0; // Edge case: if value is 0, no rounding needed
    
      const magnitude = Math.pow(10, Math.floor(Math.log10(value))); // Get the power of 10
      const factor = value / magnitude; // Normalize value to a 1-10 range
    
      let rounded;
      if (factor <= 2) {
        rounded = 2 * magnitude;
      } else if (factor <= 4) {
        rounded = 4 * magnitude;
      }
      else if (factor <= 6) {
        rounded = 6 * magnitude;
      } 
      else if (factor <= 8) {
        rounded = 8 * magnitude;
      } 
      else {
        rounded = 10 * magnitude;
      }
    
      return rounded;
    };
    console.log("maxAbsValue_price", maxAbsValue_price);
    const maxPrice = roundUpDynamic(maxAbsValue_price);
    console.log("maxPrice", maxPrice);
    const maxSi = roundUpDynamic(maxAbsValue_si);

  
    const datasetsHist: CustomChartDataset<"bar" | "line">[] = [
    {
      type: "line" as const,
      label: price_label,
      data: lineData,
      borderColor: price_color,
      backgroundColor: price_color,
      yAxisID: "y1",
    },
    {
      type: "line" as const,
      label: "Imbalance price forecast",
      data: new Array(lineData.length).fill(null).concat(lineDataFc),
      borderColor: adjustOpacity(price_color,0.6),
      backgroundColor: adjustOpacity(price_color,0.6),
      yAxisID: "y1",
    },
    {
      type: "bar" as const,
      label: si_label,
      data: barData,
      backgroundColor: si_color,
      borderColor: `${si_color}80`,
      yAxisID: "y2",
    },
  ];
  // console.log(lineDataFc)

  // console.log(new Array(lineData.length).fill(null).concat(lineDataFc))
  const shadedForecastchartDatasets = shadedFCBarDatasets(
    quantiles,
    shadedData1,
    lineData.length,
    si_color
  );
  const chartData:ChartData<"bar"| "line"> = {
    labels: formattedLabels,
    datasets: [...datasetsHist, ...shadedForecastchartDatasets] as CustomChartDataset<"bar" | "line">[],
  };

  const options: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        ticks: { maxTicksLimit: 12 },
      },
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: price_label },
        min: -maxPrice,
        max: maxPrice,
      },
      y2: {
        stacked: false,
        type: "linear",
        position: "right",
        title: { display: true, text: si_label },
        min: -maxSi,
        max: maxSi,
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        labels: {
          filter: (legendItem) => {
            // Only include legend items that have a non-empty label.
            return legendItem.text !== "";
          },
        },
        // Custom onClick for group toggling remains unchanged.
        onClick: function (e, legendItem, legend) {
          const chart = legend.chart;
          const dsIndex = legendItem.datasetIndex;
          const ds = chart.data.datasets[dsIndex] as CustomChartDataset<"bar"|"line">;
          const meta = chart.getDatasetMeta(dsIndex);
        
          // If the dataset doesn't belong to a group, toggle it normally.
          if (!ds.group) {
            meta.hidden = meta.hidden === null ? !chart.data.datasets[dsIndex].hidden  : !meta.hidden;
          } else {
            // For grouped datasets, toggle every dataset in the same group.
            const groupLabel = ds.group;
            chart.data.datasets.forEach((dataset, index) => {
              const datasetWithGroup = dataset as Partial<CustomChartDataset<"bar" | "line">>;
              if (datasetWithGroup.group === groupLabel) {
                const datasetMeta = chart.getDatasetMeta(index);
                datasetMeta.hidden = datasetMeta.hidden === null
                  ? !chart.data.datasets[index].hidden
                  : !datasetMeta.hidden;
              }
            });
          }
          chart.update();
        }
      },
    },
    devicePixelRatio: 2
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}

type CustomChartDataset<T extends keyof ChartTypeRegistry> = ChartDataset<T> & {
  group?: string;
};

export function CombinedBarLineForecastAndHistChartOperational({
  title,
  x_labels,
  x_labels_fc,
  lineData,
  lineDataFc,
  barData,
  shadedData1,
  price_label,
  si_label,
  soc_color,
  netDis_color,
}: {
  title: string;
  x_labels: string[];
  x_labels_fc: string[]|Date[];
  lineData: number[];
  lineDataFc: number[];
  barData: number[];
  shadedData1: number[]; // each element is a time series (for one quantile band)
  price_label: string;
  si_label: string;
  soc_color: string;
  netDis_color: string;
}) {
  const cleanedLabels = [...x_labels, ...x_labels_fc].map((label) =>
    label instanceof Date ? label.toISOString() : label
  );
  const formattedLabels = formatTimeLabels(cleanedLabels);

  const datasetsHist = [
    {
      type: "line",
      label: price_label,
      data: lineData,
      borderColor: soc_color,
      backgroundColor: soc_color,
      yAxisID: "y1",
    },
    {
      type: "line",
      label: "SOC forecast",
      data: new Array(lineData.length).fill(null).concat(lineDataFc),
      borderColor:  adjustOpacity(soc_color,0.3),
      backgroundColor: adjustOpacity(soc_color,0.3),
      yAxisID: "y1",
    },
    {
      type: "bar",
      label: si_label,
      data: barData,
      backgroundColor: netDis_color,
      borderColor: `${netDis_color}80`,
      yAxisID: "y2",
    },
    {
      type: "bar",
      label: "Net discharge forecast",
      data: new Array(lineData.length).fill(null).concat(shadedData1),
      backgroundColor: adjustOpacity(netDis_color,0.3),
      borderColor: adjustOpacity(netDis_color,0.1),
      yAxisID: "y2",
    },
  ];

  const chartData:ChartData<"bar"| "line">  = {
    labels: formattedLabels,
    datasets: datasetsHist as ChartDataset<"bar"| "line">[],
  };

  const options: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        ticks: { maxTicksLimit: 12 },
      },
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: price_label },
        suggestedMin: -2.5,
        suggestedMax: 2.5,
      },
      y2: {
        stacked: false,
        type: "linear",
        position: "right",
        title: { display: true, text: si_label },
        suggestedMin: -0.25,
        suggestedMax: 0.25,
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
      },
    },
    devicePixelRatio: 2
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}

function adjustOpacity(rgbColor: string, alpha:number) {
  return rgbColor.replace("rgb", "rgba").replace(")", `, ${alpha})`);
};
