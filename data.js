// ============================================================================
// 都営交通＋首都圏主要路線 データセット（手動更新スクリプト / オープンデータ差し替え対応）
// ============================================================================

const OPERATORS = {
  TOEI: {
    id: "TOEI",
    name: "都営交通",
    isFreeWithPass: true,
    badgeColor: "#16a34a",
    baseFare: 180, // パスなし時の参考基準運賃（比較用）
    perKmFare: 15
  },
  TOEI_BUS: {
    id: "TOEI_BUS",
    name: "都営バス",
    isFreeWithPass: true,
    badgeColor: "#15803d",
    flatFare: 210
  },
  METRO: {
    id: "METRO",
    name: "東京メトロ",
    isFreeWithPass: false,
    badgeColor: "#0284c7",
    // 距離制運賃テーブル (km: 円)
    fareTable: [
      { maxKm: 6, ic: 178, ticket: 180 },
      { maxKm: 11, ic: 209, ticket: 210 },
      { maxKm: 19, ic: 252, ticket: 260 },
      { maxKm: 27, ic: 293, ticket: 300 },
      { maxKm: 40, ic: 324, ticket: 330 }
    ]
  },
  JR: {
    id: "JR",
    name: "JR東日本",
    isFreeWithPass: false,
    badgeColor: "#166534",
    fareTable: [
      { maxKm: 3, ic: 146, ticket: 150 },
      { maxKm: 6, ic: 167, ticket: 170 },
      { maxKm: 10, ic: 178, ticket: 180 },
      { maxKm: 15, ic: 209, ticket: 210 },
      { maxKm: 20, ic: 274, ticket: 280 },
      { maxKm: 25, ic: 359, ticket: 360 }
    ]
  },
  KEIO: {
    id: "KEIO",
    name: "京王電鉄",
    isFreeWithPass: false,
    badgeColor: "#be185d",
    fareTable: [
      { maxKm: 4, ic: 140, ticket: 140 },
      { maxKm: 8, ic: 160, ticket: 160 },
      { maxKm: 12, ic: 190, ticket: 190 },
      { maxKm: 18, ic: 250, ticket: 250 }
    ]
  },
  TOKYU: {
    id: "TOKYU",
    name: "東急電鉄",
    isFreeWithPass: false,
    badgeColor: "#dc2626",
    fareTable: [
      { maxKm: 3, ic: 140, ticket: 140 },
      { maxKm: 7, ic: 170, ticket: 170 },
      { maxKm: 11, ic: 210, ticket: 210 },
      { maxKm: 15, ic: 230, ticket: 230 }
    ]
  },
  ODAKYU: {
    id: "ODAKYU",
    name: "小田急電鉄",
    isFreeWithPass: false,
    badgeColor: "#2563eb",
    fareTable: [
      { maxKm: 3, ic: 140, ticket: 140 },
      { maxKm: 6, ic: 170, ticket: 170 },
      { maxKm: 9, ic: 200, ticket: 200 },
      { maxKm: 13, ic: 230, ticket: 230 }
    ]
  },
  KEIKYU: {
    id: "KEIKYU",
    name: "京急電鉄",
    isFreeWithPass: false,
    badgeColor: "#e11d48",
    fareTable: [
      { maxKm: 3, ic: 150, ticket: 150 },
      { maxKm: 6, ic: 170, ticket: 170 },
      { maxKm: 10, ic: 200, ticket: 200 },
      { maxKm: 15, ic: 250, ticket: 250 }
    ]
  },
  KEISEI: {
    id: "KEISEI",
    name: "京成電鉄",
    isFreeWithPass: false,
    badgeColor: "#1d4ed8",
    fareTable: [
      { maxKm: 3, ic: 150, ticket: 150 },
      { maxKm: 5, ic: 170, ticket: 170 },
      { maxKm: 10, ic: 200, ticket: 200 },
      { maxKm: 15, ic: 270, ticket: 270 }
    ]
  },
  YURIKAMOME: {
    id: "YURIKAMOME",
    name: "ゆりかもめ",
    isFreeWithPass: false,
    badgeColor: "#0891b2",
    fareTable: [
      { maxKm: 2, ic: 190, ticket: 190 },
      { maxKm: 5, ic: 260, ticket: 260 },
      { maxKm: 8, ic: 330, ticket: 330 },
      { maxKm: 15, ic: 390, ticket: 390 }
    ]
  }
};

