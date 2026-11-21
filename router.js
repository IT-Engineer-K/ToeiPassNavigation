// ============================================================================
// 都営交通無料乗車券（乗車証）専用 ルート検索・運賃・時刻・バリアフリー計算エンジン
// ============================================================================

/**
 * 事業者と乗車距離(km)から支払運賃を計算する（余計な「おトク額」比較は出さない）
 */
function calculateOperatorFare(operatorId, km, options) {
  const op = OPERATORS[operatorId];
  if (!op) return 0;

  if (op.isFreeWithToeiPass && options.useToeiFreePass) {
    return 0;
  }

  if (operatorId === "TOEI") {
    if (km <= 4) return 180;
    if (km <= 9) return 220;
    if (km <= 15) return 270;
    if (km <= 21) return 320;
    return 380;
  }
  if (operatorId === "TOEI_BUS" || operatorId === "KEIO_BUS") {
    return op.flatFare || 210;
  }
  if (op.fareTable) {
    const key = options.fareType === "ticket" ? "ticket" : "ic";
    const row = op.fareTable.find(r => km <= r.maxKm) || op.fareTable[op.fareTable.length - 1];
    return row[key];
  }
  return 0;
}

/**
 * 分単位の時刻を "HH:MM" 形式にフォーマット
 */
function formatMinutesToTime(totalMins) {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * 経路のステップ配列から、連続する同一事業者の距離通算・発着時刻・経過駅一覧を算出する
 */
function evaluatePath(steps, options) {
  if (!steps || steps.length === 0) return null;

  const segments = [];
  for (const step of steps) {
    const lineObj = LINES[step.line];
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && lastSeg.lineId === step.line) {
      lastSeg.to = step.to;
      lastSeg.minutes += step.minutes;
      lastSeg.km = +(lastSeg.km + step.km).toFixed(1);
      lastSeg.stops.push({ id: step.to, minutesFromStart: lastSeg.minutes });
    } else {
      segments.push({
        lineId: step.line,
        lineName: lineObj.name,
        lineColor: lineObj.color,
        lineCode: lineObj.code,
        dirHint: lineObj.dirHint || "",
        operatorId: lineObj.operator,
        operatorName: OPERATORS[lineObj.operator].name,
        isToeiFree: OPERATORS[lineObj.operator].isFreeWithToeiPass,
        from: step.from,
        to: step.to,
        minutes: step.minutes,
        km: +step.km.toFixed(1),
        stops: [
          { id: step.from, minutesFromStart: 0 },
          { id: step.to, minutesFromStart: step.minutes }
        ]
      });
    }
  }

  let totalFare = 0;
  let i = 0;
  while (i < segments.length) {
    const currentOp = segments[i].operatorId;
    if (currentOp === "TOEI_BUS" || currentOp === "KEIO_BUS") {
      const fare = calculateOperatorFare(currentOp, segments[i].km, options);
      segments[i].fare = fare;
      segments[i].fareLabel = (OPERATORS[currentOp].isFreeWithToeiPass && options.useToeiFreePass)
        ? "都営無料乗車券"
        : `${OPERATORS[currentOp].name}`;
      totalFare += fare;
      i++;
    } else {
      let combinedKm = segments[i].km;
      let j = i + 1;
      while (j < segments.length && segments[j].operatorId === currentOp) {
        combinedKm += segments[j].km;
        j++;
      }
      const fare = calculateOperatorFare(currentOp, combinedKm, options);
      segments[i].fare = fare;
      segments[i].fareLabel = (OPERATORS[currentOp].isFreeWithToeiPass && options.useToeiFreePass)
        ? "都営無料乗車券"
        : `${OPERATORS[currentOp].name} (${combinedKm.toFixed(1)}km)`;

      for (let k = i + 1; k < j; k++) {
        segments[k].fare = 0;
        segments[k].isThroughFare = true;
        segments[k].fareLabel = (OPERATORS[currentOp].isFreeWithToeiPass && options.useToeiFreePass)
          ? "都営無料乗車券"
          : `${OPERATORS[currentOp].name} 乗継通算`;
      }
      totalFare += fare;
      i = j;
    }
  }

  // バリアフリー余裕乗換（エレベーター移動を考慮して通常5分、ゆっくり乗換モード時は9分）
  const transferMargin = options.accessibleTransfer ? 9 : 5;
  const rideMinutes = segments.reduce((acc, s) => acc + s.minutes, 0);
  const transferCount = Math.max(0, segments.length - 1);
  const totalMinutes = rideMinutes + transferCount * transferMargin;

  // 時刻計算（出発時刻指定 or 到着時刻指定）
  const baseMins = options.baseTimeMinutes !== undefined ? options.baseTimeMinutes : (9 * 60);
  const isArrivalMode = options.timeMode === "arrival";
  const departTotalMins = isArrivalMode ? (baseMins - totalMinutes) : baseMins;
  const arriveTotalMins = isArrivalMode ? baseMins : (baseMins + totalMinutes);

  let cursorMins = departTotalMins;
  for (let idx = 0; idx < segments.length; idx++) {
    const seg = segments[idx];
    seg.depTime = formatMinutesToTime(cursorMins);
    cursorMins += seg.minutes;
    seg.arrTime = formatMinutesToTime(cursorMins);
    if (idx < segments.length - 1) {
      seg.transferWaitMinutes = transferMargin;
      cursorMins += transferMargin;
    }
  }

  return {
    segments,
    totalFare,
    rideMinutes,
    transferCount,
    transferMargin,
    totalMinutes,
    departTime: formatMinutesToTime(departTotalMins),
    arriveTime: formatMinutesToTime(arriveTotalMins),
    totalKm: +segments.reduce((acc, s) => acc + s.km, 0).toFixed(1)
  };
}

