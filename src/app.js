const { useState, useEffect, useRef } = React;

const API_KEY = 'jpnx4yzOKT55S0ZXx6Q7fZ0s';
const BASE_URL = 'https://api.zotero.org/groups/4712864';
const CACHE_KEY = 'ide-explorer-cache';
const GEO_CACHE = 'ide-geo-cache';
const CACHE_TIME = 24 * 60 * 60 * 1000; // 1 day

async function fetchItems() {
  console.log('Fetching Zotero items...');
  const res = await fetch(`${BASE_URL}/items?limit=100&key=${API_KEY}`);
  const data = await res.json();
  console.log(`Fetched ${data.length} items`);
  return data;
}

function useZoteroData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        setItems(data);
        console.log('Loaded items from cache');
        setLoading(false);
        return;
      }
    }
    fetchItems()
      .then((data) => {
        setItems(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data })
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch items', err);
        setLoading(false);
      });
  }, []);

  return { items, loading };
}

function Timeline({ items, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const data = items
      .filter((d) => d.data.date)
      .map((d) => ({
        date: new Date(d.data.date),
        title: d.data.title,
        id: d.key,
        type: d.data.itemType,
      }));
    console.log(`Timeline items: ${data.length}`);

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = ref.current.clientWidth - margin.left - margin.right;
    const height = ref.current.clientHeight - margin.top - margin.bottom;

    d3.select(ref.current).selectAll('*').remove();
    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    svg
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', height / 2)
      .attr('r', 6)
      .attr('fill', (d) => color(d.type))
      .on('click', (event, d) => onSelect(d.id))
      .append('title')
      .text((d) => d.title);
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function MapView({ items, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([50.94, 6.96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markers = L.markerClusterGroup();

    items.forEach((item) => {
      const place = item.data.place;
      if (!place) return;
      const cache = JSON.parse(localStorage.getItem(GEO_CACHE) || '{}');
      const geo = cache[place];
      const addMarker = ({ lat, lon }) => {
        L.marker([lat, lon])
          .bindPopup(item.data.title)
          .on('click', () => onSelect(item.key))
          .addTo(markers);
      };
      if (geo) {
        console.log(`Using cached location for ${place}`);
        addMarker(geo);
      } else {
        console.log(`Geocoding ${place}`);
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            place
          )}`
        )
          .then((res) => res.json())
          .then((g) => {
            if (g[0]) {
              const { lat, lon } = g[0];
              cache[place] = { lat, lon };
              localStorage.setItem(GEO_CACHE, JSON.stringify(cache));
              addMarker({ lat, lon });
            } else {
              console.warn(`No coordinates for ${place}`);
            }
          })
          .catch((err) => console.error('Geocoding failed', err));
      }
    });

    markers.addTo(map);
    console.log(`Map rendered with ${markers.getLayers().length} markers`);
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function NetworkView({ items, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const nodes = {};
    const links = [];

    items.forEach((item) => {
      const creators = item.data.creators || [];
      creators.forEach((c) => {
        const id = c.name || c.lastName;
        if (!nodes[id]) nodes[id] = { id };
        links.push({ source: id, target: item.key });
      });
      nodes[item.key] = { id: item.key, title: item.data.title, item: true };
    });

    const nodeArray = Object.values(nodes);
    console.log(`Network nodes: ${nodeArray.length}, links: ${links.length}`);
    const simulation = d3
      .forceSimulation(nodeArray)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-200))
      .force(
        'center',
        d3.forceCenter(ref.current.clientWidth / 2, ref.current.clientHeight / 2)
      );

    d3.select(ref.current).selectAll('*').remove();
    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', ref.current.clientWidth)
      .attr('height', ref.current.clientHeight);

    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999');

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodeArray)
      .enter()
      .append('circle')
      .attr('r', 6)
      .attr('fill', (d) => (d.item ? '#ee9b00' : '#005f73'))
      .call(
        d3
          .drag()
          .on('start', dragstart)
          .on('drag', dragged)
          .on('end', dragend)
      )
      .on('click', (event, d) => d.item && onSelect(d.id));

    node.append('title').text((d) => d.title || d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

    function dragstart(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragend(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function TopicsView({ items, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    const tagCounts = {};
    items.forEach((item) => {
      (item.data.tags || []).forEach((t) => {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      });
    });

    const data = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
    console.log(`Topics view with ${data.length} tags`);

    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = ref.current.clientWidth - margin.left - margin.right;
    const height = ref.current.clientHeight - margin.top - margin.bottom;

    d3.select(ref.current).selectAll('*').remove();
    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.tag))
      .range([0, width])
      .padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.count)]).range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(y));

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.tag))
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.count))
      .attr('fill', '#94d2bd')
      .on('click', (event, d) => onSelect(d.tag))
      .append('title')
      .text((d) => d.tag);
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function DetailPanel({ item }) {
  if (!item) return React.createElement('div', { className: 'detail-panel' }, 'Select an item');

  return React.createElement(
    'div',
    { className: 'detail-panel' },
    React.createElement('h3', null, item.data.title),
    React.createElement(
      'ul',
      null,
      React.createElement('li', null, `Type: ${item.data.itemType}`),
      React.createElement('li', null, `Date: ${item.data.date}`),
      React.createElement('li', null, `Place: ${item.data.place}`),
      React.createElement(
        'li',
        null,
        'URL: ',
        React.createElement('a', { href: item.data.url, target: '_blank' }, 'Link')
      )
    )
  );
}

function App() {
  const { items, loading } = useZoteroData();
  const [view, setView] = useState('timeline');
  const [selectedId, setSelectedId] = useState(null);
  const [yearRange, setYearRange] = useState([2008, 2025]);
  const [typeFilter, setTypeFilter] = useState({});

  useEffect(() => {
    if (!items.length) return;
    const years = items
      .filter((i) => i.data.date)
      .map((i) => new Date(i.data.date).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    setYearRange([min, max]);

    const types = {};
    items.forEach((i) => {
      types[i.data.itemType] = true;
    });
    setTypeFilter(types);
  }, [items]);

  if (loading) return React.createElement('div', null, 'Loading...');

  const filtered = items.filter((item) => {
    const year = item.data.date ? new Date(item.data.date).getFullYear() : null;
    const inYear = !year || (year >= yearRange[0] && year <= yearRange[1]);
    const typeOk = typeFilter[item.data.itemType];
    return inYear && typeOk;
  });

  const selectedItem = items.find((i) => i.key === selectedId);

  let content = null;
  if (view === 'timeline')
    content = React.createElement(Timeline, { items: filtered, onSelect: setSelectedId });
  if (view === 'map')
    content = React.createElement(MapView, { items: filtered, onSelect: setSelectedId });
  if (view === 'network')
    content = React.createElement(NetworkView, { items: filtered, onSelect: setSelectedId });
  if (view === 'topics')
    content = React.createElement(TopicsView, { items: filtered, onSelect: setSelectedId });

  return React.createElement(
    'div',
    null,
    React.createElement(
      'nav',
      null,
      ['timeline', 'map', 'network', 'topics'].map((v) =>
        React.createElement(
          'button',
          {
            key: v,
            onClick: () => setView(v),
            className: view === v ? 'active' : '',
            style: { marginRight: '0.5rem' },
          },
          v
        )
      )
    ),
    React.createElement(
      'section',
      { style: { padding: '0.5rem' } },
      React.createElement('label', null, `Years ${yearRange[0]} - ${yearRange[1]}`),
      React.createElement('br'),
      React.createElement('input', {
        type: 'range',
        min: yearRange[0],
        max: yearRange[1],
        value: yearRange[0],
        onChange: (e) => setYearRange([+e.target.value, yearRange[1]]),
      }),
      React.createElement('input', {
        type: 'range',
        min: yearRange[0],
        max: yearRange[1],
        value: yearRange[1],
        onChange: (e) => setYearRange([yearRange[0], +e.target.value]),
      }),
      React.createElement(
        'div',
        null,
        Object.keys(typeFilter).map((t) =>
          React.createElement(
            'label',
            { key: t, style: { marginRight: '1rem' } },
            React.createElement('input', {
              type: 'checkbox',
              checked: typeFilter[t],
              onChange: (e) => {
                const f = { ...typeFilter, [t]: e.target.checked };
                setTypeFilter(f);
              },
            }),
            ' ',
            t
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'main' },
      React.createElement('div', { id: 'visualization' }, content),
      React.createElement(DetailPanel, { item: selectedItem })
    )
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('app'));