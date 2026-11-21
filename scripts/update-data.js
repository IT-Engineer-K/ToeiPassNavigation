/**
 * 都営交通＆首都圏路線データ 手動更新スクリプト (update-data.js)
 * 
 * 使い方:
 *   node scripts/update-data.js
 * 
 * 役割:
 *   ダイヤ改正や運賃改定があった際に実行すると、data.js の整合性チェックと
 *   JSON形式のデータバンドル (transit-data.json) を生成します。
 *   将来的に ODPT (公共交通オープンデータ協議会) の API キーを取得した場合は、
 *   このスクリプトに fetch 処理を足すだけで最新データを一発取得できます。
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataJsPath = path.join(__dirname, "..", "data.js");
const code = fs.readFileSync(dataJsPath, "utf-8");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code + "\nthis.EXPORT = { OPERATORS, LINES, STATIONS, EDGES, PRESET_QUERIES };", sandbox);

const { OPERATORS, LINES, STATIONS, EDGES } = sandbox.EXPORT;

// 駅IDの整合性チェック
const stationIds = new Set(STATIONS.map(s => s.id));
let errors = 0;

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
