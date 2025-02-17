export function ImbaChart({
    title,
    x_labels,
    price_data,
    si_data,
    price_label,
    si_label,
    price_color,
    si_color,
  }: {
    title: string;
    x_labels: string[];
    price_data: number[];
    si_data: number[];
    price_label: string;
    si_label: string;
    price_color: string;
    si_color: string;
  }) {
  
    const formattedLabels = formatTimeLabels(x_labels)
    // Find the absolute max value to ensure symmetry
    const maxAbsValue_si = Math.max(
      Math.abs(Math.min(...si_data, 0)),
      Math.abs(Math.max(...si_data, 0))
    );
    // console.log(price_data)
    const maxAbsValue_price = Math.max(
      Math.abs(Math.min(...price_data, 0)),
      Math.abs(Math.max(...price_data, 0)),
    );
    const chartData = {
      labels: formattedLabels,
      datasets: [
        {
          type: "line",
          label: price_label,
          data: price_data,
          borderColor: price_color,
          backgroundColor: `${price_color}40`,
          yAxisID: "y1",
        },
        {
          type: "bar",
          label: si_label,
          data: si_data,
          backgroundColor: si_color,
          borderColor: `${si_color}80`,
          yAxisID: "y2",
        },
      ],
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
          suggestedMin: -maxAbsValue_price, // Ensure zero is in the center
          suggestedMax: maxAbsValue_price,
        },
        y2: {
          type: "linear",
          position: "right",
          title: { display: true, text: si_label },
          suggestedMin: -maxAbsValue_si, // Ensure zero is in the center
          suggestedMax: maxAbsValue_si,
          grid: { drawOnChartArea: false }, // Prevent overlapping grid lines
        },
      },
    };
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold">{title}</h2>
        <Chart type="bar" data={chartData} options={options} />
      </div>
    );
  }
  
  
  
  export function SingleLineChart({
    title,
    x_labels,
    data,
    label,
    color,
  }: {
    title: string;
    x_labels: string[];
    data: number[];
    label: string;
    color: string;
  }) {
    const chartData = {
      labels: x_labels,
      datasets: [
        {
          label,
          data,
          fill: false,
          backgroundColor: `${color}40`, // Transparent fill color
          borderColor: color, // Solid border color
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 12, // Limits the number of ticks (labels) displayed on the x-axis
          },
          // Optional: You can customize other aspects of the x-axis here as well, like the step size, angle, etc.
        },
      },
    };
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold">{title}</h2>
        <Line data={chartData} options={chartOptions} />
      </div>
    );
  }
  
  
  export function MultiLineChart({
    title,
    x_labels,
    data_lists,
    labels_list,
    colors_list,
  }: {
    title: string;
    x_labels: string[];
    data_lists: number[][];
    labels_list: string[];
    colors_list: string[];
  }) {
    const datasets = data_lists.map((data, index) => ({
      label: labels_list[index],
      data,
      fill: false,
      backgroundColor: `${colors_list[index]}40`, // Transparent fill color
      borderColor: colors_list[index], // Solid border color
    }));
  
    const chartData = {
      labels: x_labels,
      datasets,
    };
  
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold">{title}</h2>
        <Line data={chartData} />
      </div>
    );
  }
  