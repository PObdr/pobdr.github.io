const GOLEMIO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzU3NywiaWF0IjoxNzQ2ODk5MTc3LCJleHAiOjExNzQ2ODk5MTc3LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZjZjOWIxZTYtYTUzNi00YmQwLTllYjMtNjQ3YzdhN2E3YjkxIn0.Qwu-yJ8ITOWA3ChUMuQWaH9UbyhFhCAJnAQmrfLImmg';
const PRAHA_CENTER = [50.0755, 14.4378];
let selectedPosition = JSON.parse(localStorage.getItem('position')) || PRAHA_CENTER;
let allStops = null;
let temperatureChart = null;

// === MAPA ===
const map = L.map('map').setView(selectedPosition, 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const marker = L.marker(selectedPosition, { draggable: false }).addTo(map);

map.on('click', async (e) => {
  selectedPosition = [e.latlng.lat, e.latlng.lng];
  marker.setLatLng(selectedPosition);
  localStorage.setItem('position', JSON.stringify(selectedPosition));
  await refreshData();
});

// === ČAS A DATUM ===
function updateCurrentTime() {
  const now = new Date();
  const days = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const date = now.toLocaleDateString('cs-CZ');
  const time = now.toLocaleTimeString('cs-CZ', {hour:'2-digit',minute:'2-digit'});
  document.getElementById('current-time').innerHTML = `${days[now.getDay()]}, ${date} ${time}`;
}
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// === POČASÍ ===
async function loadWeather() {
  document.getElementById('teploty24h').innerHTML = `<span class="temp-value">-</span>`;
  document.getElementById('averages').innerHTML = '';
  document.getElementById('current-weather').innerHTML = '';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedPosition[0]}&longitude=${selectedPosition[1]}&hourly=temperature_2m,weathercode&current_weather=true&past_days=1&forecast_days=2&timezone=Europe%2FBerlin`;
    const response = await fetch(url);
    const data = await response.json();

    // Nejnižší a nejvyšší teplota za posledních 24 hodin
    const now = new Date();
    const last24hTemps = [];
    for (let i = 0; i < data.hourly.time.length; i++) {
      const t = new Date(data.hourly.time[i]);
      if (now - t <= 24*60*60*1000 && t <= now) {
        last24hTemps.push({
          date: t,
          temp: data.hourly.temperature_2m[i]
        });
      }
    }
    let minTemp = Infinity, maxTemp = -Infinity;
    let minTempDate = null, maxTempDate = null;
    for (const t of last24hTemps) {
      if (t.temp < minTemp) { minTemp = t.temp; minTempDate = t.date; }
      if (t.temp > maxTemp) { maxTemp = t.temp; maxTempDate = t.date; }
    }
    if (minTempDate && maxTempDate) {
      document.getElementById('teploty24h').innerHTML = `
        <div class="minmax-col">
          <span class="temp-value">${minTemp.toFixed(1)}°C</span>
          <span class="minmax-time">${minTempDate.getHours()}:${minTempDate.getMinutes().toString().padStart(2,'0')} ${minTempDate.getDate()}.${minTempDate.getMonth()+1}.</span>
        </div>
        <div class="minmax-col">
          <span class="temp-value" style="color:#c62828;">${maxTemp.toFixed(1)}°C</span>
          <span class="minmax-time">${maxTempDate.getHours()}:${maxTempDate.getMinutes().toString().padStart(2,'0')} ${maxTempDate.getDate()}.${maxTempDate.getMonth()+1}.</span>
        </div>
      `;
    }

    // Aktuální počasí
    if (data.current_weather) {
      const icon = getWeatherIcon(data.current_weather.weathercode);
      document.getElementById('current-weather').innerHTML =
        `Aktuálně: <b style="font-size:1.4em;">${data.current_weather.temperature.toFixed(1)}°C</b> <span style="font-size:1.4em;">${icon}</span>`;
    }

    // Předpověď - nejbližších 12 hodin + průměr na další 3h + průměr na dalších 9h
    const nowHourIdx = data.hourly.time.findIndex(t => new Date(t) >= now);
    const next12hTemps = data.hourly.temperature_2m.slice(nowHourIdx, nowHourIdx+12);
    const next12hTimes = data.hourly.time.slice(nowHourIdx, nowHourIdx+12);
    const next12hCodes = data.hourly.weathercode.slice(nowHourIdx, nowHourIdx+12);

    // Průměr na další 3 hodiny
    let avgNext3h = null;
    let start3 = null, end3 = null;
    if (data.hourly.temperature_2m.length >= nowHourIdx+15) {
      avgNext3h = data.hourly.temperature_2m.slice(nowHourIdx+12, nowHourIdx+15)
        .reduce((a, b) => a+b, 0) / 3;
      start3 = new Date(data.hourly.time[nowHourIdx+12]);
      end3 = new Date(data.hourly.time[nowHourIdx+14]);
    }

    // Průměr na dalších 9 hodin
    let avgNext9h = null;
    let start9 = null, end9 = null;
    if (data.hourly.temperature_2m.length >= nowHourIdx+24) {
      avgNext9h = data.hourly.temperature_2m.slice(nowHourIdx+15, nowHourIdx+24)
        .reduce((a, b) => a+b, 0) / 9;
      start9 = new Date(data.hourly.time[nowHourIdx+15]);
      end9 = new Date(data.hourly.time[nowHourIdx+23]);
    }

    // Vykreslit graf
    renderTemperatureChart(next12hTimes, next12hTemps, next12hCodes);

    // Vykreslit průměry s konkrétními časy
    let averagesHTML = '';
    if (avgNext3h !== null) {
      averagesHTML += `<span class="prumer-label">Průměr od ${start3.getHours()}h do ${end3.getHours()}h: <b>${avgNext3h.toFixed(1)}°C</b></span>`;
    }
    if (avgNext9h !== null) {
      averagesHTML += `<span class="prumer-label">Průměr od ${start9.getHours()}h do ${end9.getHours()}h: <b>${avgNext9h.toFixed(1)}°C</b></span>`;
    }
    document.getElementById('averages').innerHTML = averagesHTML;

  } catch (error) {
    console.error('Chyba při načítání počasí:', error);
  }
}

function renderTemperatureChart(times, temps, codes) {
  if (temperatureChart) temperatureChart.destroy();
  const ctx = document.getElementById('temperature-chart').getContext('2d');
  const labels = times.map(t => {
    const date = new Date(t);
    return date.toLocaleTimeString('cs-CZ', {hour:'2-digit',minute:'2-digit'});
  });
  const weatherIcons = codes.map(code => getWeatherIcon(code));
  const minTemp = Math.floor(Math.min(...temps)) - 1;
  const maxTemp = Math.ceil(Math.max(...temps)) + 1;

  temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Teplota (°C)',
        data: temps,
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 10,
        pointBackgroundColor: '#00bcd4'
      }]
    },
    options: {
      interaction: {
        mode: 'nearest',
        intersect: false
      },
      plugins: {
        tooltip: {
          radius: 15,
          callbacks: {
            title: (ctx) => `${labels[ctx[0].dataIndex]}`,
            label: (ctx) => `${ctx.parsed.y.toFixed(1)} °C ${weatherIcons[ctx.dataIndex]}`
          }
        },
        legend: { display: false }
      },
      scales: {
        y: { 
          title: { display: true, text: 'Teplota (°C)' },
          grid: { color: 'rgba(0,0,0,0.05)' },
          min: minTemp,
          max: maxTemp
        },
        x: { grid: { display: false } }
      },
      maintainAspectRatio: false,
      responsive: true
    },
    plugins: [{
      id: 'weatherIcons',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        chart.data.datasets[0].data.forEach((value, index) => {
          const x = chart.scales.x.getPixelForValue(index);
          const y = chart.scales.y.getPixelForValue(value) - 20;
          ctx.font = '20px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(weatherIcons[index], x, y);
        });
      }
    }]
  });
}

// === MHD ===
async function loadDepartures() {
  document.getElementById('departures-list').innerHTML = '';
  try {
    const stops = await loadAllStops();
    const groups = groupStopsByName(selectedPosition[0], selectedPosition[1], stops, 5);

    let html = '';
    for (const group of groups) {
      html += `
        <div class="zastavka-group" data-group-name="${group.name}">
          <div class="zastavka-nazev">${group.name} <small>(${group.dist.toFixed(0)} m)</small></div>
          <div class="odjezdy-loading">Načítám odjezdy...</div>
        </div>
      `;
    }
    document.getElementById('departures-list').innerHTML = html || '<div class="error">Žádné zastávky v okolí</div>';

    for (const group of groups) {
      try {
        const url = new URL('https://api.golemio.cz/v2/pid/departureboards');
        url.searchParams.append('names[]', group.name);
        url.searchParams.append('minutesBefore', '15');
        url.searchParams.append('minutesAfter', '60');
        url.searchParams.append('limit', '100');
        
        const response = await fetch(url, {
          headers: { 'x-access-token': GOLEMIO_TOKEN }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        const data = await response.json();

        let allDepartures = Array.isArray(data.departures) ? data.departures : [];
        const now = new Date();
        const filteredDepartures = allDepartures.filter(d => {
          const predicted = new Date(d.departure_timestamp.predicted);
          return predicted >= now;
        });

        const seen = new Set();
        const uniqueDepartures = filteredDepartures
          .filter(d => {
            const key = d.trip.id + '_' + d.departure_timestamp.predicted;
            return seen.has(key) ? false : (seen.add(key), true);
          })
          .sort((a, b) => new Date(a.departure_timestamp.predicted) - new Date(b.departure_timestamp.predicted))
          .slice(0, 10);

        const container = document.querySelector(`[data-group-name="${group.name}"] .odjezdy-loading`);
        if (container) {
          container.innerHTML = uniqueDepartures.length
            ? uniqueDepartures.map(d => renderDeparture(d)).join('')
            : '<div class="error">Žádné odjezdy</div>';
        }
      } catch (error) {
        console.error(`Chyba pro skupinu ${group.name}:`, error);
        const container = document.querySelector(`[data-group-name="${group.name}"] .odjezdy-loading`);
        if (container) container.innerHTML = `<div class="error">Chyba: ${error.message}</div>`;
      }
    }
  } catch (error) {
    console.error('Hlavní chyba:', error);
    document.getElementById('departures-list').innerHTML = '<div class="error">Chyba při načítání odjezdů</div>';
  }
}

function isNightRoute(route) {
  if (route && typeof route.is_night !== "undefined") {
    return route.is_night === true;
  }
  const sn = route?.short_name || "";
  return /^9(0[1-9]|1[0-5])$/.test(sn) || /^N\d+$/i.test(sn);
}

function renderDeparture(d) {
  const scheduled = new Date(d.departure_timestamp.scheduled);
  const predicted = new Date(d.departure_timestamp.predicted);
  const delay = Math.round((predicted - scheduled) / 60000);
  const platform = d.platform_code ? ` (stan. ${d.platform_code})` : '';
  const scheduledStr = `${scheduled.getHours().toString().padStart(2, '0')}:${scheduled.getMinutes().toString().padStart(2, '0')}`;
  const predictedStr = `${predicted.getHours().toString().padStart(2, '0')}:${predicted.getMinutes().toString().padStart(2, '0')}`;
  const vehicleEmoji = getVehicleEmoji(d.route?.type, d.route?.short_name);

  const nightClass = isNightRoute(d.route) ? 'linka-night' : '';
  const lastStop = d.last_stop?.name || "❓";
  const headsign = d.trip.headsign || "❓";
  const isAirConditioned = d.trip.is_air_conditioned ? "❄️ klimatizováno" : "🥵 bez klimatizace";

  const tooltip = `🛑 Poslední zastávka: ${lastStop}
🚩 Směr: ${headsign}
${isAirConditioned}`;

  const info = `
    <span class="linka-info">
      <span style="font-style:normal;">${vehicleEmoji}</span>
      <b class="${nightClass}" style="font-style:normal;">${d.route.short_name}</b>
      <span style="font-style:normal;">→ ${d.trip.headsign}</span>
      ${platform}
    </span>
  `;

  let cas;
  if (delay > 0) {
    cas = `
      <span class="linka-cas">
        <span class="skrtnute">
          <span class="skrtnute-text">${scheduledStr}</span>
          <sup class="supzpozdeni">+${delay}</sup>
        </span>
        <span class="novycas">${predictedStr}</span>
      </span>
    `;
  } else {
    cas = `<span class="linka-cas bez-zpozdeni">${predictedStr}</span>`;
  }

  // Tooltip na celý řádek
  return `<div class="linka" title="${tooltip.replace(/"/g, '&quot;')}">${info}${cas}</div>`;
}

