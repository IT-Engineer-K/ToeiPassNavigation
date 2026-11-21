// ============================================================================
// 都営交通無料乗車証対応 ルート検索・運賃計算エンジン
// ============================================================================

/**
 * 事業者と乗車距離(km)から運賃を計算する
 * @param {string} operatorId
 * @param {number} km
 * @param {object} options { useToeiPass, otherDisabilityDiscount, fareType }
 */
function calculateOperatorFare(operatorId, km, options) {
  const op = OPERATORS[operatorId];
  if (!op) return { actualFare: 0, normalFare: 0 };

  // 通常運賃（パスなし・割引なし）の算出
  let normalFare = 0;
  if (operatorId === "TOEI") {
    // 都営地下鉄・舎人・都電の参考通常運賃
    if (km <= 4) normalFare = 180;
    else if (km <= 9) normalFare = 220;
    else if (km <= 15) normalFare = 270;
    else if (km <= 21) normalFare = 320;
    else normalFare = 380;
  } else if (operatorId === "TOEI_BUS") {
    normalFare = op.flatFare || 210;
  } else if (op.fareTable) {
    const key = options.fareType === "ticket" ? "ticket" : "ic";
    const row = op.fareTable.find(r => km <= r.maxKm) || op.fareTable[op.fareTable.length - 1];
    normalFare = row[key];
  }

  // 実際の支払額の算出
  let actualFare = normalFare;
  if (op.isFreeWithPass && options.useToeiPass) {
    actualFare = 0;
  } else if (!op.isFreeWithPass && options.otherDisabilityDiscount) {
    // 他社線の障害者割引（原則5割引・10円単位切り上げまたは1円単位半額）
    if (options.fareType === "ticket") {
      actualFare = Math.ceil((normalFare / 2) / 10) * 10;
    } else {
      actualFare = Math.floor(normalFare / 2);
    }
  }

  return { actualFare, normalFare };
}

/**
 * 経路のステップ配列から、連続する同一事業者の距離を合算して正確な運賃・所要時間・乗換回数を算出する
 */
function evaluatePath(steps, options) {
  if (!steps || steps.length === 0) return null;

  // 路線ごとのセグメントにまとめる
  const segments = [];
  for (const step of steps) {
    const lineObj = LINES[step.line];
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && lastSeg.lineId === step.line) {
      lastSeg.to = step.to;
      lastSeg.minutes += step.minutes;
      lastSeg.km = +(lastSeg.km + step.km).toFixed(1);
      lastSeg.stops.push(step.to);
    } else {
      segments.push({
        lineId: step.line,
        lineName: lineObj.name,
        lineColor: lineObj.color,
        lineCode: lineObj.code,
        operatorId: lineObj.operator,
        operatorName: OPERATORS[lineObj.operator].name,
        isToeiFree: OPERATORS[lineObj.operator].isFreeWithPass,
        from: step.from,
        to: step.to,
        minutes: step.minutes,
        km: +step.km.toFixed(1),
        stops: [step.from, step.to]
      });
    }
  }

  // 事業者ごとの運賃計算（同一事業者内の乗継は距離を通算、ただし都営バスは1乗車ごと）
  let totalActualFare = 0;
  let totalNormalFare = 0;

  let i = 0;
  while (i < segments.length) {
    const currentOp = segments[i].operatorId;
    if (currentOp === "TOEI_BUS") {
      const { actualFare, normalFare } = calculateOperatorFare("TOEI_BUS", segments[i].km, options);
      segments[i].actualFare = actualFare;
      segments[i].normalFare = normalFare;
      segments[i].fareNote = options.useToeiPass ? "都営無料パス 0円" : `通常 ${normalFare}円`;
      totalActualFare += actualFare;
      totalNormalFare += normalFare;
      i++;
    } else {
      // 連続する同一鉄道事業者の距離を合算
      let combinedKm = segments[i].km;
      let j = i + 1;
      while (j < segments.length && segments[j].operatorId === currentOp) {
        combinedKm += segments[j].km;
        j++;
      }
      const { actualFare, normalFare } = calculateOperatorFare(currentOp, combinedKm, options);

      // 最初のセグメントに代表運賃を付与し、連続乗継セグメントは「乗継通算」とする
      segments[i].actualFare = actualFare;
      segments[i].normalFare = normalFare;
      if (OPERATORS[currentOp].isFreeWithPass && options.useToeiPass) {
        segments[i].fareNote = "都営無料パス 0円";
      } else if (!OPERATORS[currentOp].isFreeWithPass && options.otherDisabilityDiscount) {
        segments[i].fareNote = `障害者割引 50%OFF（通常${normalFare}円）`;
      } else {
        segments[i].fareNote = `通常運賃`;
      }

      for (let k = i + 1; k < j; k++) {
        segments[k].actualFare = 0;
        segments[k].normalFare = 0;
        segments[k].isThroughFare = true;
        segments[k].fareNote = OPERATORS[currentOp].isFreeWithPass && options.useToeiPass
          ? "都営無料パス 0円"
          : `${OPERATORS[currentOp].name} 乗継通算`;
      }

      totalActualFare += actualFare;
      totalNormalFare += normalFare;
      i = j;
    }
  }

  // 所要時間（乗車時間＋乗換待ち時間5分/回）
  const rideMinutes = segments.reduce((acc, s) => acc + s.minutes, 0);
  const transferCount = Math.max(0, segments.length - 1);
  const transferPenaltyMinutes = transferCount * 5;
  const totalMinutes = rideMinutes + transferPenaltyMinutes;

  // 都営利用率（距離ベース）
  const totalKm = segments.reduce((acc, s) => acc + s.km, 0);
  const toeiKm = segments.filter(s => s.isToeiFree).reduce((acc, s) => acc + s.km, 0);
  const toeiRatio = totalKm > 0 ? Math.round((toeiKm / totalKm) * 100) : 0;

  return {
    segments,
    totalActualFare,
    totalNormalFare,
    savedAmount: totalNormalFare - totalActualFare,
    rideMinutes,
    transferCount,
    totalMinutes,
    totalKm: +totalKm.toFixed(1),
    toeiRatio
  };
}

