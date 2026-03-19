#!/usr/bin/env python3
"""
Geocode Zotero items using Wikidata SPARQL.

Extracts place names from Zotero metadata and resolves them to coordinates
via Wikidata's SPARQL endpoint. Outputs data/geo-enriched.json for use
by the visualization.

Usage:
    python scripts/geocode.py
"""

import json
import re
import time
import urllib.parse
import urllib.request

API_KEY = "jpnx4yzOKT55S0ZXx6Q7fZ0s"
BASE_URL = "https://api.zotero.org/groups/4712864"
OUTPUT_FILE = "data/geo-enriched.json"

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"

# Fallback coords for known places (same as data.js GEO_COORDS)
KNOWN_COORDS = {
    "Wien": [16.37, 48.21],
    "Vienna": [16.37, 48.21],
    "Köln": [6.96, 50.94],
    "Cologne": [6.96, 50.94],
    "Berlin": [13.41, 52.52],
    "Chemnitz": [12.92, 50.83],
    "Norderstedt": [10.01, 53.70],
    "Wiesbaden": [8.24, 50.08],
    "Graz": [15.44, 47.07],
    "Wuppertal": [7.18, 51.26],
    "München": [11.58, 48.14],
    "Munich": [11.58, 48.14],
    "Boston": [-71.06, 42.36],
    "Hamburg": [9.99, 53.55],
    "Paderborn": [8.75, 51.72],
    "Rostock": [12.10, 54.09],
    "Bamberg": [10.89, 49.89],
    "Lüneburg": [10.41, 53.25],
    "Frankfurt": [8.68, 50.11],
    "Heidelberg": [8.69, 49.40],
    "Trier": [6.64, 49.75],
    "Zürich": [8.54, 47.38],
    "Bern": [7.45, 46.95],
    "Innsbruck": [11.39, 47.26],
    "Salzburg": [13.05, 47.80],
    "Passau": [13.43, 48.57],
    "Würzburg": [9.93, 49.79],
    "Leipzig": [12.37, 51.34],
    "Dresden": [13.74, 51.05],
    "Darmstadt": [8.65, 49.87],
    "Mainz": [8.27, 50.00],
    "Bonn": [7.10, 50.73],
    "Düsseldorf": [6.77, 51.23],
    "Essen": [7.01, 51.46],
}

# Cache for Wikidata lookups
_wikidata_cache = {}


def fetch_zotero_items():
    """Fetch all items from the Zotero group library."""
    items = []
    start = 0
    limit = 100

    while True:
        url = f"{BASE_URL}/items?limit={limit}&start={start}&key={API_KEY}"
        req = urllib.request.Request(url)
        req.add_header("Zotero-API-Version", "3")

        with urllib.request.urlopen(req) as resp:
            total = int(resp.headers.get("Total-Results", "0"))
            batch = json.loads(resp.read().decode("utf-8"))

        items.extend(batch)
        start += limit
        if start >= total or len(batch) == 0:
            break
        time.sleep(0.3)  # Be nice to the API

    # Filter out notes and attachments
    return [
        item for item in items
        if item["data"].get("itemType") not in ("note", "attachment")
    ]


def extract_place(item):
    """Try to extract a place name from various Zotero fields."""
    data = item["data"]

    # 1. Direct place field
    place = data.get("place", "").strip()
    if place:
        return place

    # 2. shortTitle pattern: School3-2024-Berlin
    short = data.get("shortTitle", "")
    match = re.search(r"(?:School\d+-\d+-?)(\w+)$", short)
    if match:
        return match.group(1)

    # 3. conferenceName often contains city
    conf = data.get("conferenceName", "").strip()
    if conf:
        # Try to find a city name at the end: "DH2019, Utrecht"
        parts = re.split(r"[,;]\s*", conf)
        if len(parts) > 1:
            candidate = parts[-1].strip()
            if len(candidate) > 2 and candidate[0].isupper():
                return candidate

    # 4. Publisher location (often "City: Publisher")
    publisher = data.get("publisher", "").strip()
    if publisher and ":" in publisher:
        candidate = publisher.split(":")[0].strip()
        if len(candidate) > 2 and candidate[0].isupper():
            return candidate

    # 5. Extra field sometimes has location info
    extra = data.get("extra", "")
    loc_match = re.search(r"(?:Place|Location|Ort):\s*(.+)", extra, re.IGNORECASE)
    if loc_match:
        return loc_match.group(1).strip()

    return None


