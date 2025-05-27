import { LtDataEntry } from "@/types/dataTypes";
import React from "react";

interface BatteryProps {
  level: number;
  currentQH: string;
  priceForecast: number;
  decision: string;
  lt_data: LtDataEntry[];
}

function sortEntriesAndReturnXlatest(json: LtDataEntry[], x: number) {
  if (!Array.isArray(json)) return [];

  return json
    .map((value) => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: value?.Imb_price ?? NaN,
      net_discharge: value?.fw_net_discharge ?? NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime())
    .slice(-x);
}

function findRevenue(json: LtDataEntry[], x: number) {
  const data = sortEntriesAndReturnXlatest(json, x);
  return Math.round(
    data
      .filter((entry) => entry.net_discharge > 0.1)
      .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  );
}

function findCost(json: LtDataEntry[], x: number) {
  const data = sortEntriesAndReturnXlatest(json, x);
  return Math.round(
    data
      .filter((entry) => entry.net_discharge < -0.1)
      .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  );
}

function findProfit(json: LtDataEntry[], x: number) {
  return findRevenue(json, x) + findCost(json, x);
}

function findNBCycles(json: LtDataEntry[], x: number, PERatio = 1 / 2) {
  const data = sortEntriesAndReturnXlatest(json, x);
  const nb_cycles =
    (data.filter((entry) => entry.net_discharge > 0.1).length +
      data.filter((entry) => entry.net_discharge < -0.1).length) /
    (2 * 4) *
    PERatio;
  return nb_cycles.toFixed(2);
}

export function Battery({
  level,
  currentQH,
  priceForecast,
  decision,
  lt_data,
}: BatteryProps) {
  const levelPercentage = level * 100;

  const getColorGradient = (percent: number) => {
    if (percent > 50)
      return "linear-gradient(to top, rgba(83,205,205, 1), rgba(83,205,205, 0.5))";
    if (percent > 20)
      return "linear-gradient(to top, rgba(255, 174, 0, 1), rgba(255, 174, 0, 0.5))";
    return "linear-gradient(to top, rgba(255, 0, 0, 1), rgba(255, 0, 0, 0.5))";
  };

  const lbs = [6*4,24 * 4,]// 7 * 24 * 4];
  const lookbackData = [
    {
      lookback: "6h",
      profit: findProfit(lt_data, lbs[0]),
      nbCycles: findNBCycles(lt_data, lbs[0]),
    },
    {
      lookback: "1d",
      profit: findProfit(lt_data, lbs[1]),
      nbCycles: findNBCycles(lt_data, lbs[1]),
    },
    // {
    //   lookback: "1w",
    //   profit: findProfit(lt_data, lbs[1]),
    //   nbCycles: findNBCycles(lt_data, lbs[1]),
    // },
  ];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Battery Cap */}
      <div
        style={{
          width: "80px",
          height: "30px",
          background: "black",
          borderRadius: "10px",
          position: "absolute",
          top: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
          zIndex: 10,
        }}
      />

      {/* Battery Container */}
      <div
        style={{
          width: "300px",
          height: "450px",
          border: "6px solid #222",
          borderRadius: "40px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#e4e4e4",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* Battery Fill */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: `${levelPercentage}%`,
            background: getColorGradient(levelPercentage),
            transition: "height 0.4s ease-in-out",
          }}
        />

        {/* Battery Info */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: "18px",
            padding: "16px",
            width: "80%",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <tbody>
    <tr>
      <td colSpan={2}>
        <div
          style={{
            backgroundColor: "#f3f3f3",
            borderRadius: "10px",
            padding: "8px",
            marginBottom: "12px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={cellStyleSmall}></th>
                {lookbackData.map(({ lookback }) => (
                  <th style={cellStyleSmall} key={lookback}>
                    {lookback}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cellStyleSmallStrong}>Profit (€)</td>
                {lookbackData.map(({ lookback, profit }) => (
                  <td style={cellStyleSmallStrong} key={lookback}>
                    {profit}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={cellStyleSmallStrong}>Cycles</td>
                {lookbackData.map(({ lookback, nbCycles }) => (
                  <td style={cellStyleSmallStrong} key={lookback}>
                    {nbCycles}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
    <tr>
      <td style={cellStyleSmall}>Current quarter</td>
      {/* <td style={cellStyleSmall}>{currentQH}</td> */}
      <td style={cellStyleSmall}>21/05/2025, 15:15</td>

    </tr>
    <tr>
      <td style={cellStyleSmall}>Price forecast</td>
      <td style={cellStyleSmall}>{priceForecast} €/MWh</td>
    </tr>
    <tr>
      <td style={cellStyleSmall}>Decision</td>
      <td style={cellStyleSmall}>{decision}</td>
    </tr>
  </tbody>
</table>

        </div>
      </div>
    </div>
  );
}

// Styling
const cellStyle: React.CSSProperties = {
  padding: "6px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "14px",
};

const cellStyleSmall: React.CSSProperties = {
  padding: "6px",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: 500,
};
const cellStyleSmallStrong: React.CSSProperties = {
  padding: "8px",
  textAlign: "center",
  fontSize: "15px",
  fontWeight: 700,
};