/**
 * 隣接リストの構築
 */
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
 * モード別のコスト関数を使った汎用ダイクストラ探索
 * mode:
 *   - "cheapest": 支払運賃を最優先で最小化（1円 = 重み100、1分 = 重み1）
 *   - "fastest": 所要時間を最優先で最小化（1分 = 重み100、1円 = 重み1）
 *   - "balanced": 時間と運賃と乗換回数のバランス（1分 = 12円相当として評価）
 *   - "toei_only": 都営交通のみを使用
 */
function findBestRouteByMode(fromId, toId, options, mode) {
  const adj = buildAdjacencyList(options.includeToeiBus);

  // 状態: (stationId, currentLineId)
  // ルート全体の正確な距離制運賃を評価するため、優先度付きキューでパスを保持
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

    // ステップ数が深すぎる場合は枝刈り
    if (current.steps.length >= 16) continue;

    const lastLine = current.steps.length > 0 ? current.steps[current.steps.length - 1].line : null;
    const neighbors = adj[current.stationId] || [];

    for (const edge of neighbors) {
      if (current.visited.has(edge.to)) continue;

      const lineObj = LINES[edge.line];
      const opObj = OPERATORS[lineObj.operator];

      if (mode === "toei_only" && !opObj.isFreeWithPass) {
        continue;
      }

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
        // 運賃最小を最優先、同額なら時間・乗換が少ない方
        score = evaluated.totalActualFare * 1000 + evaluated.totalMinutes * 10 + evaluated.transferCount * 15;
      } else if (mode === "fastest") {
        // 時間最短を最優先、同時間なら運賃が安い方
        score = evaluated.totalMinutes * 1000 + evaluated.totalActualFare * 2 + evaluated.transferCount * 50;
      } else if (mode === "balanced") {
        // 1分の短縮に15円までの価値を置くバランス型
        score = evaluated.totalActualFare + evaluated.totalMinutes * 12 + evaluated.transferCount * 40;
      } else if (mode === "toei_only") {
        score = evaluated.totalMinutes * 100 + evaluated.transferCount * 80;
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

/**
 * 複数パターンのルート（最安・バランス・最速・都営のみ）を検索して返す
 */
function searchRoutes(fromId, toId, options) {
  if (!fromId || !toId || fromId === toId) return [];

  const modes = [
    { key: "cheapest", title: "最安ルート（都営フル活用）", badge: "最安", badgeColor: "#16a34a" },
    { key: "balanced", title: "おトク＆時短バランス", badge: "おすすめ", badgeColor: "#0284c7" },
    { key: "fastest", title: "最速ルート（時間優先）", badge: "最速", badgeColor: "#d97706" },
    { key: "toei_only", title: "都営交通のみ（完全0円）", badge: "都営限定", badgeColor: "#15803d" }
  ];

  const results = [];
  const seenSignatures = new Set();

  for (const m of modes) {
    const route = findBestRouteByMode(fromId, toId, options, m.key);
    if (!route) continue;

    // 同一経路の重複をまとめる
    const signature = route.segments.map(s => `${s.lineId}:${s.from}->${s.to}`).join("|");
    const existing = results.find(r => r.signature === signature);
    if (existing) {
      if (!existing.badges.some(b => b.text === m.badge)) {
        existing.badges.push({ text: m.badge, color: m.badgeColor });
      }
    } else {
      seenSignatures.add(signature);
      results.push({
        ...route,
        signature,
        title: m.title,
        badges: [{ text: m.badge, color: m.badgeColor }]
      });
    }
  }

  return results;
}
