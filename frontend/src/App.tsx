import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ChoroplethMap from "./components/ChoroplethMap";

type BookRow = {
  Author?: string;
  Authors?: string;
  'Exclusive Shelf'?: string;
  [key: string]: string | undefined;
};

type AuthorData = {
  name: string;
  nationality: string;
};

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

function App() {
  const [fileName, setFileName] = useState<string>('');
  const [allRows, setAllRows] = useState<BookRow[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<string[]>(['read']);
  const [authors, setAuthors] = useState<string[]>([]);
  const [authorData, setAuthorData] = useState<AuthorData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setAuthorData([]);
    setError(null);

    Papa.parse<BookRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setAllRows(results.data);
      },
    });
  };

  useEffect(() => {
    if (!allRows.length) {
      setAuthors([]);
      return;
    }

    const filteredRows = allRows.filter((row) => {
      const shelfValue = row['Exclusive Shelf']?.trim().toLowerCase();
      return shelfValue && selectedShelves.includes(shelfValue);
    });

    const allNames = filteredRows
      .map((row) => row['Author'] || row['Authors'] || '')
      .filter((field) => field && field.trim().length > 0)
      .flatMap((field) => field.split(/,\s*/))
      .map((name) => name.trim());

    const unique = Array.from(new Set(allNames));
    setAuthors(unique);
  }, [allRows, selectedShelves]);

  const handleShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setAuthorData([]);
    setError(null);
    setSelectedShelves((prev) => {
      return checked ? [...prev, value] : prev.filter((s) => s !== value);
    });
  };

  const fetchAllNationalities = async () => {
    if (!authors.length) return;
    setLoading(true);
    setError(null);

    try {
      const namesParam = authors.join(",");
      const response = await fetch(
        `${API_BASE_URL}/author_batch?names=${encodeURIComponent(namesParam)}`
      );

      if (!response.ok) {
        throw new Error(`Batch fetch failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        results: { name: string; nationality: string; cached: boolean }[];
      };

      const normalizeCountry = (nat: string): string => {
  const map: Record<string, string> = {
    // UK variants
    "England": "United Kingdom",
    "Scotland": "United Kingdom",
    "Wales": "United Kingdom",
    "Northern Ireland": "United Kingdom",
    "Kingdom of Great Britain": "United Kingdom",
    "Great Britain": "United Kingdom",
    "Kingdom of Great Britain and Ireland": "United Kingdom",
    "Kingdom of England": "United Kingdom",
    "United Kingdom of Great Britain and Ireland": "United Kingdom",

    // US variants
    "United States": "United States of America",
    "USA": "United States of America",
    "U.S.": "United States of America",
    "US": "United States of America",

    // Others
    "Soviet Union": "Russia",
    "Czechoslovakia": "Czech Republic",
    "Yugoslavia": "Serbia", // or "Croatia", depending
    "Republic of Ireland": "Ireland",
    "German Empire": "Germany",
    "East Germany": "Germany",
    "West Germany": "Germany",
    "Ottoman Empire": "Turkey",
    "Kingdom of the Netherlands": "Netherlands",
    "People's Republic of China" : "China",

  };
    if (!map[nat]) console.warn('Unmapped nationality:', nat);

  return map[nat] || nat;
};

const batchResults: AuthorData[] = data.results.map(r => ({
  name: r.name,
  nationality: normalizeCountry(r.nationality),
}));
      setAuthorData(batchResults);
    } catch (err) {
      console.error('Batch fetch error:', err);
      setError('Error fetching nationalities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        padding: '5rem',
        maxWidth: '1800px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ textAlign: 'left', marginBottom: '2rem' }}>GeoReads</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          alignItems: 'flex-start',
        }}
      >
        {/* ───── Controls Panel ───── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Filter Shelves</h2>
            <label>
              <input
                type="checkbox"
                value="read"
                checked={selectedShelves.includes('read')}
                onChange={handleShelfChange}
              /> Read
            </label><br />
            <label>
              <input
                type="checkbox"
                value="currently-reading"
                checked={selectedShelves.includes('currently-reading')}
                onChange={handleShelfChange}
              /> Currently Reading
            </label><br />
            <label>
              <input
                type="checkbox"
                value="to-read"
                checked={selectedShelves.includes('to-read')}
                onChange={handleShelfChange}
              /> To Read
            </label>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload CSV</h2>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            {fileName && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Loaded file: <strong>{fileName}</strong>
              </div>
            )}
          </section>
        </div>

        {/* ───── Choropleth Map ───── */}
        <div>
          {authorData.length > 0 && (
            <>
              <h2 style={{ marginBottom: '0.1rem' }}>Nationality Map</h2>
              <div style={{ height: '500px', width: '900px', border: '1px solid #ccc' }}>
                <ChoroplethMap authorData={authorData} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ───── Author List ───── */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>
          {authorData.length > 0
            ? 'Authors & Nationalities'
            : `Matched Authors (${authors.length})`}
        </h2>

        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>
                  Name
                </th>
                {authorData.length > 0 && (
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>
                    Nationality
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(authorData.length > 0 ? authorData : authors.map(name => ({ name }))).map(
                (entry, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      {entry.name}
                    </td>
                    {authorData.length > 0 && (
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        {entry.nationality}
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {!authorData.length && (
          <button
            onClick={fetchAllNationalities}
            disabled={loading || !authors.length}
            style={{
              marginTop: '1rem',
              padding: '10px 16px',
              fontSize: '16px',
              cursor: loading || !authors.length ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Fetching…' : 'Fetch Nationalities'}
          </button>
        )}
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      </div>
    </div>
  );
}

export default App;