const LINES = {
  // 都営交通（無料対象）
  TOEI_ASAKUSA: { id: "TOEI_ASAKUSA", name: "都営浅草線", operator: "TOEI", color: "#FF535F", code: "A" },
  TOEI_MITA: { id: "TOEI_MITA", name: "都営三田線", operator: "TOEI", color: "#0067B0", code: "I" },
  TOEI_SHINJUKU: { id: "TOEI_SHINJUKU", name: "都営新宿線", operator: "TOEI", color: "#B0BF1E", code: "S" },
  TOEI_OEDO: { id: "TOEI_OEDO", name: "都営大江戸線", operator: "TOEI", color: "#CE045B", code: "E" },
  TOEI_ARAKAWA: { id: "TOEI_ARAKAWA", name: "東京さくらトラム（都電荒川線）", operator: "TOEI", color: "#EC6E9A", code: "SA" },
  TOEI_TONERI: { id: "TOEI_TONERI", name: "日暮里・舎人ライナー", operator: "TOEI", color: "#FF69B4", code: "NT" },
  TOEI_BUS_SHIBU66: { id: "TOEI_BUS_SHIBU66", name: "都営バス（都01/渋66/都02等）", operator: "TOEI_BUS", color: "#16a34a", code: "BUS" },

  // 東京メトロ
  METRO_GINZA: { id: "METRO_GINZA", name: "東京メトロ銀座線", operator: "METRO", color: "#FF9500", code: "G" },
  METRO_MARUNOUCHI: { id: "METRO_MARUNOUCHI", name: "東京メトロ丸ノ内線", operator: "METRO", color: "#F62E36", code: "M" },
  METRO_HIBIYA: { id: "METRO_HIBIYA", name: "東京メトロ日比谷線", operator: "METRO", color: "#B5B5AC", code: "H" },
  METRO_TOZAI: { id: "METRO_TOZAI", name: "東京メトロ東西線", operator: "METRO", color: "#009BBF", code: "T" },
  METRO_CHIYODA: { id: "METRO_CHIYODA", name: "東京メトロ千代田線", operator: "METRO", color: "#00BB85", code: "C" },
  METRO_YURAKUCHO: { id: "METRO_YURAKUCHO", name: "東京メトロ有楽町線", operator: "METRO", color: "#C1A470", code: "Y" },
  METRO_HANZOMON: { id: "METRO_HANZOMON", name: "東京メトロ半蔵門線", operator: "METRO", color: "#8F76D6", code: "Z" },
  METRO_NAMBOKU: { id: "METRO_NAMBOKU", name: "東京メトロ南北線", operator: "METRO", color: "#00AC9B", code: "N" },
  METRO_FUKUTOSHIN: { id: "METRO_FUKUTOSHIN", name: "東京メトロ副都心線", operator: "METRO", color: "#9C5E31", code: "F" },

  // JR東日本
  JR_YAMANOTE: { id: "JR_YAMANOTE", name: "JR山手線", operator: "JR", color: "#9ACD32", code: "JY" },
  JR_CHUO: { id: "JR_CHUO", name: "JR中央・総武線", operator: "JR", color: "#F15A22", code: "JC" },
  JR_SAIKYO: { id: "JR_SAIKYO", name: "JR埼京線", operator: "JR", color: "#00AC9A", code: "JA" },
  JR_KEIHIN: { id: "JR_KEIHIN", name: "JR京浜東北線", operator: "JR", color: "#00B2E5", code: "JK" },

  // 私鉄・新交通
  KEIO_MAIN: { id: "KEIO_MAIN", name: "京王線・京王新線", operator: "KEIO", color: "#DD0077", code: "KO" },
  KEIO_INOKASHIRA: { id: "KEIO_INOKASHIRA", name: "京王井の頭線", operator: "KEIO", color: "#1E3A8A", code: "IN" },
  TOKYU_TOYOKO: { id: "TOKYU_TOYOKO", name: "東急東横線", operator: "TOKYU", color: "#DA0442", code: "TY" },
  TOKYU_MEGURO: { id: "TOKYU_MEGURO", name: "東急目黒線", operator: "TOKYU", color: "#009CD2", code: "MG" },
  TOKYU_DENENTOSHI: { id: "TOKYU_DENENTOSHI", name: "東急田園都市線", operator: "TOKYU", color: "#20A288", code: "DT" },
  ODAKYU_MAIN: { id: "ODAKYU_MAIN", name: "小田急小田原線", operator: "ODAKYU", color: "#2288CC", code: "OH" },
  KEIKYU_MAIN: { id: "KEIKYU_MAIN", name: "京急本線・空港線", operator: "KEIKYU", color: "#E5002B", code: "KK" },
  KEISEI_MAIN: { id: "KEISEI_MAIN", name: "京成本線・押上線", operator: "KEISEI", color: "#005AAA", code: "KS" },
  YURIKAMOME_LINE: { id: "YURIKAMOME_LINE", name: "ゆりかもめ", operator: "YURIKAMOME", color: "#00B5AD", code: "U" }
};

