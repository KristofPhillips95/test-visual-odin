import {StDataEntry,LtDataEntry} from "../types/dataTypes"

export function splitAndSortLTSData(json: LtDataEntry[]): [string[], number[], number[], number[], number[], number[], number[]] {
  if (!Array.isArray(json)) {
    return [[], [], [], [], [], [], []]; // Ensure type consistency
  }
  const sortedEntries = Object.entries(json)
    .map(([, value]) => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: value?.Imb_price || NaN,
      charge: value?.fw_c || NaN,
      discharge: value?.fw_d || NaN,
      net_discharge: value?.fw_net_discharge || NaN,
      soc: value?.fw_soc || NaN,
      SI: value?.SI || NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime());

  const lastXElements = (arr: typeof sortedEntries, x: number) => arr.slice(-x);
  const x = 26;
  const lastEntries = lastXElements(sortedEntries, x);

  const labels = lastEntries.map((entry) => entry.id.toISOString());
  const price = lastEntries.map((entry) => entry.price);
  const SI = lastEntries.map((entry) => entry.SI);
  const charge = lastEntries.map((entry) => entry.charge);
  const discharge = lastEntries.map((entry) => entry.discharge);
  const net_discharge = lastEntries.map((entry) => entry.net_discharge);
  const soc = lastEntries.map((entry) => entry.soc);

  return [labels, price, SI, net_discharge, soc, charge, discharge];
}


export function findLatestEntryst(json: StDataEntry[]){
  if (!json || typeof json !== "object"|| Object.keys(json).length === 0) {
    return [[], [], [], [], []]; // Return empty arrays to prevent errors
  }

  // Function to find lowest lookahead timstamp in  a single entry 
  const find_min_la = (st_entry: StDataEntry) => {
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

export function findLatestEntry(json: LtDataEntry[]) {
  if (!json || typeof json !== "object" || Object.keys(json).length === 0) {
    return null; // Return null instead of empty arrays for clarity
  }

  // Find the entry with the latest (max) timestamp
  const latestEntry = Object.entries(json)
    .map(([, entry]) => ({
      ...entry,
      parsedId: new Date(entry?.id ?? 0), // Ensure it's a valid date
    }))
    .reduce((maxEntry, currentEntry) =>
      currentEntry.parsedId > maxEntry.parsedId ? currentEntry : maxEntry
    );

  return latestEntry;
}
function getSortedValuesDictTsToArr(tsBasedDict: Record<string, number>): number[] {
  if (!tsBasedDict || typeof tsBasedDict !== "object") {
    return [];
  }

  return Object.entries(tsBasedDict)
    .map(([timestamp, value]) => ({
      date: new Date(timestamp),
      value: value ?? NaN,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(entry => entry.value);
}

// Function to extract values based on sorted keys
export function splitStEntry(entry: StDataEntry):[Date[],number[],number[][],number[],number[],number[]] {
  // If entry is missing or invalid, return empty arrays to avoid errors
  if (!entry) {
    return [[], [], [], [], [], []] as const;
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
  const get_sorted_values = (data?: Record<string, number>): number[] =>
    data && typeof data === "object"
      ? sorted_keys.map((key) => data[key])
      : [];
  
  const get_sorted_values_price = (data?: Record<string, number[]>): number[] =>
    data && typeof data === "object"
      ? sorted_keys.map((key) => data[key][0])
      : [];
  
  const get_sorted_values_si = (data?: Record<string, number[]>): number[][] =>
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

export function findLTMissingTimes(latestEntryLT: LtDataEntry, latestEntryST: StDataEntry) {
  if (!latestEntryLT?.id || !latestEntryST?.id) {
    return []; // Return empty array if either entry is missing an id
  }

  const endTime = new Date(latestEntryST.id).getTime();
  const startTime = new Date(latestEntryLT.id).getTime();

  if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
    return []; // Return empty array if invalid dates or startTime is not before endTime
  }

  const missingTimes = [];
  const quarterHour = 15 * 60 * 1000; // 15 minutes in milliseconds

  for (let time = startTime + quarterHour; time < endTime; time += quarterHour) {
    missingTimes.push(new Date(time).toISOString());
  }

  return missingTimes;
}

export function filterShortTermData(stData: StDataEntry[], ltData: LtDataEntry[]) {
  if (!Array.isArray(stData) || !Array.isArray(ltData)) {
    return 0;
  }

  // Find the max id in long-term data
  const maxLtId = ltData.reduce((max, entry) => 
    new Date(entry.id) > new Date(max) ? entry.id : max, "1970-01-01T00:00:00Z"
  );

  // Calculate the threshold time (maxLtId minus one quarter-hour)
  const maxLtDate = new Date(maxLtId);
  const thresholdTime = new Date(maxLtDate.getTime() - 15 * 60 * 1000); // Subtract 15 minutes

  // Filter short-term data for ids greater than or equal to the threshold time
  return stData.filter(entry => new Date(entry.id) >= thresholdTime);
}

export function splitAndSortSTData(stData: StDataEntry[]) {
  if (!Array.isArray(stData)) {
    return [[], [], [], [], [], [], []] as const;
  }
  

  const sortedEntries = stData
    .map((value) => ({
      id: value?.id ? new Date(value.id) : new Date(0),
      price: value?.Imb_price || NaN,
      fw_charge: value?.fw_c,
      fw_discharge: value?.fw_d,
      fw_net_discharge: value?.fw_net_discharge,
      fw_soc: value?.fw_soc,
      SI: value?.SI || NaN,
    }))
    .sort((a, b) => a.id.getTime() - b.id.getTime());

  const labels = sortedEntries.map((entry) => entry.id.toISOString());
  const price = sortedEntries.map((entry) => entry.price);
  const SI = sortedEntries.map((entry) => entry.SI);
  const fw_charge = sortedEntries.map((entry) => entry.fw_charge);
  const fw_soc = sortedEntries.map((entry) => getSortedValuesDictTsToArr(entry.fw_soc)[0]);
  const fw_discharge = sortedEntries.map((entry) => entry.fw_discharge);
  const fw_net_discharge = sortedEntries.map((entry) => getSortedValuesDictTsToArr(entry.fw_net_discharge)[0]);
  
  console.log(fw_net_discharge)
  return [
    labels.slice(1),
    price.slice(1),
    SI.slice(1),
    fw_net_discharge.slice(0,-1),
    fw_soc.slice(0,-1),
    fw_charge.slice(0,-1),
    fw_discharge.slice(0,-1),
  ] as const;
}

/**
 * Retrieves the value associated with the earliest key in an object.
 * @param obj The dictionary with date-string keys.
 * @returns The value corresponding to the earliest key, or NaN if invalid.
 */
function getEarliestValue(obj: Record<string, string> | undefined): number {
  if (!obj || typeof obj !== "object") {
    return NaN;
  }

  const validDates = Object.keys(obj)
    .map((key) => ({ key, date: new Date(key) }))
    .filter(({ date }) => !isNaN(date.getTime())) // Ensure valid dates
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (validDates.length === 0) return NaN;

  return parseFloat(obj[validDates[0].key]) || NaN;
}
