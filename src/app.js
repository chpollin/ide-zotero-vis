const { useState, useEffect } = React;

const API_KEY = 'jpnx4yzOKT55S0ZXx6Q7fZ0s';
const BASE_URL = 'https://api.zotero.org/groups/4712864';
const CACHE_KEY = 'ide-explorer-cache';
const CACHE_TIME = 24 * 60 * 60 * 1000; // 1 day

function fetchItems() {
  return fetch(`${BASE_URL}/items?limit=100`, {
    headers: { 'Zotero-API-Key': API_KEY },
  }).then((res) => res.json());
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
        setLoading(false);
        return;
      }
    }
    fetchItems().then((data) => {
      setItems(data);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data })
      );
      setLoading(false);
    });
  }, []);

  return { items, loading };
}

function Timeline({ items, onSelect }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const data = items.filter((d) => d.data.date).map((d) => ({
      date: new Date(d.data.date),
      title: d.data.title,
      id: d.key,
    }));

    const margin = { top: 20, right: 20, bottom: 20, left: 40 };
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

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));

    svg
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', height / 2)
      .attr('r', 5)
      .attr('fill', '#005f73')
      .on('click', (event, d) => onSelect(d.id));
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function MapView({ items, onSelect }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([50.94, 6.96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    items.forEach((item) => {
      const place = item.data.place;
      if (place) {
        // Dummy geocoding: not accurate
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            place
          )}`
        )
          .then((res) => res.json())
          .then((geo) => {
            if (geo[0]) {
              const { lat, lon } = geo[0];
              L.marker([lat, lon])
                .addTo(map)
                .bindPopup(item.data.title)
                .on('click', () => onSelect(item.key));
            }
          });
      }
    });
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function NetworkView({ items, onSelect }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const nodes = {};
    const links = [];

    items.forEach((item) => {
      const creators = item.data.creators || [];
      creators.forEach((c) => {
        const id = c.name || c.lastName;
        if (!nodes[id]) nodes[id] = { id };
        links.push({ source: item.key, target: id });
        nodes[item.key] = { id: item.key, title: item.data.title, item: true };
      });
    });

    const nodeArray = Object.values(nodes);
    const simulation = d3
      .forceSimulation(nodeArray)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(ref.current.clientWidth / 2, ref.current.clientHeight / 2));

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
      .attr('r', 5)
      .attr('fill', (d) => (d.item ? '#ee9b00' : '#005f73'))
      .call(
        d3
          .drag()
          .on('start', dragstart)
          .on('drag', dragged)
          .on('end', dragend)
      )
      .on('click', (event, d) => d.item && onSelect(d.id));

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
  const ref = React.useRef(null);

  useEffect(() => {
    const tagCounts = {};
    items.forEach((item) => {
      (item.data.tags || []).forEach((t) => {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      });
    });

    const data = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
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

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end');

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
      .on('click', (event, d) => onSelect(d.tag));
  }, [items]);

  return React.createElement('div', {
    ref,
    style: { width: '100%', height: '100%' },
  });
}

function DetailPanel({ item }) {
  if (!item) return React.createElement('div', null, 'Select an item');

  return React.createElement(
    'div',
    null,
    React.createElement('h3', null, item.data.title),
    React.createElement(
      'ul',
      null,
      React.createElement('li', null, `Date: ${item.data.date}`),
      React.createElement('li', null, `Place: ${item.data.place}`),
      React.createElement('li', null, `URL: `, React.createElement('a', { href: item.data.url, target: '_blank' }, 'Link'))
    )
  );
}

function App() {
  const { items, loading } = useZoteroData();
  const [view, setView] = useState('timeline');
  const [selectedId, setSelectedId] = useState(null);

  if (loading) return React.createElement('div', null, 'Loading...');

  const selectedItem = items.find((i) => i.key === selectedId);

  let content = null;
  if (view === 'timeline') content = React.createElement(Timeline, { items, onSelect: setSelectedId });
  if (view === 'map') content = React.createElement(MapView, { items, onSelect: setSelectedId });
  if (view === 'network') content = React.createElement(NetworkView, { items, onSelect: setSelectedId });
  if (view === 'topics') content = React.createElement(TopicsView, { items, onSelect: setSelectedId });

  return React.createElement(
    'div',
    null,
    React.createElement(
      'nav',
      null,
      ['timeline', 'map', 'network', 'topics'].map((v) =>
        React.createElement(
          'button',
          { key: v, onClick: () => setView(v) },
          v
        )
      )
    ),
    React.createElement('div', { id: 'visualization' }, content),
    React.createElement(DetailPanel, { item: selectedItem })
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('app'));
