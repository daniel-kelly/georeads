# backend/app/nationality.py

import requests, time
from typing import Optional

from app.cache import get_cached_nationality, cache_nationality

# base url for the wikidata sparql endpoint
SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

def fetch_nationality_from_wikidata(author_name: str) -> str:
    """
    Query Wikidata’s SPARQL endpoint to find the author’s country of citizenship.
    Returns the country label (e.g., "United States of America") if found, otherwise "Unknown".

    Construct a SPARQL query that:
     - Finds any entity that is a human (wdt:P31 wd:Q5)
     - Has an English label exactly matching `author_name` (rdfs:label "author_name"@en)
     - Has a property wdt:P27 (country of citizenship)
     - Requests the English label of that country (?countryLabel)
     - Limits the result to a single binding
    """

    # Ensure the entity is instance of human
    # Match the label exactly (case-sensitive)
    # Get the country of citizenship property

    sparql_query = f"""
    SELECT ?countryLabel WHERE {{
      ?person wdt:P31 wd:Q5;                    
              rdfs:label "{author_name}"@en;   
              wdt:P27 ?country.                
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}  # Retrieve English labels
    }} LIMIT 1
    """

    # return results in json format
    headers = {
        "Accept": "application/sparql-results+json",
        # A minimal, descriptive User-Agent string:
        "User-Agent": "GeoReads/1.0 (https://test-app; mailto:kellydj43+_georeads@gmail.com)"
    }

    # send GET request to the sparql endpoint with our query
    response = requests.get(
        SPARQL_ENDPOINT,
        params={"query": sparql_query},
        headers=headers,
        timeout=10,  # Timeout after 10 seconds to avoid hanging
    )

    # If the request failed (status code >= 400), raise an HTTPError
    response.raise_for_status()

    # Parse the JSON response
    data = response.json()

    # The SPARQL JSON format has a "results" object with a "bindings" list
    bindings = data.get("results", {}).get("bindings", [])

    # If there are no bindings, return "Unknown"
    if not bindings:
        return "Unknown"

    # Otherwise, extract the 'countryLabel' value from the first binding
    country_label = bindings[0].get("countryLabel", {}).get("value")
    return country_label or "Unknown"

def get_nationality(author_name: str) -> str:
    # Step 1: Check the MongoDB cache
    cached = get_cached_nationality(author_name)
    if cached:
        print(f"Cache hit: {author_name} → {cached}")
        return cached

    # Step 2: If not cached, query Wikidata
    try:
        time.sleep(0.5)
        nationality = fetch_nationality_from_wikidata(author_name)
    except Exception as e:
        print(f"Error querying Wikidata for '{author_name}': {e}")
        return "Unknown"

    # Step 3: Save valid result to cache
    cache_nationality(author_name, nationality)

    return nationality