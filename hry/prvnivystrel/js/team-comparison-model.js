// Compare identical route edges, never ordinal leg numbers or GPS estimates.
// All durations are seconds. Negative deltas mean time gained.
// Repeated passages use one median per team/edge, giving every team equal weight.
function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : sorted[middle - 1] + (sorted[middle] - sorted[middle - 1]) / 2;
}

export function compareSectionTimes(
  samples,
  edges,
  {teamIds = [], referenceTeamId = null, initial = false} = {}
) {
  if (
    !Array.isArray(samples) || !Array.isArray(edges) ||
    !Array.isArray(teamIds) || teamIds.length > 4 ||
    new Set(teamIds).size !== teamIds.length ||
    teamIds.some(id => !Number.isInteger(id) || id < 0) ||
    typeof initial !== 'boolean' ||
    (referenceTeamId !== null && !teamIds.includes(referenceTeamId))
  ) {
    throw Error('Neplatné nastavení porovnání týmů.');
  }
  for (const edge of edges) {
    if (
      !edge || !Number.isInteger(edge.from) || !Number.isInteger(edge.to) ||
      typeof edge.label !== 'string' || typeof edge.toName !== 'string'
    ) {
      throw Error('Neplatný popis úseku.');
    }
  }

  const groups = edges.map(() => new Map());
  for (const sample of samples) {
    if (
      !sample || !Number.isInteger(sample.edge) || sample.edge < 0 ||
      sample.edge >= edges.length || !Number.isInteger(sample.teamId) ||
      sample.teamId < 0 || typeof sample.initial !== 'boolean' ||
      !Number.isFinite(sample.from) || !Number.isFinite(sample.to) ||
      sample.from < 0 || sample.to < sample.from ||
      !Number.isFinite(sample.to - sample.from) ||
      (sample.seconds != null && sample.seconds !== sample.to - sample.from)
    ) {
      throw Error('Neplatný dokončený průchod úsekem.');
    }
    if (sample.initial !== initial) continue;
    const group = groups[sample.edge];
    if (!group.has(sample.teamId)) group.set(sample.teamId, []);
    group.get(sample.teamId).push(sample.to - sample.from);
  }

  const rows = edges.map((edge, index) => {
    const group = groups[index];
    const times = new Map([...group].map(([id, values]) => [id, median(values)]));
    const baselineSeconds = referenceTeamId === null
      ? median([...times.values()])
      : times.get(referenceTeamId) ?? null;
    return {
      edge: index,
      initial,
      fromStationId: initial ? null : edge.from,
      toStationId: edge.to,
      label: initial ? 'Nulté místo → ' + edge.toName : edge.label,
      populationTeamCount: times.size,
      baselineTeamCount: referenceTeamId === null ? times.size : Number(baselineSeconds !== null),
      baselineSeconds,
      cells: teamIds.map(teamId => {
        const seconds = times.get(teamId) ?? null;
        return {
          teamId,
          seconds,
          passageCount: group.get(teamId)?.length ?? 0,
          deltaSeconds: seconds === null || baselineSeconds === null
            ? null : seconds - baselineSeconds
        };
      })
    };
  });

  // Every total uses the exact same intersection of completed edges.
  const commonRows = teamIds.length ? rows.filter(row =>
    row.baselineSeconds !== null && row.cells.every(cell => cell.seconds !== null)
  ) : [];
  const commonBaselineSeconds = commonRows.length
    ? commonRows.reduce((sum, row) => sum + row.baselineSeconds, 0) : null;
  const totals = teamIds.map((teamId, index) => {
    let bestGain = null, worstLoss = null, comparableCount = 0;
    for (const row of rows) {
      const deltaSeconds = row.cells[index].deltaSeconds;
      if (deltaSeconds === null) continue;
      comparableCount++;
      const item = {edge: row.edge, label: row.label, deltaSeconds};
      if (deltaSeconds < 0 && (!bestGain || deltaSeconds < bestGain.deltaSeconds)) {
        bestGain = item;
      }
      if (deltaSeconds > 0 && (!worstLoss || deltaSeconds > worstLoss.deltaSeconds)) {
        worstLoss = item;
      }
    }
    const seconds = commonRows.length
      ? commonRows.reduce((sum, row) => sum + row.cells[index].seconds, 0) : null;
    return {
      teamId,
      comparableCount,
      seconds,
      deltaSeconds: seconds === null ? null : seconds - commonBaselineSeconds,
      // Extremes use this team's available comparable edges, not only common ones.
      bestGain,
      worstLoss
    };
  });

  return {
    teamIds: [...teamIds],
    referenceTeamId,
    initial,
    rows,
    commonEdgeIndexes: commonRows.map(row => row.edge),
    commonBaselineSeconds,
    totals
  };
}