// 主要駅・乗換拠点一覧
const STATIONS = [
  // 新宿・渋谷・池袋・副都心エリア
  { id: "shinjuku", name: "新宿", kana: "しんじゅく", area: "新宿・中野・杉並" },
  { id: "tocho_mae", name: "都庁前", kana: "とちょうまえ", area: "新宿・中野・杉並" },
  { id: "shinjuku_sanchome", name: "新宿三丁目", kana: "しんじゅくさんちょうめ", area: "新宿・中野・杉並" },
  { id: "higashi_shinjuku", name: "東新宿", kana: "ひがししんじゅく", area: "新宿・中野・杉並" },
  { id: "shibuya", name: "渋谷", kana: "しぶや", area: "渋谷・目黒・世田谷" },
  { id: "harajuku", name: "原宿（明治神宮前）", kana: "はらじゅく めいじじんぐうまえ", area: "渋谷・目黒・世田谷" },
  { id: "yoyogi", name: "代々木", kana: "よよぎ", area: "新宿・中野・杉並" },
  { id: "kokuritsu_kyogijo", name: "国立競技場（千駄ケ谷）", kana: "こくりつきょうぎじょう せんだがや", area: "新宿・中野・杉並" },
  { id: "aoyama_itchome", name: "青山一丁目", kana: "あおやまいっちょうめ", area: "港・六本木・赤坂" },
  { id: "roppongi", name: "六本木", kana: "ろっぽんぎ", area: "港・六本木・赤坂" },
  { id: "azabu_juban", name: "麻布十番", kana: "あざぶじゅうばん", area: "港・六本木・赤坂" },
  { id: "akabanebashi", name: "赤羽橋（東京タワー前）", kana: "あかばねばし とうきょうたわー", area: "港・六本木・赤坂" },
  { id: "daimon", name: "大門（浜松町）", kana: "だいもん はままつちょう", area: "港・六本木・赤坂" },
  { id: "shiodome", name: "汐留（新橋）", kana: "しおどめ しんばし", area: "東京・銀座・新橋" },
  { id: "tsukijishijo", name: "築地市場（築地）", kana: "つきじしじょう つきじ", area: "東京・銀座・新橋" },
  { id: "kachidoki", name: "勝どき", kana: "かちどき", area: "湾岸・豊洲・お台場" },
  { id: "tsukishima", name: "月島", kana: "つきしま", area: "湾岸・豊洲・お台場" },
  { id: "toyosu", name: "豊洲", kana: "とよす", area: "湾岸・豊洲・お台場" },
  { id: "daiba", name: "お台場海浜公園（東京テレポート）", kana: "おだいばかいひんこうえん", area: "湾岸・豊洲・お台場" },
  { id: "monzen_nakacho", name: "門前仲町", kana: "もんぜんなかちょう", area: "江東・墨田・葛飾" },
  { id: "kiyosumi_shirakawa", name: "清澄白河", kana: "きよすみしらかわ", area: "江東・墨田・葛飾" },
  { id: "morishita", name: "森下", kana: "もりした", area: "江東・墨田・葛飾" },
  { id: "ryogoku", name: "両国", kana: "りょうごく", area: "江東・墨田・葛飾" },
  { id: "kuramae", name: "蔵前", kana: "くらまえ", area: "上野・浅草・押上" },
  { id: "asakusa", name: "浅草", kana: "あさくさ", area: "上野・浅草・押上" },
  { id: "oshiage", name: "押上（スカイツリー前）", kana: "おしあげ すかいつりー", area: "上野・浅草・押上" },
  { id: "ueno_okachimachi", name: "上野御徒町（上野・御徒町）", kana: "うえのおかちまち うえの", area: "上野・浅草・押上" },
  { id: "hongo_sanchome", name: "本郷三丁目", kana: "ほんごうさんちょうめ", area: "文京・水道橋・飯田橋" },
  { id: "kasuga", name: "春日（後楽園）", kana: "かすが こうらくえん", area: "文京・水道橋・飯田橋" },
  { id: "iidabashi", name: "飯田橋", kana: "いいだばし", area: "文京・水道橋・飯田橋" },
  { id: "ichigaya", name: "市ヶ谷", kana: "いちがや", area: "千代田・九段・神保町" },
  { id: "kudanshita", name: "九段下", kana: "くだんした", area: "千代田・九段・神保町" },
  { id: "jimbocho", name: "神保町", kana: "じんぼうちょう", area: "千代田・九段・神保町" },
  { id: "ogawamachi", name: "小川町（淡路町・新御茶ノ水）", kana: "おがわまち あわじちょう しんおちゃのみず", area: "千代田・九段・神保町" },
  { id: "iwamotocho", name: "岩本町（秋葉原）", kana: "いわもとちょう あきはばら", area: "東京・銀座・新橋" },
  { id: "bakuro_yokoyama", name: "馬喰横山（東日本橋・馬喰町）", kana: "ばくろよこやま ひがしにほんばし", area: "東京・銀座・新橋" },
  { id: "ningyocho", name: "人形町", kana: "にんぎょうちょう", area: "東京・銀座・新橋" },
  { id: "nihombashi", name: "日本橋", kana: "にほんばし", area: "東京・銀座・新橋" },
  { id: "takara_cho", name: "宝町（京橋・東京駅八重洲口）", kana: "たからちょう とうきょう", area: "東京・銀座・新橋" },
  { id: "higashi_ginza", name: "東銀座（銀座）", kana: "ひがしぎんざ ぎんざ", area: "東京・銀座・新橋" },
  { id: "otemachi", name: "大手町（東京駅丸の内口）", kana: "おおてまち とうきょう", area: "東京・銀座・新橋" },
  { id: "hibiya", name: "日比谷（有楽町）", kana: "ひびや ゆうらくちょう", area: "東京・銀座・新橋" },
  { id: "uchisaiwaicho", name: "内幸町", kana: "うちさいわいちょう", area: "東京・銀座・新橋" },
  { id: "mita", name: "三田（田町）", kana: "みた たまち", area: "品川・五反田・目黒" },
  { id: "sengakuji", name: "泉岳寺（高輪ゲートウェイ）", kana: "せんがくじ たかなわ", area: "品川・五反田・目黒" },
  { id: "shinagawa", name: "品川", kana: "しながわ", area: "品川・五反田・目黒" },
  { id: "gotanda", name: "五反田", kana: "ごたんだ", area: "品川・五反田・目黒" },
  { id: "meguro", name: "目黒", kana: "めぐろ", area: "品川・五反田・目黒" },
  { id: "shirokane_takanawa", name: "白金高輪", kana: "しろかねたかなわ", area: "港・六本木・赤坂" },
  { id: "ebisu", name: "恵比寿", kana: "えびす", area: "渋谷・目黒・世田谷" },
  { id: "nakameguro", name: "中目黒", kana: "なかめぐろ", area: "渋谷・目黒・世田谷" },
  { id: "jiyugaoka", name: "自由が丘", kana: "じゆうがおか", area: "渋谷・目黒・世田谷" },
  { id: "musashi_kosugi", name: "武蔵小杉", kana: "むさしこすぎ", area: "神奈川・多摩・千葉方面" },
  { id: "yokohama", name: "横浜", kana: "よこはま", area: "神奈川・多摩・千葉方面" },
  { id: "haneda_airport", name: "羽田空港第1・第2ターミナル", kana: "はねだくうこう", area: "品川・五反田・目黒" },
  { id: "magome", name: "西馬込", kana: "にしまごめ", area: "品川・五反田・目黒" },
  { id: "ikebukuro", name: "池袋", kana: "いけぶくろ", area: "池袋・板橋・練馬・北" },
  { id: "sugamo", name: "巣鴨", kana: "すがも", area: "池袋・板橋・練馬・北" },
  { id: "shin_itabashi", name: "新板橋（板橋）", kana: "しんいたばし いたばし", area: "池袋・板橋・練馬・北" },
  { id: "nishi_takashimadaira", name: "西高島平", kana: "にしたかしまだいら", area: "池袋・板橋・練馬・北" },
  { id: "nerima", name: "練馬", kana: "ねりま", area: "池袋・板橋・練馬・北" },
  { id: "hikarigaoka", name: "光が丘", kana: "ひかりがおか", area: "池袋・板橋・練馬・北" },
  { id: "nakano_sakaue", name: "中野坂上", kana: "なかのさかうえ", area: "新宿・中野・杉並" },
  { id: "higashi_nakano", name: "東中野", kana: "ひがしなかの", area: "新宿・中野・杉並" },
  { id: "nakano", name: "中野", kana: "なかの", area: "新宿・中野・杉並" },
  { id: "kichijoji", name: "吉祥寺", kana: "きちじょうじ", area: "新宿・中野・杉並" },
  { id: "sasazuka", name: "笹塚", kana: "ささづか", area: "新宿・中野・杉並" },
  { id: "meidaimae", name: "明大前", kana: "めいだいまえ", area: "新宿・中野・杉並" },
  { id: "chofu", name: "調布", kana: "ちょうふ", area: "神奈川・多摩・千葉方面" },
  { id: "shimokitazawa", name: "下北沢", kana: "しもきたざわ", area: "渋谷・目黒・世田谷" },
  { id: "motoyawata", name: "本八幡", kana: "もとやわた", area: "神奈川・多摩・千葉方面" },
  { id: "ojima", name: "大島", kana: "おおじま", area: "江東・墨田・葛飾" },
  { id: "funabori", name: "船堀", kana: "ふなぼり", area: "江東・墨田・葛飾" },
  { id: "nippori", name: "日暮里", kana: "にっぽり", area: "上野・浅草・押上" },
  { id: "nishi_nippori", name: "西日暮里", kana: "にしにっぽり", area: "上野・浅草・押上" },
  { id: "minumadai_shinsuikoen", name: "見沼代親水公園", kana: "みぬまだいしんすいこうえん", area: "池袋・板橋・練馬・北" },
  { id: "kumanomae", name: "熊野前", kana: "くまのまえ", area: "上野・浅草・押上" },
  { id: "oji_ekimae", name: "王子駅前（王子）", kana: "おうじえきまえ", area: "池袋・板橋・練馬・北" },
  { id: "otsuka_ekimae", name: "大塚駅前（大塚）", kana: "おおつかえきまえ", area: "池袋・板橋・練馬・北" },
  { id: "waseda", name: "早稲田", kana: "わせだ", area: "新宿・中野・杉並" },
  { id: "minowabashi", name: "三ノ輪橋（三ノ輪）", kana: "みのわばし", area: "上野・浅草・押上" }
];

