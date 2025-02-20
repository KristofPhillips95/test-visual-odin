import React from "react";

interface BatteryProps {
  level: number;
}

function findRevenue(json: Record<string, any>, x: number, PERatio = 1 / 2) {
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const dischargeRevenue =
  lastEntries
    .filter((entry) => entry.net_discharge > 0.1)
    .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  return Math.round(dischargeRevenue)
}
function findCost(json: Record<string, any>, x: number, PERatio = 1 / 2) {
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const chargeCost =
  lastEntries
    .filter((entry) => entry.net_discharge < 0.1)
    .reduce((acc, entry) => acc + entry.price * entry.net_discharge, 0)
  return Math.round(chargeCost)
}
function sortEntriesAndReturnXlatest(json: Record<string, any>, x: number){
  if (!json || typeof json !== "object") {
    return [0, 0]; // Return zeros to prevent errors
  }

  const sortedEntries = Object.entries(json)
    .map(([_, value]) => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: parseFloat(value?.Imb_price) || NaN,
      net_discharge: parseFloat(value?.fw_net_discharge) || NaN,
      SI: parseFloat(value?.SI) || NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime());

  const lastXElements = (arr: any[], x: number) => arr.slice(-x);
  const lastEntries = lastXElements(sortedEntries, x);
  return lastEntries
} 
function findNBCycles(json: Record<string, any>, x: number, PERatio = 1 / 2){
  const lastEntries = sortEntriesAndReturnXlatest(json,x)
  const nb_cycles =
  (lastEntries.filter((entry) => entry.net_discharge > 0.1).length +
    lastEntries.filter((entry) => entry.net_discharge < -0.1).length) /
  (2 * 4) *
  PERatio;
  return nb_cycles
}
function findAvgSpread(json: Record<string, any>, x: number, PERatio = 1 / 2) {
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
  currentQH: Date;
  priceForecast: number;
  decision: string;
  lt_data: Record<string, any>;
}) {
  // console.log(currentQH);
  const levelPercentage = level * 50;
  const getColor = (levelPercentage: number) => {
    if (levelPercentage > 50) return "rgba(103, 190, 91, 0.75)";
    if (levelPercentage > 20) return "rgba(196, 123, 28, 0.75)";
    return "rgba(255, 0, 0, 0.75)";
  };

  // Prepare lookback data
  const lbs = [24,96,96*7]
  const lookbackData = [
    { lookback: "6h", totalRevenue : findRevenue(lt_data,lbs[0]), totalCost : findCost(lt_data,lbs[0]), avgSpread: findAvgSpread(lt_data,lbs[0]), nbCycles: findNBCycles(lt_data, lbs[0]) },
    { lookback: "1d",totalRevenue : findRevenue(lt_data,lbs[1]), totalCost : findCost(lt_data,lbs[1]),avgSpread: findAvgSpread(lt_data, lbs[1]), nbCycles: findNBCycles(lt_data, lbs[1]) },
    { lookback: "7d",totalRevenue : findRevenue(lt_data,lbs[2]), totalCost : findCost(lt_data,lbs[2]),avgSpread: findAvgSpread(lt_data, lbs[2]), nbCycles: findNBCycles(lt_data, lbs[2]) },
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
                <td style={cellStyle}>{priceForecast}</td>
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
                        <td style={cellStyleSmall}>Revenue</td>
                        {lookbackData.map(({ lookback, totalRevenue }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {totalRevenue}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={cellStyleSmall}>Cost</td>
                        {lookbackData.map(({ lookback, totalCost }) => (
                          <td style={cellStyleSmall} key={lookback}>
                            {totalCost}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={cellStyleSmall}> Price Spread</td>
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