function buildAdjacencyList(includeToeiBus = true) {
  const adj = {};
  for (const st of STATIONS) {
    adj[st.id] = [];
  }
  for (const edge of EDGES) {
    if (!includeToeiBus && LINES[edge.line].operator === "TOEI_BUS") {
      continue;
    }
    if (adj[edge.from] && adj[edge.to]) {
      adj[edge.from].push({ to: edge.to, line: edge.line, minutes: edge.minutes, km: edge.km });
      adj[edge.to].push({ to: edge.from, line: edge.line, minutes: edge.minutes, km: edge.km });
    }
  }
  return adj;
}

/**
 * モード別のダイクストラ探索
 * - "cheapest" (安): 支払額最小
 * - "fastest" (早): 所要時間最短
 * - "easiest" (楽): 乗換回数最小・バリアフリー優先
 * - "balanced": 時間と料金のバランス
 */
function findBestRouteByMode(fromId, toId, options, mode) {
  const adj = buildAdjacencyList(options.includeToeiBus);

  const queue = [{
    stationId: fromId,
    steps: [],
    visited: new Set([fromId]),
    score: 0
  }];

  const bestScoreAtState = {};
  let bestResult = null;
  let bestFinalScore = Infinity;

  while (queue.length > 0) {
    queue.sort((a, b) => a.score - b.score);
    const current = queue.shift();

    if (current.score >= bestFinalScore) continue;

    if (current.stationId === toId) {
      const evaluated = evaluatePath(current.steps, options);
      if (evaluated) {
        bestFinalScore = current.score;
        bestResult = evaluated;
      }
      continue;
    }

    if (current.steps.length >= 24) continue;

    const neighbors = adj[current.stationId] || [];

    for (const edge of neighbors) {
      if (current.visited.has(edge.to)) continue;

      const nextSteps = [...current.steps, {
        from: current.stationId,
        to: edge.to,
        line: edge.line,
        minutes: edge.minutes,
        km: edge.km
      }];

      const evaluated = evaluatePath(nextSteps, options);
      let score = 0;
      if (mode === "cheapest") {
        score = evaluated.totalFare * 1000 + evaluated.totalMinutes * 10 + evaluated.transferCount * 20;
      } else if (mode === "fastest") {
        score = evaluated.totalMinutes * 1000 + evaluated.totalFare * 2 + evaluated.transferCount * 40;
      } else if (mode === "easiest") {
        score = evaluated.transferCount * 15000 + evaluated.totalMinutes * 80 + evaluated.totalFare * 5;
      } else if (mode === "balanced") {
        score = evaluated.totalFare + evaluated.totalMinutes * 10 + evaluated.transferCount * 45;
      }

      const stateKey = `${edge.to}__${edge.line}`;
      if (bestScoreAtState[stateKey] !== undefined && bestScoreAtState[stateKey] <= score) {
        continue;
      }
      bestScoreAtState[stateKey] = score;

      const nextVisited = new Set(current.visited);
      nextVisited.add(edge.to);

      queue.push({
        stationId: edge.to,
        steps: nextSteps,
        visited: nextVisited,
        score
      });
    }
  }

  return bestResult;
}

function searchRoutes(fromId, toId, options) {
  if (!fromId || !toId || fromId === toId) return [];

  const modes = [
    { key: "cheapest", badge: "安", badgeBg: "#16a34a", label: "最安（都営無料区間を優先）" },
    { key: "fastest", badge: "早", badgeBg: "#ea580c", label: "最速（所要時間を優先）" },
    { key: "easiest", badge: "楽", badgeBg: "#0284c7", label: "乗換少（移動負担を軽減）" },
    { key: "balanced", badge: "標準", badgeBg: "#475569", label: "時間・運賃バランス" }
  ];

  const results = [];

  for (const m of modes) {
    const route = findBestRouteByMode(fromId, toId, options, m.key);
    if (!route) continue;

    const signature = route.segments.map(s => `${s.lineId}:${s.from}->${s.to}`).join("|");
    const existing = results.find(r => r.signature === signature);
    if (existing) {
      if (!existing.badges.some(b => b.text === m.badge)) {
        existing.badges.push({ text: m.badge, color: m.badgeBg });
      }
    } else {
      results.push({
        ...route,
        signature,
        label: m.label,
        badges: [{ text: m.badge, color: m.badgeBg }]
      });
    }
  }

  return results;
}
