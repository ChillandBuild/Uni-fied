import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export function useLookups() {
  const [lookups, setLookups] = useState({
    gasTypes: [],
    capacityUnits: [],
    tankStatuses: [],
    measurementMethods: [],
    plants: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/lookups")
      .then((data) => {
        setLookups({
          gasTypes: data.gas_types,
          capacityUnits: data.capacity_units,
          tankStatuses: data.tank_statuses,
          measurementMethods: data.measurement_methods,
          plants: data.plants,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { lookups, loading };
}
