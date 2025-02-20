"use client";

import { useState, useEffect } from "react";
import { fetchAsJson } from "../utils/fetchData";
import "chart.js/auto";
import {CombinedBarLineForecastAndHistChart_2,CombinedBarLineForecastAndHistChartOperational} from "../utils/prepareCharts";
import {splitAndSortLTSData,findLatestEntryst,splitStEntry,filterShortTermData,splitAndSortSTData} from "../utils/prepareData";
import {Battery} from "../utils/prepareTable";


export default function Home() {
  const [lt_data, setLtData] = useState<Record<string, any> | null>(null);
  const [loadingLT, setLoadingLT] = useState(true);
  const [loadingST, setLoadingST] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [st_data,set_st_data] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const fetchLTData = () => {
      fetchAsJson(true)
        .then((jsonData) => {
          setLtData(jsonData);
          setLoadingLT(false);
        })
        .catch((err) => {
          setError(err.message);
        });
    };
  
    // Initial fetch
    fetchLTData();
  
    // Refresh every 60 seconds (60000 ms)
    const intervalId = setInterval(fetchLTData, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    const fetchSTData = () => {
      fetchAsJson(false)
        .then((jsonData) => {
          set_st_data(jsonData);
          setLoadingST(false);
        })
        .catch((err) => {
          setError(err.message);
        });
    };
  
    // Initial fetch
    fetchSTData();
  
    // Refresh every 60 seconds (60000 ms)
    const intervalId = setInterval(fetchSTData, 60000);
    return () => clearInterval(intervalId);
  }, []);
  


  const [labelsLT, price,SI,netDischarge,soc] = splitAndSortLTSData(lt_data || {});
  
  const latestEntryST = findLatestEntryst(st_data || {} )
  const [labels_fc,price_fc,si_fc,net_dc_fc,soc_fc,quantiles] = splitStEntry(latestEntryST)


  const stNeeded = filterShortTermData(st_data,lt_data)
  const [labelsLTMissing, priceMissing,SIMissing,netDischargeMissing,socMissing] = splitAndSortSTData(stNeeded || {});
  // console.log(priceMissing)

  const decision = net_dc_fc[0] > 0.01 ? "Discharge" : net_dc_fc[0] < -0.01 ? "Charge" : "Wait";
  const battery_level  = soc_fc?.[0] ?? 0;
  const currentQH = labels_fc?.[0] instanceof Date 
  ? labels_fc[0].toLocaleString("en-GB", { hour12: false })  // Adjust format as needed
  : labels_fc?.[0] ?? "N/A";
  const thisQHPrice = Math.round(price_fc?.[0] ?? 0);
  return (
    <div className="p-8">
      {loadingLT && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
  
      {/* Flexbox for Side-by-Side Layout */}
      <div className="flex gap-8">
        {/* Charts Section */}
        <div className="flex-1 flex flex-col gap-4" style={{ minHeight: "100px",maxWidth: "600px" }}>
          {st_data && (
            <CombinedBarLineForecastAndHistChart_2
              title={"Price and SI"}
              x_labels={[...labelsLT,...labelsLTMissing]}
              x_labels_fc={labels_fc}
              barData={[...SI,...SIMissing]}
              lineData={[...price,...priceMissing]}
              lineDataFc={price_fc}
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
              x_labels={[...labelsLT,...labelsLTMissing]}
              x_labels_fc={labels_fc}
              barData={[...netDischarge,...netDischargeMissing]}
              lineData={[...soc,...socMissing]}
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
        <div className="flex items-center" style={{ height: "800px" }}>
          <Battery level={battery_level} currentQH = {currentQH} priceForecast={thisQHPrice} decision={decision} lt_data = {lt_data}/>
        </div>
      </div>
    </div>
  );
}