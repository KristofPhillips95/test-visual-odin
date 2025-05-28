"use client";

import { useState, useEffect } from "react";
import { fetchAsJson } from "../utils/fetchData";
import "chart.js/auto";
import {
  CombinedBarLineForecastAndHistChart_2,
  CombinedBarLineForecastAndHistChartOperational,
} from "../utils/prepareCharts";
import {
  splitAndSortLTSData,
  findLatestEntryst,
  splitStEntry,
  filterShortTermData,
  splitAndSortSTData,
} from "../utils/prepareData";
import { Battery } from "../utils/prepareTable";
import { StDataEntry, LtDataEntry } from "../types/dataTypes";

export default function Home() {
  const [lt_data, setLtData] = useState<LtDataEntry[] | null>(null);
  const [loadingLT, setLoadingLT] = useState(true);
  const [loadingST, setLoadingST] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [st_data, set_st_data] = useState<StDataEntry[] | null>(null);

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
    const intervalId = setInterval(fetchSTData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const [labelsLT, price, SI, netDischarge, soc] = splitAndSortLTSData(lt_data || []);
  const latestEntryST = findLatestEntryst(st_data || []);
  const [labels_fc, price_fc, si_fc, net_dc_fc, soc_fc, quantiles] = splitStEntry(latestEntryST);
  const stNeeded = filterShortTermData(st_data, lt_data);
  const [labelsLTMissing, priceMissing, SIMissing, netDischargeMissing, socMissing] =
    splitAndSortSTData(stNeeded || []);

  const decision = net_dc_fc[0] > 0.01 ? "Discharge" : net_dc_fc[0] < -0.01 ? "Charge" : "Wait";
  const battery_level = (soc_fc?.[0] ?? 0) / 2;
  const currentQH =
    labels_fc?.[0] instanceof Date
      ? labels_fc[0].toLocaleString("en-GB", { hour12: false })
      : labels_fc?.[0] ?? "N/A";
  const thisQHPrice = Math.round(price_fc?.[0] ?? 0);

  return (
    <div className="p-4 md:p-8">
      {(loadingLT || loadingST) && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Charts Section */}
        <div className="flex-1 flex flex-col gap-4 max-w-full lg:max-w-[600px]">
          {st_data && (
            <CombinedBarLineForecastAndHistChart_2
              title={"Price and SI"}
              x_labels={[...labelsLT, ...labelsLTMissing]}
              x_labels_fc={labels_fc}
              barData={[...SI, ...SIMissing]}
              lineData={[...price, ...priceMissing]}
              lineDataFc={price_fc}
              shadedData1={si_fc}
              quantiles={quantiles}
              price_label="Imbalance price (€/MWh)"
              si_label="SI (MW)"
              price_color="rgb(75,192,192)"
              si_color="rgb(208, 105, 20)"
            />
          )}

          {st_data && (
            <CombinedBarLineForecastAndHistChartOperational
              title={"Operational Decisions"}
              x_labels={[...labelsLT, ...labelsLTMissing]}
              x_labels_fc={labels_fc}
              barData={[...netDischarge, ...netDischargeMissing, ...net_dc_fc.slice(0, 1)]}
              lineData={[...soc, ...socMissing, ...soc_fc.slice(0, 1)]}
              lineDataFc={soc_fc.slice(1)}
              shadedData1={net_dc_fc.slice(1)}
              price_label="SOC (MWh)"
              si_label="Net Discharge (MWh)"
              soc_color="rgb(83,205,205)"
              netDis_color="rgb(39, 20, 208)"
            />
          )}
        </div>

        {/* Battery Component */}
        <div className="flex justify-center items-center w-full lg:w-auto">
          <Battery
            level={battery_level}
            currentQH={currentQH}
            priceForecast={thisQHPrice}
            decision={decision}
            lt_data={lt_data}
          />
        </div>
      </div>
    </div>
  );
}
