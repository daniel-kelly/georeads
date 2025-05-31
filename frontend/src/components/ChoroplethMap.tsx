import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const ChoroplethMap = ({ authorData }) => {
  const countryCounts = authorData.reduce((acc, { nationality }) => {
    if (!nationality) return acc;
    const country = nationality.trim();
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      <ComposableMap
        width={700}
        height={400}
        style={{ width: '100%', height: 'auto' }}
        projectionConfig={{ scale: 140 }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const count = countryCounts[countryName] || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={count > 0 ? `rgba(38, 139, 210, ${Math.min(0.8, 0.2 + count * 0.1)})` : '#EEE'}
                  stroke="#FFF"
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default ChoroplethMap;
