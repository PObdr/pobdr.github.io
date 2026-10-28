// Times and durations are seconds in the edition's existing time basis.
// Occupancy uses completed passages and half-open intervals [from, to).
// It measures simultaneous in-progress sections, not physical queues.

function quantile(sorted, fraction) {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index), upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function addEvent(events, time, teamId, delta) {
  if (!events.has(time)) events.set(time, new Map());
  const changes = events.get(time);
  changes.set(teamId, (changes.get(teamId) ?? 0) + delta);
}

function summarize(edge, edgeIndex, initial, passages) {
  passages.sort((a, b) => a.from - b.from || a.to - b.to || a.teamId - b.teamId);
  const durations = passages.map(p => p.seconds).sort((a, b) => a - b);
  const events = new Map();

  for (const p of passages) {
    if (p.from === p.to) continue;
    addEvent(events, p.from, p.teamId, 1);
    addEvent(events, p.to, p.teamId, -1);
  }

  const times = [...events.keys()].sort((a, b) => a - b);
  const active = new Map(), timeline = [];
  let peakCount = 0, activeSeconds = 0, teamSeconds = 0;

  for (let i = 0; i < times.length; i++) {
    const from = times[i];
    for (const [teamId, delta] of events.get(from)) {
      const count = (active.get(teamId) ?? 0) + delta;
      if (count > 0) active.set(teamId, count);
      else active.delete(teamId);
    }

    if (i === times.length - 1) continue;
    const to = times[i + 1], count = active.size;
    timeline.push({from, to, count});
    peakCount = Math.max(peakCount, count);
    if (count > 0) {
      activeSeconds += to - from;
      teamSeconds += count * (to - from);
    }
  }

  const peakRanges = [];
  for (const segment of timeline) {
    if (!peakCount || segment.count !== peakCount) continue;
    const previous = peakRanges.at(-1);
    if (previous && previous.to === segment.from) previous.to = segment.to;
    else peakRanges.push({from: segment.from, to: segment.to});
  }

  return {
    edge: edgeIndex,
    initial,
    fromStationId: initial ? null : edge.from,
    toStationId: edge.to,
    label: initial ? 'Nulté místo → ' + edge.toName : edge.label,
    passageCount: passages.length,
    teamCount: new Set(passages.map(p => p.teamId)).size,
    duration: {
      min: durations[0] ?? null,
      q1: quantile(durations, 0.25),
      median: quantile(durations, 0.5),
      q3: quantile(durations, 0.75),
      max: durations.at(-1) ?? null
    },
    peakCount,
    peakRanges,
    activeSeconds,
    teamSeconds,
    averageActiveCount: activeSeconds ? teamSeconds / activeSeconds : null,
    timeline,
    passages
  };
}

// Compatible with collectSamples() and orderedEdges() from histogram-model.js.
// Both normal and initial groups are returned for every edge, including empty ones.
// Duration quartiles use linear interpolation at index (n - 1) * fraction.
// Zero-duration passages count towards duration statistics, but not occupancy.
export function analyzeSectionLoads(samples, edges) {
  if (!Array.isArray(samples) || !Array.isArray(edges)) {
    throw Error('Průchody a úseky musí být pole.');
  }
  for (const edge of edges) {
    if (
      !edge || !Number.isInteger(edge.from) || !Number.isInteger(edge.to) ||
      typeof edge.label !== 'string' || typeof edge.toName !== 'string'
    ) {
      throw Error('Neplatný popis úseku.');
    }
  }

  const groups = edges.map(() => [[], []]);
  for (const sample of samples) {
    if (
      !sample || !Number.isInteger(sample.edge) || sample.edge < 0 ||
      sample.edge >= edges.length || !Number.isInteger(sample.teamId) ||
      sample.teamId < 0 || typeof sample.teamName !== 'string' ||
      typeof sample.initial !== 'boolean' ||
      !Number.isFinite(sample.from) || !Number.isFinite(sample.to) ||
      sample.from < 0 || sample.to < sample.from ||
      !Number.isFinite(sample.to - sample.from) ||
      (sample.seconds != null && sample.seconds !== sample.to - sample.from)
    ) {
      throw Error('Neplatný dokončený průchod úsekem.');
    }
    groups[sample.edge][sample.initial ? 1 : 0].push({
      teamId: sample.teamId,
      teamName: sample.teamName,
      from: sample.from,
      to: sample.to,
      seconds: sample.to - sample.from
    });
  }

  return edges.flatMap((edge, index) => [
    summarize(edge, index, false, groups[index][0]),
    summarize(edge, index, true, groups[index][1])
  ]);
}

// Returns unique teams active at the requested instant; the end is exclusive.
export function teamsOnSection(section, time) {
  if (!section || !Array.isArray(section.passages) || !Number.isFinite(time)) {
    throw Error('Neplatný úsek nebo čas.');
  }
  const teams = new Map();
  for (const p of section.passages) {
    if (p.from <= time && time < p.to && !teams.has(p.teamId)) {
      teams.set(p.teamId, {id: p.teamId, name: p.teamName});
    }
  }
  return [...teams.values()].sort((a, b) => a.id - b.id);
}
