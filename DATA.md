# Zotero API Data Documentation

## Overview

This document provides comprehensive information about the Zotero bibliographic data available through the IDE-intern group library (ID: 4712864) and how to access and utilize it through the Zotero API.

## Library Structure

The IDE-intern Zotero library contains bibliographic data organized hierarchically:

- **Libraries**: Group library (ID: 4712864) containing all IDE-intern data
- **Collections**: Hierarchical folder structure (e.g., Schools, RIDE, Events, SIDE)
- **Items**: Various bibliographic entries with rich metadata
- **Tags**: Keywords associated with items

## Data Access

### Authentication

- **API Key**: `jpnx4yzOKT55S0ZXx6Q7fZ0s`
- **Authentication Method**: Include in HTTP header: `Zotero-API-Key: jpnx4yzOKT55S0ZXx6Q7fZ0s`
- **Alternative Method**: Append to URL as query parameter: `?key=jpnx4yzOKT55S0ZXx6Q7fZ0s`

### Core Endpoints

```
Base URL: https://api.zotero.org/groups/4712864
```

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Collections | `/collections/top` | Top-level collections |
| Collection Items | `/collections/{collectionKey}/items` | Items in specific collection |
| Subcollections | `/collections/{collectionKey}/collections` | Subcollections of a collection |
| All Items | `/items` | All items in library |
| Item Details | `/items/{itemKey}` | Details of specific item |
| Tags | `/tags` | All tags in library |

## Data Structure

### Collections

Key collections in the library:

| Collection | Key | Description | Subcollections | Items |
|------------|-----|-------------|----------------|-------|
| Dhd25 | 4DIAPN26 | AI & Prompt Engineering | 0 | 0 |
| Events | WWEZKUJX | Event documentation | 0 | 10 |
| RIDE | 96BBH58W | RIDE journal resources | 17 | 19 |
| Varia | 8FRU4J6S | Miscellaneous resources | 0 | 8 |
| Schools | ABQVUZ7X | IDE Schools documentation | 20 | 23 |
| SIDE | 8JIZ6LQD | SIDE materials | 15 | 19 |

### Item Types

The library contains various item types:

- `presentation` (for School events and talks)
- `document` (for papers and documentation)
- `webpage` (for web resources)
- `note` (for internal notes)
- `journalArticle` (for academic publications)
- `book` and `bookSection` (for monographs and chapters)

### Key Metadata Fields

Each item contains rich metadata, with field availability depending on item type:

#### General Fields (Most Item Types)
- `title`: Full title of the item
- `creators`: Contributors, authors, editors, presenters
- `date`: Publication or event date
- `url`: Web address
- `accessDate`: When the resource was accessed
- `language`: Resource language (e.g., "de", "en")
- `tags`: Associated keywords
- `collections`: Collection IDs the item belongs to
- `relations`: Related items (referenced by their Zotero URIs)
- `dateAdded`: When item was added to Zotero
- `dateModified`: When item was last modified

#### Type-Specific Fields
- **Presentations**:
  - `presentationType`: Type of presentation (e.g., "Schulung")
  - `place`: Location (e.g., "Wien", "Wuppertal", "Graz")
  - `meetingName`: Name of the meeting or event
  - `shortTitle`: Abbreviated title (e.g., "IDE-School 17")

- **Documents**:
  - `abstractNote`: Summary or abstract
  - `publisher`: Publishing entity
  - `pages`: Page range

- **Webpages**:
  - `websiteTitle`: Title of the website
  - `websiteType`: Type of website

## Temporal and Spatial Dimensions

### Temporal Data
The library contains items spanning multiple years (2008-present), captured in:
- Event dates (`date` field, e.g., "2020-02", "2018-09")
- Creation dates (`dateAdded` field)
- Modification dates (`dateModified` field)

### Spatial Data
Geographic information is available primarily in:
- `place` field for events and presentations (e.g., "Köln", "Wien", "Berlin")
- Implicit location information in collection names (e.g., "School01-2008-Koeln")

## Relationship Network

Items in the library are interconnected through:
- Collection hierarchies (parent-child relationships)
- Explicit relations (`relations` field connecting to other Zotero items)
- Shared contributors (`creators` field)

## API Usage Examples

### Basic Collection Retrieval (JavaScript)

```javascript
async function fetchCollections() {
  const response = await fetch('https://api.zotero.org/groups/4712864/collections/top?limit=100', {
    headers: {
      'Zotero-API-Key': 'jpnx4yzOKT55S0ZXx6Q7fZ0s'
    }
  });
  
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return await response.json();
}
```

### Retrieving Items with Metadata (JavaScript)

```javascript
async function fetchItemsWithMetadata(collectionKey) {
  const response = await fetch(`https://api.zotero.org/groups/4712864/collections/${collectionKey}/items?limit=100`, {
    headers: {
      'Zotero-API-Key': 'jpnx4yzOKT55S0ZXx6Q7fZ0s'
    }
  });
  
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return await response.json();
}
```