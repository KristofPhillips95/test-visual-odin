import React from "react";

interface BatteryProps {
  level: number;
}


function findAvgSpread(json: Record<string, any>,x:number,PERatio = 1/2) {
  if (!json || typeof json !== "object") {
    return [[], [], [], [], []]; // Return empty arrays to prevent errors
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

  const price = lastEntries.map((entry) => entry.price);
  const net_discharge = lastEntries.map((entry) => entry.net_discharge);
  const averagedischargeprice = lastEntries
  .filter((entry) => entry.net_discharge > 0.1) // Filter for net discharge greater than 0 (charge)
  .reduce((acc, entry) => acc + entry.price, 0.1) / lastEntries.filter((entry) => entry.net_discharge > 0.1).length;

  const averagechargeprice = lastEntries
  .filter((entry) => entry.net_discharge < - 0.1) // Filter for net discharge greater than 0 (charge)
  .reduce((acc, entry) => acc + entry.price, 0.1) / lastEntries.filter((entry) => entry.net_discharge < -0.1).length;

  // const SI = lastEntries.map((entry) => entry.SI);
  const nb_cycles = (lastEntries.filter((entry) => entry.net_discharge > 0.1).length + lastEntries.filter((entry) => entry.net_discharge < -0.1).length)/(2*4)*PERatio
  return [(averagedischargeprice - averagechargeprice), nb_cycles] as const;
}

export function Battery({ level, currentQH, priceForecast, decision, lt_data }: BatteryProps & { currentQH: Date, priceForecast: number, decision: string,lt_data: [] }) {
  console.log(currentQH)
  const levelPercentage = level * 50;
  const getColor = (levelPercentage: number) => {
    if (levelPercentage > 50) return "rgba(103, 190, 91, 0.75)";
    if (levelPercentage > 20) return "rgba(196, 123, 28, 0.75)";
    return "rgba(255, 0, 0, 0.75)";
  };

  const [avgSpread,avg_spread_2] = findAvgSpread(lt_data,100)
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Battery Container */}
      <div
        style={{
          width: "400px",
          height: "600px",
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
            borderRadius: "10px",
            textAlign: "center",
            width: "80%",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cellStyle}>Current quarter</td>
                <td style={cellStyle}>{currentQH}</td>
              </tr>
              {/* <tr>
                <td style={cellStyle}>Charge Level</td>
                <td style={cellStyle}>{level.toFixed(2)} MWh</td>
              </tr> */}
              <tr>
                <td style={cellStyle}>Price forecast</td>
                <td style={cellStyle}>{priceForecast}</td>
              </tr>
              <tr>
                <td style={cellStyle}>Decision</td>
                <td style={cellStyle}>{decision}</td>
              </tr>
              <tr>
                <td style={cellStyle}>Avg spread</td>
                <td style={cellStyle}>{avgSpread}</td>
              </tr>
              <tr>
                <td style={cellStyle}>Nb cycles</td>
                <td style={cellStyle}>{avg_spread_2}</td>
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
