/**
 * 都営交通＆首都圏路線データ 手動更新・検証スクリプト (update-data.js)
 *
 * 使い方:
 *   node scripts/update-data.js
 *
 * 役割:
 *   ダイヤ改正や運賃改定があった際に実行すると、data.js の整合性チェックと
 *   JSON形式のデータバンドル (transit-data.json) を生成します。
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataJsPath = path.join(__dirname, "..", "data.js");
const code = fs.readFileSync(dataJsPath, "utf-8");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code + "\nthis.EXPORT = { OPERATORS, LINES, STATIONS, EDGES, PRESET_QUERIES };", sandbox);

const { OPERATORS, LINES, STATIONS, EDGES, PRESET_QUERIES } = sandbox.EXPORT;

const stationIds = new Set();
let errors = 0;

// 駅IDの重複チェック
for (const st of STATIONS) {
  if (stationIds.has(st.id)) {
    console.error(`[エラー] 重複する駅ID: ${st.id}`);
    errors++;
  }
  stationIds.add(st.id);
}

// 路線の事業者参照チェック
for (const [lineId, line] of Object.entries(LINES)) {
  if (!OPERATORS[line.operator]) {
    console.error(`[エラー] 路線 ${lineId} に未登録の事業者ID: ${line.operator}`);
    errors++;
  }
}

// 区間の整合性チェック
const connectedStations = new Set();
for (const edge of EDGES) {
  if (!stationIds.has(edge.from)) {
    console.error(`[エラー] 未登録の出発駅ID: ${edge.from}`);
    errors++;
  }
  if (!stationIds.has(edge.to)) {
    console.error(`[エラー] 未登録の到着駅ID: ${edge.to}`);
    errors++;
  }
  if (!LINES[edge.line]) {
    console.error(`[エラー] 未登録の路線ID: ${edge.line}`);
    errors++;
  }
  if (typeof edge.minutes !== "number" || edge.minutes <= 0) {
    console.error(`[エラー] 不正な所要時間 (${edge.from} -> ${edge.to}): ${edge.minutes}`);
    errors++;
  }
  if (typeof edge.km !== "number" || edge.km <= 0) {
    console.error(`[エラー] 不正な距離 (${edge.from} -> ${edge.to}): ${edge.km}`);
    errors++;
  }
  connectedStations.add(edge.from);
  connectedStations.add(edge.to);
}

// プリセットの整合性チェック
for (const preset of PRESET_QUERIES) {
  if (!stationIds.has(preset.from) || !stationIds.has(preset.to)) {
    console.error(`[エラー] プリセットに未登録の駅ID: ${preset.label} (${preset.from} -> ${preset.to})`);
    errors++;
  }
}

// 孤立駅チェック
for (const st of STATIONS) {
  if (!connectedStations.has(st.id)) {
    console.warn(`[警告] 接続区間のない孤立駅: ${st.id} (${st.name})`);
  }
}

if (errors === 0) {
  console.log(`✅ データ検証完了: 事業者 ${Object.keys(OPERATORS).length}社 / 路線 ${Object.keys(LINES).length}路線 / 駅 ${STATIONS.length}駅 / 区間 ${EDGES.length}区間`);
  const outPath = path.join(__dirname, "..", "transit-data.json");
  fs.writeFileSync(outPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    operators: OPERATORS,
    lines: LINES,
    stations: STATIONS,
    edges: EDGES
  }, null, 2), "utf-8");
  console.log(`📦 transit-data.json を出力しました: ${outPath}`);
} else {
  console.error(`❌ ${errors} 件のデータ不整合が見つかりました。`);
  process.exit(1);
}