// GTFS weather code mapping with freezing as ❄️
function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1,2,3].includes(code)) return "🌤️";
  if ([45,48].includes(code)) return "🌫️";
  if ([51,53,55].includes(code)) return "🌦️";
  if ([56,57].includes(code)) return "🌦️❄️"; // freezing drizzle
  if ([61,63,65].includes(code)) return "🌧️";
  if ([66,67].includes(code)) return "🌧️❄️"; // freezing rain
  if ([71,73,75].includes(code)) return "🌨️";
  if (code === 77) return "❄️";
  if ([80,81,82].includes(code)) return "🌦️";
  if ([85,86].includes(code)) return "🌨️";
  if (code === 95) return "⛈️";
  if ([96,99].includes(code)) return "⛈️❄️";
  return "❓";
}

// === Načtení všech zastávek přes stránkování ===
async function loadAllStops() {
  if (!allStops) {
    allStops = [];
    let offset = 0;
    const limit = 10000;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `https://api.golemio.cz/v2/gtfs/stops?limit=${limit}&offset=${offset}`;
        const response = await fetch(url, {
          headers: { 'x-access-token': GOLEMIO_TOKEN }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const stopsBatch = data.features.map(f => ({
          stop_id: f.properties.stop_id,
          stop_name: f.properties.stop_name,
          stop_lat: f.geometry.coordinates[1],
          stop_lon: f.geometry.coordinates[0],
          location_type: f.properties.location_type
        }));
        allStops.push(...stopsBatch);
        if (stopsBatch.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      } catch (error) {
        console.error('Chyba při načítání zastávek:', error);
        hasMore = false;
      }
    }
    console.log(`Načteno celkem ${allStops.length} zastávek`);
  }
  return allStops;
}

function groupStopsByName(lat, lon, stops, limit = 5) {
  const groups = {};
  for (const stop of stops) {
    if (stop.location_type !== 0) continue;
    const dist = getDistanceMeters(lat, lon, stop.stop_lat, stop.stop_lon);
    if (dist > 2000) continue;
    if (!groups[stop.stop_name]) {
      groups[stop.stop_name] = { 
        name: stop.stop_name,
        dist: dist 
      };
    } else {
      groups[stop.stop_name].dist = Math.min(groups[stop.stop_name].dist, dist);
    }
  }
  return Object.values(groups).sort((a, b) => a.dist - b.dist).slice(0, limit);
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getVehicleEmoji(routeType, shortName) {
  switch (routeType) {
    case 0: return "🚋"; // Tram, Streetcar, Light rail
    case 1: return "🚇"; // Metro
    case 2: return "🚆"; // Train
    case 3: return "🚌"; // Bus
    case 4: return "⛴️"; // Ferry
    case 5: return "🚟"; // Cable tram
    case 6: return "🚡"; // Aerial lift
    case 7: return "🚞"; // Funicular
    case 11: return "🚎"; // Trolleybus
    case 12: return "🚝"; // Monorail
    default:
      if (/^S\d+/.test(shortName)) return "🚆";
      if (/^X?\d{1,3}[A-Z]?$/.test(shortName)) return "🚌";
      if (/^C\d+/.test(shortName)) return "🚋";
      if (/^[ABCD]$/.test(shortName)) return "🚇";
      return "❓";
  }
}

function toggleLoading(loading) {
  document.getElementById('loading-weather').style.display = loading ? 'inline-block' : 'none';
  document.getElementById('loading-departures').style.display = loading ? 'inline-block' : 'none';
}

async function refreshData() {
  try {
    toggleLoading(true);
    await Promise.all([loadWeather(), loadDepartures()]);
  } catch (error) {
    console.error('Chyba při obnovování dat:', error);
  } finally {
    toggleLoading(false);
  }
}

refreshData();
setInterval(refreshData, 60000);
