import React from "react";

interface BatteryProps {
  level: number;
}

export function Battery({ level }: BatteryProps) {
  const getColor = (level: number) => {
    if (level > 50) return "rgba(103, 190, 91, 0.75)";
    if (level > 20) return "rgba(196, 123, 28, 0.75)";
    return "rgba(255, 0, 0, 0.75)";
  };

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
            height: `${level}%`, // Fills from bottom to top
            backgroundColor: getColor(level),
            position: "absolute",
            bottom: 0, // Ensures it fills upwards
            transition: "height 0.3s ease-in-out, background-color 0.3s ease-in-out",
          }}
        />

        {/* Battery Level Text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "10px",
            borderRadius: "10px",
            color: "black",
            textAlign: "center",
          }}
        >
          <div>{level}%</div>
          <div>Voltage: 3.7V</div>
          <div>Temperature: 25°C</div>
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
