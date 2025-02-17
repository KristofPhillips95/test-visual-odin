import { Sorts_Mill_Goudy } from "next/font/google";

export function splitAndSortLTSData(json: Record<string, any>) {
  if (!json || typeof json !== "object") {
    return [[], [], [], [], []]; // Return empty arrays to prevent errors
  }

  const sortedEntries = Object.entries(json)
    .map(([_, value]) => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: parseFloat(value?.Imb_price) || NaN,
      charge: parseFloat(value?.fw_c) || NaN,
      discharge: parseFloat(value?.fw_d) || NaN,
      net_discharge: parseFloat(value?.fw_net_discharge) || NaN,
      soc: parseFloat(value?.fw_soc) || NaN,
      SI: parseFloat(value?.SI) || NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime());

  const lastXElements = (arr: any[], x: number) => arr.slice(-x);
  const x = 48;
  const lastEntries = lastXElements(sortedEntries, x);

  const labels = lastEntries.map((entry) => entry.id.toISOString());
  const price = lastEntries.map((entry) => entry.price);
  const SI = lastEntries.map((entry) => entry.SI);
  const charge = lastEntries.map((entry) => entry.charge);
  const discharge = lastEntries.map((entry) => entry.discharge);
  const net_discharge = lastEntries.map((entry) => entry.net_discharge);
  const soc = lastEntries.map((entry) => entry.soc);


  return [labels, price, SI, net_discharge,soc, charge, discharge,] as const;
}

export function findLatestEntryst(json: Record<string,any>){
  if (!json || typeof json !== "object"|| Object.keys(json).length === 0) {
    return [[], [], [], [], []]; // Return empty arrays to prevent errors
  }

  // Function to find lowest lookahead timstamp in  a single entry 
  const find_min_la = (st_entry: any) => {
    // console.log("lookahead_timesteps:", st_entry.lookahead_timesteps);
    // console.log("Type:", typeof st_entry.lookahead_timesteps);
    // console.log("Is Array?", Array.isArray(st_entry.lookahead_timesteps));
    const lookaheads = [...st_entry.lookahead_timesteps]
    const lookaheadsAsTime = lookaheads.map(la => new Date (la).getTime())

    return Math.min(...lookaheadsAsTime);
  };

  // Map entries to [id,lowest_lookahead]
  const mappedEntries = Object.entries(json).map(([id,entry]) => ({
        id,
        min_lookahead: find_min_la(entry),
      }));
  
  //Find entry with lowest min lookahead 

  const lowestLaEntry = mappedEntries.reduce((minEntry,currentEntry) => 
    currentEntry.min_lookahead > minEntry.min_lookahead ? currentEntry : minEntry

  )
  return json[lowestLaEntry.id]
}

export function findLatestEntry(){

}
export function 
splitStEntry(entry: Record<string, any>) {
  // If entry is missing or invalid, return empty arrays to avoid errors
  if (!entry) {
    return [[], [], [], []] as const;
  }

  // Extract values from the entry, or use empty defaults if missing
  const lookahead_times_str = entry.lookahead_timesteps ?? [];
  const lookahead_times = lookahead_times_str.map((la: string) => new Date(la));
  // const lookahead_times = lookahead_times_str.map((la:string) => new Date(la))
  // Sort the keys for consistent order
  let sorted_keys: string[] = [];
  if (entry.fw_net_discharge && typeof entry.fw_net_discharge === "object") {
    sorted_keys = Object.keys(entry.fw_net_discharge).sort((a, b) => a.localeCompare(b));
  }

  // Function to extract values based on sorted keys
  const get_sorted_values = (data?: Record<string, any>): any[] =>
    data && typeof data === "object"
      ? sorted_keys.map((key) => data[key])
      : [];
  
  const get_sorted_values_price = (data?: Record<string, any>): any[] =>
    data && typeof data === "object"
      ? sorted_keys.map((key) => data[key])
      : [];
  
  const get_sorted_values_si = (data?: Record<string, any>): number[][] =>
    data && typeof data === "object"
      ? sorted_keys.map((key) => data[key] as number[])
      : [];
  
  const get_transposed_values_si = (fw_si_sorted?: number[][]): number[][] =>
    Array.isArray(fw_si_sorted) && fw_si_sorted.length > 0
      ? fw_si_sorted[0].map((_, colIndex: number) =>
          fw_si_sorted.map((row) => row[colIndex])
        )
      : [];
  
  const fw_net_discharge_sorted = get_sorted_values(entry.fw_net_discharge);
  const fw_soc_sorted = get_sorted_values(entry.fw_soc);
  const pred_imb_price_fc_sorted = get_sorted_values_price(entry.pred_imb_price_fc);
  const fw_si_sorted = get_sorted_values_si(entry.pred_SI_fc);
  // console.log(fw_si_sorted);
  
  const quantiles = entry.quantiles;
  const fw_si_sortedTransposed = get_transposed_values_si(fw_si_sorted);
  
  return [
    lookahead_times,
    pred_imb_price_fc_sorted,
    fw_si_sortedTransposed,
    fw_net_discharge_sorted,
    fw_soc_sorted,
    quantiles,
  ] as const;
}

// export function findUnknownTimes(labelsLT:Record<string, any>,latestEntryST:Record<string, any>){

//   console.log("Latest Entry ST:", latestEntryST);
//   console.log(labelsLT);
//   return 
// }