// 路線接続グラフ (from, to, line, minutes, km)
const EDGES = [
  // ==================== 都営大江戸線 (TOEI_OEDO) ====================
  { from: "hikarigaoka", to: "nerima", line: "TOEI_OEDO", minutes: 7, km: 4.8 },
  { from: "nerima", to: "higashi_nakano", line: "TOEI_OEDO", minutes: 9, km: 5.5 },
  { from: "higashi_nakano", to: "nakano_sakaue", line: "TOEI_OEDO", minutes: 3, km: 1.5 },
  { from: "nakano_sakaue", to: "tocho_mae", line: "TOEI_OEDO", minutes: 4, km: 2.2 },
  { from: "tocho_mae", to: "shinjuku", line: "TOEI_OEDO", minutes: 2, km: 0.8 },
  { from: "shinjuku", to: "yoyogi", line: "TOEI_OEDO", minutes: 2, km: 0.6 },
  { from: "yoyogi", to: "kokuritsu_kyogijo", line: "TOEI_OEDO", minutes: 3, km: 1.5 },
  { from: "kokuritsu_kyogijo", to: "aoyama_itchome", line: "TOEI_OEDO", minutes: 3, km: 1.2 },
  { from: "aoyama_itchome", to: "roppongi", line: "TOEI_OEDO", minutes: 3, km: 1.3 },
  { from: "roppongi", to: "azabu_juban", line: "TOEI_OEDO", minutes: 3, km: 1.1 },
  { from: "azabu_juban", to: "akabanebashi", line: "TOEI_OEDO", minutes: 2, km: 0.8 },
  { from: "akabanebashi", to: "daimon", line: "TOEI_OEDO", minutes: 3, km: 1.3 },
  { from: "daimon", to: "shiodome", line: "TOEI_OEDO", minutes: 2, km: 0.9 },
  { from: "shiodome", to: "tsukijishijo", line: "TOEI_OEDO", minutes: 3, km: 1.2 },
  { from: "tsukijishijo", to: "kachidoki", line: "TOEI_OEDO", minutes: 3, km: 1.5 },
  { from: "kachidoki", to: "tsukishima", line: "TOEI_OEDO", minutes: 2, km: 0.8 },
  { from: "tsukishima", to: "monzen_nakacho", line: "TOEI_OEDO", minutes: 3, km: 1.4 },
  { from: "monzen_nakacho", to: "kiyosumi_shirakawa", line: "TOEI_OEDO", minutes: 3, km: 1.2 },
  { from: "kiyosumi_shirakawa", to: "morishita", line: "TOEI_OEDO", minutes: 2, km: 0.6 },
  { from: "morishita", to: "ryogoku", line: "TOEI_OEDO", minutes: 2, km: 1.0 },
  { from: "ryogoku", to: "kuramae", line: "TOEI_OEDO", minutes: 3, km: 1.2 },
  { from: "kuramae", to: "ueno_okachimachi", line: "TOEI_OEDO", minutes: 4, km: 1.8 },
  { from: "ueno_okachimachi", to: "hongo_sanchome", line: "TOEI_OEDO", minutes: 3, km: 1.1 },
  { from: "hongo_sanchome", to: "kasuga", line: "TOEI_OEDO", minutes: 2, km: 0.8 },
  { from: "kasuga", to: "iidabashi", line: "TOEI_OEDO", minutes: 3, km: 1.4 },
  { from: "iidabashi", to: "higashi_shinjuku", line: "TOEI_OEDO", minutes: 7, km: 3.6 },
  { from: "higashi_shinjuku", to: "tocho_mae", line: "TOEI_OEDO", minutes: 5, km: 2.6 },

  // ==================== 都営新宿線 (TOEI_SHINJUKU) ====================
  { from: "shinjuku", to: "shinjuku_sanchome", line: "TOEI_SHINJUKU", minutes: 2, km: 0.8 },
  { from: "shinjuku_sanchome", to: "ichigaya", line: "TOEI_SHINJUKU", minutes: 5, km: 2.7 },
  { from: "ichigaya", to: "kudanshita", line: "TOEI_SHINJUKU", minutes: 2, km: 1.3 },
  { from: "kudanshita", to: "jimbocho", line: "TOEI_SHINJUKU", minutes: 2, km: 0.6 },
  { from: "jimbocho", to: "ogawamachi", line: "TOEI_SHINJUKU", minutes: 2, km: 0.9 },
  { from: "ogawamachi", to: "iwamotocho", line: "TOEI_SHINJUKU", minutes: 2, km: 0.8 },
  { from: "iwamotocho", to: "bakuro_yokoyama", line: "TOEI_SHINJUKU", minutes: 2, km: 0.8 },
  { from: "bakuro_yokoyama", to: "morishita", line: "TOEI_SHINJUKU", minutes: 3, km: 1.4 },
  { from: "morishita", to: "ojima", line: "TOEI_SHINJUKU", minutes: 6, km: 3.2 },
  { from: "ojima", to: "funabori", line: "TOEI_SHINJUKU", minutes: 4, km: 2.6 },
  { from: "funabori", to: "motoyawata", line: "TOEI_SHINJUKU", minutes: 11, km: 8.4 },

  // ==================== 都営三田線 (TOEI_MITA) ====================
  { from: "meguro", to: "shirokane_takanawa", line: "TOEI_MITA", minutes: 4, km: 2.3 },
  { from: "shirokane_takanawa", to: "mita", line: "TOEI_MITA", minutes: 3, km: 1.7 },
  { from: "mita", to: "uchisaiwaicho", line: "TOEI_MITA", minutes: 5, km: 2.7 },
  { from: "uchisaiwaicho", to: "hibiya", line: "TOEI_MITA", minutes: 2, km: 0.9 },
  { from: "hibiya", to: "otemachi", line: "TOEI_MITA", minutes: 2, km: 0.9 },
  { from: "otemachi", to: "jimbocho", line: "TOEI_MITA", minutes: 3, km: 1.7 },
  { from: "jimbocho", to: "kasuga", line: "TOEI_MITA", minutes: 3, km: 1.5 },
  { from: "kasuga", to: "sugamo", line: "TOEI_MITA", minutes: 6, km: 3.3 },
  { from: "sugamo", to: "shin_itabashi", line: "TOEI_MITA", minutes: 4, km: 2.1 },
  { from: "shin_itabashi", to: "nishi_takashimadaira", line: "TOEI_MITA", minutes: 18, km: 9.4 },

  // ==================== 都営浅草線 (TOEI_ASAKUSA) ====================
  { from: "magome", to: "gotanda", line: "TOEI_ASAKUSA", minutes: 8, km: 4.1 },
  { from: "gotanda", to: "sengakuji", line: "TOEI_ASAKUSA", minutes: 5, km: 2.8 },
  { from: "sengakuji", to: "mita", line: "TOEI_ASAKUSA", minutes: 2, km: 1.1 },
  { from: "mita", to: "daimon", line: "TOEI_ASAKUSA", minutes: 3, km: 1.5 },
  { from: "daimon", to: "shiodome", line: "TOEI_ASAKUSA", minutes: 2, km: 1.0 },
  { from: "shiodome", to: "higashi_ginza", line: "TOEI_ASAKUSA", minutes: 2, km: 0.9 },
  { from: "higashi_ginza", to: "takara_cho", line: "TOEI_ASAKUSA", minutes: 2, km: 0.8 },
  { from: "takara_cho", to: "nihombashi", line: "TOEI_ASAKUSA", minutes: 2, km: 0.8 },
  { from: "nihombashi", to: "ningyocho", line: "TOEI_ASAKUSA", minutes: 2, km: 0.7 },
  { from: "ningyocho", to: "bakuro_yokoyama", line: "TOEI_ASAKUSA", minutes: 2, km: 0.8 },
  { from: "bakuro_yokoyama", to: "kuramae", line: "TOEI_ASAKUSA", minutes: 3, km: 1.5 },
  { from: "kuramae", to: "asakusa", line: "TOEI_ASAKUSA", minutes: 2, km: 0.9 },
  { from: "asakusa", to: "oshiage", line: "TOEI_ASAKUSA", minutes: 3, km: 1.5 },

  // ==================== 日暮里・舎人ライナー (TOEI_TONERI) ====================
  { from: "nippori", to: "nishi_nippori", line: "TOEI_TONERI", minutes: 2, km: 0.7 },
  { from: "nishi_nippori", to: "kumanomae", line: "TOEI_TONERI", minutes: 3, km: 1.5 },
  { from: "kumanomae", to: "minumadai_shinsuikoen", line: "TOEI_TONERI", minutes: 15, km: 7.5 },

  // ==================== 都電荒川線 (TOEI_ARAKAWA) ====================
  { from: "waseda", to: "otsuka_ekimae", line: "TOEI_ARAKAWA", minutes: 14, km: 3.7 },
  { from: "otsuka_ekimae", to: "oji_ekimae", line: "TOEI_ARAKAWA", minutes: 12, km: 3.0 },
  { from: "oji_ekimae", to: "kumanomae", line: "TOEI_ARAKAWA", minutes: 11, km: 2.9 },
  { from: "kumanomae", to: "minowabashi", line: "TOEI_ARAKAWA", minutes: 10, km: 2.6 },

  // ==================== 主要都営バスネットワーク (TOEI_BUS_SHIBU66) ====================
  // 渋谷・池袋・新橋・豊洲・お台場・浅草などを都営0円でつなぐ主要幹線バス
  { from: "shibuya", to: "roppongi", line: "TOEI_BUS_SHIBU66", minutes: 15, km: 3.2 }, // 都01
  { from: "roppongi", to: "shiodome", line: "TOEI_BUS_SHIBU66", minutes: 15, km: 3.1 }, // 都01（新橋）
  { from: "ikebukuro", to: "sugamo", line: "TOEI_BUS_SHIBU66", minutes: 12, km: 2.4 }, // 草63/64
  { from: "ikebukuro", to: "otsuka_ekimae", line: "TOEI_BUS_SHIBU66", minutes: 10, km: 1.9 }, // 都02乙
  { from: "otsuka_ekimae", to: "kasuga", line: "TOEI_BUS_SHIBU66", minutes: 14, km: 3.0 }, // 都02
  { from: "kasuga", to: "ueno_okachimachi", line: "TOEI_BUS_SHIBU66", minutes: 10, km: 2.0 }, // 都02
  { from: "ueno_okachimachi", to: "kuramae", line: "TOEI_BUS_SHIBU66", minutes: 8, km: 1.7 }, // 都02
  { from: "kuramae", to: "oshiage", line: "TOEI_BUS_SHIBU66", minutes: 12, km: 2.3 }, // 都08
  { from: "nippori", to: "asakusa", line: "TOEI_BUS_SHIBU66", minutes: 14, km: 3.1 }, // 都08
  { from: "monzen_nakacho", to: "toyosu", line: "TOEI_BUS_SHIBU66", minutes: 12, km: 2.8 }, // 海01/門19
  { from: "toyosu", to: "daiba", line: "TOEI_BUS_SHIBU66", minutes: 16, km: 4.2 }, // 海01
  { from: "kachidoki", to: "toyosu", line: "TOEI_BUS_SHIBU66", minutes: 11, km: 2.5 }, // 都05-2
  { from: "shibuya", to: "harajuku", line: "TOEI_BUS_SHIBU66", minutes: 8, km: 1.4 }, // 早81
  { from: "harajuku", to: "shinjuku_sanchome", line: "TOEI_BUS_SHIBU66", minutes: 14, km: 2.5 }, // 早81/池86
  { from: "shinjuku_sanchome", to: "higashi_shinjuku", line: "TOEI_BUS_SHIBU66", minutes: 7, km: 1.2 }, // 池86
  { from: "higashi_shinjuku", to: "waseda", line: "TOEI_BUS_SHIBU66", minutes: 9, km: 1.7 }, // 早77
  { from: "higashi_shinjuku", to: "ikebukuro", line: "TOEI_BUS_SHIBU66", minutes: 18, km: 3.8 }, // 池86
  { from: "shibuya", to: "ebisu", line: "TOEI_BUS_SHIBU66", minutes: 10, km: 1.8 }, // 田87
  { from: "ebisu", to: "shirokane_takanawa", line: "TOEI_BUS_SHIBU66", minutes: 12, km: 2.4 }, // 田87
  { from: "shirokane_takanawa", to: "mita", line: "TOEI_BUS_SHIBU66", minutes: 8, km: 1.7 }, // 田87
  { from: "sengakuji", to: "shinagawa", line: "TOEI_BUS_SHIBU66", minutes: 7, km: 1.3 }, // 反96/品97

  // ==================== JR山手線・中央線・京浜東北線・埼京線 ====================
  { from: "shinjuku", to: "yoyogi", line: "JR_YAMANOTE", minutes: 2, km: 0.7 },
  { from: "yoyogi", to: "harajuku", line: "JR_YAMANOTE", minutes: 2, km: 1.5 },
  { from: "harajuku", to: "shibuya", line: "JR_YAMANOTE", minutes: 3, km: 1.2 },
  { from: "shibuya", to: "ebisu", line: "JR_YAMANOTE", minutes: 3, km: 1.6 },
  { from: "ebisu", to: "meguro", line: "JR_YAMANOTE", minutes: 3, km: 1.5 },
  { from: "meguro", to: "gotanda", line: "JR_YAMANOTE", minutes: 2, km: 1.2 },
  { from: "gotanda", to: "shinagawa", line: "JR_YAMANOTE", minutes: 5, km: 2.9 },
  { from: "shinagawa", to: "sengakuji", line: "JR_YAMANOTE", minutes: 2, km: 1.1 },
  { from: "sengakuji", to: "mita", line: "JR_YAMANOTE", minutes: 3, km: 1.3 },
  { from: "mita", to: "daimon", line: "JR_YAMANOTE", minutes: 3, km: 1.5 },
  { from: "daimon", to: "shiodome", line: "JR_YAMANOTE", minutes: 2, km: 1.2 },
  { from: "shiodome", to: "hibiya", line: "JR_YAMANOTE", minutes: 2, km: 1.1 },
  { from: "hibiya", to: "otemachi", line: "JR_YAMANOTE", minutes: 2, km: 0.8 },
  { from: "otemachi", to: "iwamotocho", line: "JR_YAMANOTE", minutes: 4, km: 2.0 },
  { from: "iwamotocho", to: "ueno_okachimachi", line: "JR_YAMANOTE", minutes: 3, km: 1.6 },
  { from: "ueno_okachimachi", to: "nippori", line: "JR_YAMANOTE", minutes: 4, km: 2.2 },
  { from: "nippori", to: "nishi_nippori", line: "JR_YAMANOTE", minutes: 2, km: 0.5 },
  { from: "nishi_nippori", to: "sugamo", line: "JR_YAMANOTE", minutes: 5, km: 2.8 },
  { from: "sugamo", to: "otsuka_ekimae", line: "JR_YAMANOTE", minutes: 2, km: 1.1 },
  { from: "otsuka_ekimae", to: "ikebukuro", line: "JR_YAMANOTE", minutes: 3, km: 1.8 },
  { from: "ikebukuro", to: "shinjuku", line: "JR_SAIKYO", minutes: 6, km: 4.8 },
  { from: "shinjuku", to: "shibuya", line: "JR_SAIKYO", minutes: 5, km: 3.4 },
  { from: "nishi_nippori", to: "oji_ekimae", line: "JR_KEIHIN", minutes: 6, km: 3.5 },
  { from: "shinagawa", to: "yokohama", line: "JR_KEIHIN", minutes: 22, km: 22.0 },

  // JR中央・総武線
  { from: "kichijoji", to: "nakano", line: "JR_CHUO", minutes: 11, km: 8.2 },
  { from: "nakano", to: "higashi_nakano", line: "JR_CHUO", minutes: 3, km: 1.9 },
  { from: "higashi_nakano", to: "shinjuku", line: "JR_CHUO", minutes: 4, km: 2.5 },
  { from: "shinjuku", to: "yoyogi", line: "JR_CHUO", minutes: 2, km: 0.7 },
  { from: "yoyogi", to: "kokuritsu_kyogijo", line: "JR_CHUO", minutes: 3, km: 1.5 },
  { from: "kokuritsu_kyogijo", to: "ichigaya", line: "JR_CHUO", minutes: 6, km: 3.2 },
  { from: "ichigaya", to: "iidabashi", line: "JR_CHUO", minutes: 2, km: 1.5 },
  { from: "iidabashi", to: "ogawamachi", line: "JR_CHUO", minutes: 4, km: 2.1 },
  { from: "ogawamachi", to: "iwamotocho", line: "JR_CHUO", minutes: 2, km: 1.0 },
  { from: "iwamotocho", to: "ryogoku", line: "JR_CHUO", minutes: 4, km: 2.2 },
  { from: "ryogoku", to: "motoyawata", line: "JR_CHUO", minutes: 17, km: 13.8 },

  // ==================== 東京メトロ主要路線 ====================
  // 銀座線
  { from: "shibuya", to: "aoyama_itchome", line: "METRO_GINZA", minutes: 4, km: 2.6 },
  { from: "aoyama_itchome", to: "shiodome", line: "METRO_GINZA", minutes: 8, km: 4.1 },
  { from: "shiodome", to: "higashi_ginza", line: "METRO_GINZA", minutes: 2, km: 0.9 },
  { from: "higashi_ginza", to: "nihombashi", line: "METRO_GINZA", minutes: 4, km: 1.7 },
  { from: "nihombashi", to: "ogawamachi", line: "METRO_GINZA", minutes: 4, km: 1.9 },
  { from: "ogawamachi", to: "ueno_okachimachi", line: "METRO_GINZA", minutes: 3, km: 1.6 },
  { from: "ueno_okachimachi", to: "asakusa", line: "METRO_GINZA", minutes: 6, km: 2.8 },

  // 丸ノ内線
  { from: "nakano_sakaue", to: "shinjuku", line: "METRO_MARUNOUCHI", minutes: 4, km: 1.9 },
  { from: "shinjuku", to: "shinjuku_sanchome", line: "METRO_MARUNOUCHI", minutes: 2, km: 0.8 },
  { from: "shinjuku_sanchome", to: "otemachi", line: "METRO_MARUNOUCHI", minutes: 15, km: 7.7 },
  { from: "otemachi", to: "ogawamachi", line: "METRO_MARUNOUCHI", minutes: 2, km: 0.9 },
  { from: "ogawamachi", to: "hongo_sanchome", line: "METRO_MARUNOUCHI", minutes: 3, km: 1.6 },
  { from: "hongo_sanchome", to: "kasuga", line: "METRO_MARUNOUCHI", minutes: 2, km: 0.8 },
  { from: "kasuga", to: "ikebukuro", line: "METRO_MARUNOUCHI", minutes: 8, km: 4.7 },

  // 日比谷線
  { from: "nakameguro", to: "ebisu", line: "METRO_HIBIYA", minutes: 2, km: 1.0 },
  { from: "ebisu", to: "roppongi", line: "METRO_HIBIYA", minutes: 6, km: 3.0 },
  { from: "roppongi", to: "hibiya", line: "METRO_HIBIYA", minutes: 8, km: 4.3 },
  { from: "hibiya", to: "higashi_ginza", line: "METRO_HIBIYA", minutes: 2, km: 0.9 },
  { from: "higashi_ginza", to: "tsukijishijo", line: "METRO_HIBIYA", minutes: 2, km: 0.6 },
  { from: "tsukijishijo", to: "ningyocho", line: "METRO_HIBIYA", minutes: 5, km: 2.3 },
  { from: "ningyocho", to: "iwamotocho", line: "METRO_HIBIYA", minutes: 3, km: 1.3 },
  { from: "iwamotocho", to: "ueno_okachimachi", line: "METRO_HIBIYA", minutes: 3, km: 1.5 },
  { from: "ueno_okachimachi", to: "minowabashi", line: "METRO_HIBIYA", minutes: 5, km: 2.7 },

  // 東西線
  { from: "nakano", to: "waseda", line: "METRO_TOZAI", minutes: 10, km: 5.7 },
  { from: "waseda", to: "iidabashi", line: "METRO_TOZAI", minutes: 5, km: 2.4 },
  { from: "iidabashi", to: "kudanshita", line: "METRO_TOZAI", minutes: 2, km: 0.7 },
  { from: "kudanshita", to: "otemachi", line: "METRO_TOZAI", minutes: 4, km: 2.1 },
  { from: "otemachi", to: "nihombashi", line: "METRO_TOZAI", minutes: 2, km: 0.8 },
  { from: "nihombashi", to: "monzen_nakacho", line: "METRO_TOZAI", minutes: 4, km: 2.3 },

  // 半蔵門線
  { from: "shibuya", to: "aoyama_itchome", line: "METRO_HANZOMON", minutes: 4, km: 2.7 },
  { from: "aoyama_itchome", to: "kudanshita", line: "METRO_HANZOMON", minutes: 8, km: 4.1 },
  { from: "kudanshita", to: "jimbocho", line: "METRO_HANZOMON", minutes: 2, km: 0.4 },
  { from: "jimbocho", to: "otemachi", line: "METRO_HANZOMON", minutes: 3, km: 1.7 },
  { from: "otemachi", to: "kiyosumi_shirakawa", line: "METRO_HANZOMON", minutes: 7, km: 3.8 },
  { from: "kiyosumi_shirakawa", to: "oshiage", line: "METRO_HANZOMON", minutes: 8, km: 4.5 },

  // 副都心線・有楽町線・南北線
  { from: "hikarigaoka", to: "nerima", line: "METRO_YURAKUCHO", minutes: 8, km: 5.2 },
  { from: "nerima", to: "ikebukuro", line: "METRO_FUKUTOSHIN", minutes: 9, km: 6.0 },
  { from: "ikebukuro", to: "higashi_shinjuku", line: "METRO_FUKUTOSHIN", minutes: 6, km: 4.1 },
  { from: "higashi_shinjuku", to: "shinjuku_sanchome", line: "METRO_FUKUTOSHIN", minutes: 2, km: 1.1 },
  { from: "shinjuku_sanchome", to: "harajuku", line: "METRO_FUKUTOSHIN", minutes: 4, km: 2.6 },
  { from: "harajuku", to: "shibuya", line: "METRO_FUKUTOSHIN", minutes: 2, km: 1.2 },
  { from: "ikebukuro", to: "iidabashi", line: "METRO_YURAKUCHO", minutes: 9, km: 4.9 },
  { from: "iidabashi", to: "ichigaya", line: "METRO_YURAKUCHO", minutes: 2, km: 1.1 },
  { from: "ichigaya", to: "hibiya", line: "METRO_YURAKUCHO", minutes: 8, km: 3.9 },
  { from: "hibiya", to: "tsukishima", line: "METRO_YURAKUCHO", minutes: 6, km: 3.1 },
  { from: "tsukishima", to: "toyosu", line: "METRO_YURAKUCHO", minutes: 3, km: 1.4 },
  { from: "meguro", to: "shirokane_takanawa", line: "METRO_NAMBOKU", minutes: 4, km: 2.3 },
  { from: "shirokane_takanawa", to: "azabu_juban", line: "METRO_NAMBOKU", minutes: 3, km: 1.3 },
  { from: "azabu_juban", to: "iidabashi", line: "METRO_NAMBOKU", minutes: 12, km: 6.2 },
  { from: "iidabashi", to: "kasuga", line: "METRO_NAMBOKU", minutes: 2, km: 1.0 },
  { from: "kasuga", to: "oji_ekimae", line: "METRO_NAMBOKU", minutes: 11, km: 6.4 },

  // 千代田線
  { from: "harajuku", to: "hibiya", line: "METRO_CHIYODA", minutes: 11, km: 5.7 },
  { from: "hibiya", to: "otemachi", line: "METRO_CHIYODA", minutes: 2, km: 0.9 },
  { from: "otemachi", to: "ogawamachi", line: "METRO_CHIYODA", minutes: 2, km: 0.9 },
  { from: "ogawamachi", to: "nishi_nippori", line: "METRO_CHIYODA", minutes: 8, km: 4.3 },

  // ==================== 私鉄（都営線直通・接続路線） ====================
  // 京王線（都営新宿線直通）
  { from: "shinjuku", to: "sasazuka", line: "KEIO_MAIN", minutes: 5, km: 3.6 },
  { from: "sasazuka", to: "meidaimae", line: "KEIO_MAIN", minutes: 3, km: 1.6 },
  { from: "meidaimae", to: "chofu", line: "KEIO_MAIN", minutes: 11, km: 10.3 },
  // 井の頭線
  { from: "shibuya", to: "shimokitazawa", line: "KEIO_INOKASHIRA", minutes: 4, km: 3.0 },
  { from: "shimokitazawa", to: "meidaimae", line: "KEIO_INOKASHIRA", minutes: 3, km: 1.9 },
  { from: "meidaimae", to: "kichijoji", line: "KEIO_INOKASHIRA", minutes: 11, km: 7.8 },
  // 小田急線
  { from: "shinjuku", to: "shimokitazawa", line: "ODAKYU_MAIN", minutes: 7, km: 4.9 },
  // 東急東横線・目黒線（都営三田線直通）
  { from: "shibuya", to: "nakameguro", line: "TOKYU_TOYOKO", minutes: 3, km: 2.2 },
  { from: "nakameguro", to: "jiyugaoka", line: "TOKYU_TOYOKO", minutes: 6, km: 4.8 },
  { from: "jiyugaoka", to: "musashi_kosugi", line: "TOKYU_TOYOKO", minutes: 6, km: 3.8 },
  { from: "musashi_kosugi", to: "yokohama", line: "TOKYU_TOYOKO", minutes: 13, km: 13.4 },
  { from: "meguro", to: "musashi_kosugi", line: "TOKYU_MEGURO", minutes: 15, km: 9.8 },
  // 京急線（都営浅草線直通）
  { from: "sengakuji", to: "shinagawa", line: "KEIKYU_MAIN", minutes: 2, km: 1.2 },
  { from: "shinagawa", to: "haneda_airport", line: "KEIKYU_MAIN", minutes: 14, km: 13.5 },
  { from: "shinagawa", to: "yokohama", line: "KEIKYU_MAIN", minutes: 17, km: 22.2 },
  // 京成線（都営浅草線直通）
  { from: "oshiage", to: "motoyawata", line: "KEISEI_MAIN", minutes: 18, km: 14.5 },
  { from: "nippori", to: "motoyawata", line: "KEISEI_MAIN", minutes: 21, km: 17.8 },
  // ゆりかもめ
  { from: "shiodome", to: "daiba", line: "YURIKAMOME_LINE", minutes: 13, km: 6.2 },
  { from: "daiba", to: "toyosu", line: "YURIKAMOME_LINE", minutes: 16, km: 7.5 }
];

// おすすめ検索プリセット（都営無料の効果が分かりやすい例）
const PRESET_QUERIES = [
  { from: "shibuya", to: "asakusa", label: "渋谷 → 浅草", note: "メトロ銀座線1本 vs 青山一丁目/都バスで都営乗継" },
  { from: "ikebukuro", to: "roppongi", label: "池袋 → 六本木", note: "他社線＋大江戸線 vs 都バス＋都営地下鉄で0円ルート" },
  { from: "kichijoji", to: "higashi_ginza", label: "吉祥寺 → 東銀座", note: "京王/JR＋都営新宿線・浅草線の最安乗継ポイント" },
  { from: "shinjuku", to: "daiba", label: "新宿 → お台場", note: "りんかい線/ゆりかもめ vs 大江戸線＋都バス海01で0円" },
  { from: "shimokitazawa", to: "oshiage", label: "下北沢 → 押上", note: "京王/小田急から新宿経由で都営線0円区間を最大化" },
  { from: "musashi_kosugi", to: "otemachi", label: "武蔵小杉 → 大手町", note: "東急目黒線（目黒まで他社運賃）＋都営三田線直通0円" }
];
