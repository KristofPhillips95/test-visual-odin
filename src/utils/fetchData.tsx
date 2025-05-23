export async function fetchAsJson(lts: boolean) {
  if (lts) {
    try {
        const response = await fetch(
          // "https://swdd9r1vei.execute-api.eu-north-1.amazonaws.com/lts_items_dev"
          "https://swdd9r1vei.execute-api.eu-north-1.amazonaws.com/lts_items_v2"

        );
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
      } catch (err) {
        console.error("Error fetching data:", err);
        throw err;
      }
    }
  else  {
    try {
      const response = await fetch(
        // "https://swdd9r1vei.execute-api.eu-north-1.amazonaws.com/items_dev"
        "https://swdd9r1vei.execute-api.eu-north-1.amazonaws.com/items"

      );
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (err) {
      console.error("Error fetching data:", err);
      throw err;
    }
  }
}
  