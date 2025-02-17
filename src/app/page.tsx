"use client";

import { useState, useEffect } from "react";
import { fetchAsJson } from "../utils/fetchData";
import "chart.js/auto";
import {CombinedBarLineForecastAndHistChart,CombinedBarLineForecastAndHistChart_2,CombinedBarLineForecastAndHistChartOperational} from "../utils/prepareCharts";
import {splitAndSortLTSData,findLatestEntryst,splitStEntry,findUnknownTimes} from "../utils/prepareData";

export default function Home() {
  const [lt_data, setLtData] = useState<Record<string, any> | null>(null);
  const [loadingLT, setLoadingLT] = useState(true);
  const [loadingST, setLoadingST] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [st_data,set_st_data] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetchAsJson(true)
      .then((jsonData) => setLtData(jsonData))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingLT(false));
  }, []);

  useEffect(() => {
    fetchAsJson(false)
      .then((jsonData) => set_st_data(jsonData))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingST(false));
  }, []);


  const [labelsLT, price,SI,netDischarge,soc] = splitAndSortLTSData(lt_data || {});
  
  const latestEntryST = findLatestEntryst(st_data || {} )
  const [labels_fc,price_fc,si_fc,net_dc_fc,soc_fc,quantiles] = splitStEntry(latestEntryST)
  // const unkown_times = findLatestEntryLt(labelsLT,latestEntryST)

  // console.log(latestEntryST)
  // console.log(labelsLT)
  // console.log(labels_fc)
  // console.log(entry)
  
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">API Data Fetching Example</h1>
      {loadingLT && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {/* {lt_data && <ImbaChart title ={"Imbalance price"} x_labels={labelsLT} si_data={SI} price_data={price} price_label = "Imbalance price" si_label = "SI" price_color = "rgba(75,192,192,1)" si_color = "rgb(208, 105, 20)" />} */}
      {/* {lt_data && <ImbaChart title ={"Operational decisions"} x_labels={labelsLT} si_data={netDischarge} price_data={soc} price_label = "SOC" si_label = "Net Discharge" price_color = "rgb(17, 18, 18)" si_color = "rgb(39, 20, 208)" />} */}
      {/* {st_data && <ImbaChart title ={"Price forecast"} x_labels={labels_fc} si_data={net_dc_fc} price_data={price_fc} price_label = "SOC" si_label = "Net Discharge" price_color = "rgb(17, 18, 18)" si_color = "rgb(39, 20, 208)" />} */}
      {/* {st_data && <CombinedBarLineForecastAndHistChart title ={"Price and SI"} x_labels={labelsLT} x_labels_fc={labels_fc} barData={SI} lineData={price} lineDataFc={price} shadedData1={si_fc} quantiles={quantiles} price_label = "Euro/MWh" si_label = "MW" price_color =  "rgba(75,192,192,1)" si_color = "rgb(208, 105, 20)" />} */}
      {st_data && <CombinedBarLineForecastAndHistChart_2 title ={"Price and SI"} x_labels={labelsLT} x_labels_fc={labels_fc} barData={SI} lineData={price} lineDataFc={price} shadedData1={si_fc} quantiles={quantiles} price_label = "Euro/MWh" si_label = "MW" price_color =  "rgba(75,192,192,1)" si_color = "rgb(208, 105, 20)" />}

      {st_data && <CombinedBarLineForecastAndHistChartOperational title ={"Operational Decisions"} x_labels={labelsLT} x_labels_fc={labels_fc} barData={netDischarge} lineData={soc} lineDataFc={soc_fc} shadedData1={net_dc_fc} price_label = "SOC" si_label = "Net Discharge" price_color = " rgb(17, 18, 18)" si_color = "rgb(39, 20, 208)" />}
      
      {/* {lt_data && <SingleLineChart title ={"SI"} x_labels={labels} data={SI} label = "SI" color = "rgb(14, 173, 67)" />}     */}
      </div>
  );
}