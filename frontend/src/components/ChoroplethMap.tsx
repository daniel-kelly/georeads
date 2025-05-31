// src/components/ChoroplethMap.tsx
import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// TopoJSON URL
const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryData = {
  [iso3: string]: number;
};

const ChoroplethMap = () => {
  const [data, setData] = useState<CountryData>({});
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/api/nationality_counts")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData.results);
        const max = Math.max(...Object.values(resData.results));
        setMaxValue(max);
      });
  }, []);

  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#e0f3f3", "#086375"]);

  return (
    <ComposableMap projectionConfig={{ scale: 170 }}>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const iso3 = geo.properties.ISO_A3;
            const val = data[iso3] || 0;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={val > 0 ? colorScale(val) : "#EEE"}
                stroke="#DDD"
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default ChoroplethMap;
