import { LtDataEntry } from "@/types/dataTypes";
import React from "react";

interface BatteryProps {
  level: number;
}

function findRevenue(json: LtDataEntry[], x: number) {
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const dischargeRevenue =
  lastEntries
    .filter((entry) => entry.net_discharge > 0.1)
    .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  return Math.round(dischargeRevenue)
}
function findCost(json: LtDataEntry[], x: number) {
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const chargeCost =
  lastEntries
    .filter((entry) => entry.net_discharge < 0.1)
    .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  return Math.round(chargeCost)
}
function sortEntriesAndReturnXlatest(json: LtDataEntry[], x: number) {
  if (!Array.isArray(json)) {
    return []; // Return an empty array instead of `[0, 0]`
  }

  const sortedEntries = json
    .map(value => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: value?.Imb_price ?? NaN,
      net_discharge: value?.fw_net_discharge ?? NaN,
      SI: value?.SI ?? NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime());

  return sortedEntries.slice(-x); // Directly return the last `x` elements
}

function findNBCycles(json: LtDataEntry[], x: number, PERatio = 1 / 2){
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const nb_cycles =
  (lastEntries.filter((entry) => entry.net_discharge > 0.1).length +
    lastEntries.filter((entry) => entry.net_discharge < -0.1).length) /
  (2 * 4) *
  PERatio;
  return nb_cycles.toFixed(2)
}
function findAvgSpread(json: LtDataEntry[], x: number) {
  const lastEntries = sortEntriesAndReturnXlatest(json,x)

  const averagedischargeprice =
    lastEntries
      .filter((entry) => entry.net_discharge > 0.1)
      .reduce((acc, entry) => acc + entry.price, 0) /
    lastEntries.filter((entry) => entry.net_discharge > 0.1).length;

  const averagechargeprice =
    lastEntries
      .filter((entry) => entry.net_discharge < -0.1)
      .reduce((acc, entry) => acc + entry.price, 0) /
    lastEntries.filter((entry) => entry.net_discharge < -0.1).length;
    
  return Math.round(averagedischargeprice - averagechargeprice)
}

export function Battery({
  level,
  currentQH,
  priceForecast,
  decision,
  lt_data,
}: BatteryProps & {
  currentQH: string;
  priceForecast: number;
  decision: string;
  lt_data: LtDataEntry[];
}) {
  console.log(level);
  const levelPercentage = level * 50;
  const getColor = (levelPercentage: number) => {
    if (levelPercentage > 50) return "rgba(103, 190, 91, 0.75)";
    if (levelPercentage > 20) return "rgba(196, 123, 28, 0.75)";
    return "rgba(255, 0, 0, 0.75)";
  };

  // Prepare lookback data
  const lbs = [3*4,12*4,2*24*4]
  const lookbackData = [
    { lookback: "3h", totalRevenue : findRevenue(lt_data,lbs[0]), totalCost : findCost(lt_data,lbs[0]), avgSpread: findAvgSpread(lt_data,lbs[0]), nbCycles: findNBCycles(lt_data, lbs[0]) },
    { lookback: "12h",totalRevenue : findRevenue(lt_data,lbs[1]), totalCost : findCost(lt_data,lbs[1]),avgSpread: findAvgSpread(lt_data, lbs[1]), nbCycles: findNBCycles(lt_data, lbs[1]) },
    { lookback: "2d",totalRevenue : findRevenue(lt_data,lbs[2]), totalCost : findCost(lt_data,lbs[2]),avgSpread: findAvgSpread(lt_data, lbs[2]), nbCycles: findNBCycles(lt_data, lbs[2]) },
  ];


  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Battery Container */}
      <div
        style={{
          width: "300px",
          height: "450px",
          border: "6px solid black",
          borderRadius: "40px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#ddd",
        }}
      >
        {/* Battery Fill */}
        <div
          style={{
            width: "100%",
            height: `${levelPercentage}%`, // Fills from bottom to top
            backgroundColor: getColor(levelPercentage),
            position: "absolute",
            bottom: 0, // Ensures it fills upwards
            transition: "height 0.3s ease-in-out, background-color 0.3s ease-in-out",
          }}
        />

        {/* Battery Info Table */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "10px",
            borderRadius: "20px",
            textAlign: "center",
            width: "75%",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cellStyle}>Current quarter</td>
                <td style={cellStyle}>{currentQH.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={cellStyle}>Price forecast</td>
                <td style={cellStyle}>{priceForecast} (€/MWh) </td>
              </tr>
              <tr>
                <td style={cellStyle}>Decision</td>
                <td style={cellStyle}>{decision}</td>
              </tr>
              <tr>
                <td style={cellStyle} colSpan={2}>
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
                        <td style={cellStyleSmall}>Discharge Revenue (€)</td>
                        {lookbackData.map(({ lookback, totalRevenue }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {totalRevenue}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={cellStyleSmall}>Charging Cost (€)</td>
                        {lookbackData.map(({ lookback, totalCost }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {-totalCost}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={cellStyleSmall}> Price Spread (€/MWh)</td>
                        {lookbackData.map(({ lookback, avgSpread }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {avgSpread}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={cellStyleSmall}># Cycles</td>
                        {lookbackData.map(({ lookback, nbCycles }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {nbCycles}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Battery Cap */}
      <div
        style={{
          width: "80px",
          height: "40px",
          background: "black",
          position: "absolute",
          top: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "6px",
        }}
      />
    </div>
  );
}

// Table cell styling
const cellStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  fontWeight: "bold",
};

const cellStyleSmall: React.CSSProperties = {
  padding: "4px",
  border: "1px solid #ccc",
  textAlign: "center",
  fontSize: "12px",
};