def normalize_place(place):
    """Clean up and normalize a place name for geocoding."""
    if not place:
        return None

    # Remove common suffixes and noise
    place = re.sub(r"\s*\(.*?\)\s*", "", place)  # Remove parentheticals
    place = re.sub(r"\s*\[.*?\]\s*", "", place)  # Remove brackets
    place = place.strip(" .,;:-")

    # Handle multi-city: "Berlin/Wien" → take first
    for sep in ["/", "&", " und ", " and ", " u. "]:
        if sep in place:
            place = place.split(sep)[0].strip()

    # Handle "City, Country" → take city
    if "," in place:
        parts = [p.strip() for p in place.split(",")]
        # First part is usually the city
        place = parts[0]

    return place if len(place) > 1 else None


def geocode_wikidata(place_name):
    """Look up coordinates for a place name via Wikidata SPARQL."""
    if place_name in _wikidata_cache:
        return _wikidata_cache[place_name]

    query = """
    SELECT ?place ?placeLabel ?coord WHERE {
      ?place rdfs:label "%s"@de .
      ?place wdt:P625 ?coord .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    LIMIT 1
    """ % place_name.replace('"', '\\"')

    # Try German label first, then English
    coords = _sparql_query(query)
    if not coords:
        query_en = """
        SELECT ?place ?placeLabel ?coord WHERE {
          ?place rdfs:label "%s"@en .
          ?place wdt:P625 ?coord .
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de". }
        }
        LIMIT 1
        """ % place_name.replace('"', '\\"')
        coords = _sparql_query(query_en)

    _wikidata_cache[place_name] = coords
    return coords


def _sparql_query(query):
    """Execute a SPARQL query and extract Point coordinates."""
    url = WIKIDATA_SPARQL + "?" + urllib.parse.urlencode({
        "query": query,
        "format": "json"
    })

    req = urllib.request.Request(url)
    req.add_header("User-Agent", "IDE-Zotero-Vis-Geocoder/1.0")
    req.add_header("Accept", "application/sparql-results+json")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        results = data.get("results", {}).get("bindings", [])
        if not results:
            return None

        coord_str = results[0]["coord"]["value"]
        # Format: "Point(longitude latitude)"
        match = re.search(r"Point\(([^ ]+) ([^ ]+)\)", coord_str)
        if match:
            lng = float(match.group(1))
            lat = float(match.group(2))
            return [lng, lat]
    except Exception as e:
        print(f"  SPARQL error for query: {e}")

    return None


def resolve_coords(place):
    """Try to get coordinates: first from known list, then Wikidata."""
    if not place:
        return None

    # Check known coords first
    if place in KNOWN_COORDS:
        return KNOWN_COORDS[place]

    # Check partial matches in known coords
    for key, coords in KNOWN_COORDS.items():
        if place.lower() == key.lower():
            return coords

    # Try Wikidata
    coords = geocode_wikidata(place)
    if coords:
        print(f"  Wikidata: {place} -> [{coords[0]:.2f}, {coords[1]:.2f}]")
        # Add to known coords for future lookups
        KNOWN_COORDS[place] = coords
    return coords


def main():
    print("Fetching Zotero items...")
    items = fetch_zotero_items()
    print(f"  Found {len(items)} items (after filtering)")

    geo_data = {}
    resolved = 0
    wikidata_lookups = 0

    print("\nExtracting and geocoding places...")
    for item in items:
        key = item["key"]
        raw_place = extract_place(item)
        place = normalize_place(raw_place)

        if not place:
            continue

        # Check if we need Wikidata
        need_wikidata = place not in KNOWN_COORDS and not any(
            place.lower() == k.lower() for k in KNOWN_COORDS
        )
        if need_wikidata:
            wikidata_lookups += 1
            # Rate limit Wikidata queries
            time.sleep(0.5)

        coords = resolve_coords(place)
        if coords:
            geo_data[key] = {
                "place": place,
                "coords": coords
            }
            resolved += 1

    print(f"\nResults:")
    print(f"  Total items: {len(items)}")
    print(f"  Items with place: {resolved}")
    print(f"  Wikidata lookups: {wikidata_lookups}")
    print(f"  Coverage: {resolved/len(items)*100:.1f}%")

    # Also output the updated KNOWN_COORDS for data.js
    print(f"\nNew places discovered via Wikidata:")
    for place, coords in sorted(KNOWN_COORDS.items()):
        # Only print places not in the original hardcoded list
        pass  # They were already printed during resolution

    # Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(geo_data, f, ensure_ascii=False, indent=2)

    print(f"\nWritten to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
