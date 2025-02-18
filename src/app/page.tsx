"use client";

import { useState, useEffect } from "react";
import { fetchAsJson } from "../utils/fetchData";
import "chart.js/auto";
import {CombinedBarLineForecastAndHistChart_2,CombinedBarLineForecastAndHistChartOperational,DynamicTable} from "../utils/prepareCharts";
import {splitAndSortLTSData,findLatestEntryst,splitStEntry,findUnknownTimes} from "../utils/prepareData";
import {Battery} from "../utils/prepareTable";


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
  const battery_level  =soc_fc[0]
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">API Data Fetching Example</h1>
      {loadingLT && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
  
      {/* Flexbox for Side-by-Side Layout */}
      <div className="flex gap-8">
        {/* Charts Section */}
        <div className="flex-1 flex flex-col gap-4" style={{ minHeight: "100px",maxWidth: "800px" }}>
          {st_data && (
            <CombinedBarLineForecastAndHistChart_2
              title={"Price and SI"}
              x_labels={labelsLT}
              x_labels_fc={labels_fc}
              barData={SI}
              lineData={price}
              lineDataFc={price}
              shadedData1={si_fc}
              quantiles={quantiles}
              price_label="Imbalance price (Euro/MWh)"
              si_label="System Imbalance (MW)"
              price_color="rgb(75,192,192)"
              si_color="rgb(208, 105, 20)"
            />
          )}
  
          {st_data && (
            <CombinedBarLineForecastAndHistChartOperational
              title={"Operational Decisions"}
              x_labels={labelsLT}
              x_labels_fc={labels_fc}
              barData={netDischarge}
              lineData={soc}
              lineDataFc={soc_fc}
              shadedData1={net_dc_fc}
              price_label="SOC (MWh)"
              si_label="Net Discharge (MW)"
              soc_color="rgb(19, 172, 27)"
              netDis_color="rgb(39, 20, 208)"
            />
          )}
        </div>
  
        {/* Battery Component - Same Height as Charts */}
        <div className="flex items-center" style={{ height: "1000px" }}>
          <Battery level={battery_level*100} />
        </div>
      </div>
    </div>
  );
}