const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../self.js');

const 柱 = (key, title) => ({ kind: '柱', key, title, memo: 'm' });

test('validateSelf: 配列でなければその1件だけ返す', () => {
  assert.deepEqual(S.validateSelf(null), ['データが配列ではありません']);
  assert.deepEqual(S.validateSelf({}), ['データが配列ではありません']);
});

test('validateSelf: 正しいデータはエラーなし', () => {
  const items = [
    柱('知る', '世界そのものを知りたい'),
    { kind: '手がかり', title: '心惹かれる世界に触れる機会をつくる。', pillar: '知る' },
    { kind: '問い', key: '自分について', title: 'なぜ人間は刺激を求めるのか' },
    { kind: 'ありたい姿', title: '素敵なものだけに囲まれて暮らす', memo: 'm' },
    { kind: 'ルーチン', key: '健康', title: '歩いたあとの感覚を記録する' }
  ];
  assert.deepEqual(S.validateSelf(items), []);
});

test('validateSelf: title が空', () => {
  const e = S.validateSelf([{ kind: '柱', key: '知る', title: '  ' }]);
  assert.equal(e.length, 1);
  assert.match(e[0], /title が空です/);
});

test('validateSelf: kind が未知', () => {
  const e = S.validateSelf([{ kind: '感想', title: 'x' }]);
  assert.equal(e.length, 1);
  assert.match(e[0], /kind が不正です: 感想/);
});

test('validateSelf: 柱の key が無い・重複する', () => {
  assert.match(S.validateSelf([{ kind: '柱', title: 'x' }])[0], /柱は key が必要です/);
  const dup = S.validateSelf([柱('知る', 'a'), 柱('知る', 'b')]);
  assert.equal(dup.length, 1);
  assert.match(dup[0], /key が重複しています/);
});

test('validateSelf: pillar は既知の柱でなければならない', () => {
  const e = S.validateSelf([柱('知る', 'a'), { kind: 'しるし', title: 'x', pillar: '飛ぶ' }]);
  assert.equal(e.length, 1);
  assert.match(e[0], /pillar が不正です: 飛ぶ/);
});

test('validateSelf: 柱は pillar を持てない', () => {
  const e = S.validateSelf([柱('知る', 'a'), { kind: '柱', key: '創る', title: 'b', pillar: '知る' }]);
  assert.equal(e.length, 1);
  assert.match(e[0], /柱は pillar を持てません/);
});

test('validateSelf: state が未知', () => {
  const e = S.validateSelf([{ kind: 'ありたい姿', title: 'x', state: 'むかし' }]);
  assert.match(e[0], /state が不正です: むかし/);
});

test('validateSelf: 問いは key が必要', () => {
  assert.match(S.validateSelf([{ kind: '問い', title: 'x' }])[0], /問いは key が必要です/);
});

test('validateSelf: ルーチンの key は五つの場面から選ぶ', () => {
  const e = S.validateSelf([{ kind: 'ルーチン', key: '仕事', title: 'x' }]);
  assert.match(e[0], /key は五つの場面から選んでください: 仕事/);
});

test('validateSelf: 任意欄が文字列でない', () => {
  const e = S.validateSelf([{ kind: 'しるし', title: 'x', memo: 3 }]);
  assert.match(e[0], /memo は文字列にしてください/);
});

test('pillarKeys は初出順', () => {
  assert.deepEqual(S.pillarKeys([柱('歩く', 'a'), { kind: 'しるし', title: 'z' }, 柱('知る', 'b')]),
                   ['歩く', '知る']);
});

test('toPillarList', () => {
  assert.deepEqual(S.toPillarList(undefined), []);
  assert.deepEqual(S.toPillarList('知る'), ['知る']);
  assert.deepEqual(S.toPillarList(['知る', '創る']), ['知る', '創る']);
});

const sample = [
  { kind: '柱', key: '知る', title: '世界そのものを知りたい', memo: 'm' },
  { kind: '柱', key: '創る', title: '何かを生み出したい', memo: 'm' },
  { kind: '問い', key: '自分について', title: 'なぜ人間は刺激を求めるのか' },
  { kind: '問い', key: '暮らしと、時間と', title: '精神的な自由を保つにはどうすればいいか' },
  { kind: '問い', key: '自分について', title: '安定と刺激の最適なバランスはどこか' },
  { kind: '手がかり', title: '成果に結びつけずに楽しむ。', pillar: ['知る', '創る'] },
  { kind: 'しるし', title: '思い出の数', pillar: '知る' }
];

test('byKind は元の並び順を保つ', () => {
  assert.deepEqual(S.byKind(sample, '問い').map(i => i.title), [
    'なぜ人間は刺激を求めるのか',
    '精神的な自由を保つにはどうすればいいか',
    '安定と刺激の最適なバランスはどこか'
  ]);
  assert.deepEqual(S.byKind(sample, 'ルーチン'), []);
});

test('groupByKey は key の初出順で束ねる', () => {
  const g = S.groupByKey(sample, '問い');
  assert.deepEqual(g.map(x => x.key), ['自分について', '暮らしと、時間と']);
  assert.equal(g[0].items.length, 2);
  assert.equal(g[1].items.length, 1);
});

test('groupByKey: key の無い項目は落とさず "" に束ねる', () => {
  const g = S.groupByKey([{ kind: 'しるし', title: 'x' }], 'しるし');
  assert.deepEqual(g.map(x => x.key), ['']);
});

test('byPillar は柱自身を含めない', () => {
  assert.deepEqual(S.byPillar(sample, '知る').map(i => i.kind), ['手がかり', 'しるし']);
  assert.deepEqual(S.byPillar(sample, '創る').map(i => i.kind), ['手がかり']);
  assert.deepEqual(S.byPillar(sample, '歩く'), []);
});

const fs = require('node:fs');
const path = require('node:path');
const canon = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'self.json'), 'utf8'));

test('self.json が検証を通る', () => {
  assert.deepEqual(S.validateSelf(canon.items), []);
});

test('self.json: 公開される旨の注意が note にある', () => {
  assert.match(canon.note, /公開/);
});

test('self.json: 生き方の件数がそろっている', () => {
  const n = k => S.byKind(canon.items, k).length;
  assert.equal(n('柱'), 7);
  assert.equal(n('終わりに'), 5);
  assert.equal(n('ありたい姿'), 6);
  assert.equal(n('現状'), 6);
  assert.equal(n('隔たり'), 4);
  assert.equal(n('原則'), 5);
  assert.equal(n('手がかり'), 5);
  assert.equal(n('しるし'), 3);
  assert.equal(n('差し出すもの'), 3);
  assert.equal(n('問い'), 23);
});

test('self.json: 柱は7つの動詞', () => {
  assert.deepEqual(S.pillarKeys(canon.items),
    ['知る', '感じる', '歩く', '関わる', '創る', '楽しむ', '素直に']);
});

test('self.json: 問いは4群に分かれる', () => {
  assert.deepEqual(S.groupByKey(canon.items, '問い').map(g => g.key),
    ['暮らしと、時間と', '生きることについて', '自分について', '人と、仕事と']);
});

test('self.json: 柱に載らないありたい姿が2件ある', () => {
  const orphan = S.byKind(canon.items, 'ありたい姿').filter(i => S.toPillarList(i.pillar).length === 0);
  assert.equal(orphan.length, 2);
});

test('self.json: 続け方は4件で、pillar は付かない', () => {
  const got = S.byKind(canon.items, '続け方');
  assert.equal(got.length, 4);
  assert.ok(got.every(i => i.memo && i.pillar === undefined));
});

test('self.json: ルーチンはまだ0件(受け皿だけある)', () => {
  assert.equal(S.byKind(canon.items, 'ルーチン').length, 0);
  assert.deepEqual(S.validateSelf(canon.items), []);
});

test('self.json: 移した六つの kind はもう入っていない', () => {
  // 経験・体験 / 場所・旅行 / モノ の各 build_items.py が正典。ここに戻すと二正典になる。
  ['やりたい', '行きたい', '欲しい', 'やったこと', '行ったところ', '楽しかったこと']
    .forEach(k => assert.equal(S.byKind(canon.items, k).length, 0, k + ' が残っています'));
});

test('self.json: 残った項目は state を持たない', () => {
  // state(いま/これから/これまで)は移した六つのための欄だった
  canon.items.forEach(i => assert.equal(i.state, undefined, i.title + ' に state があります'));
});

test('KINDS / STATES / SCENES の値は固定（後続のページとデータが依存する）', () => {
  assert.deepEqual(S.KINDS, [
    '柱', '終わりに', 'ありたい姿', '現状', '隔たり', '原則', '手がかり', 'しるし',
    '差し出すもの', '問い', '続け方', 'ルーチン'
  ]);
  assert.deepEqual(S.STATES, ['いま', 'これから', 'これまで']);
  assert.deepEqual(S.SCENES, ['住む', '着る', '食べる', '健康', 'おかね']);
});

test('groupByKey は prototype 由来の名前の key でも壊れない', () => {
  const items = [
    { kind: '問い', key: 'constructor', title: 'a' },
    { kind: '問い', key: '__proto__', title: 'b' },
    { kind: '問い', key: 'toString', title: 'c' },
    { kind: '問い', key: 'constructor', title: 'd' }
  ];
  const g = S.groupByKey(items, '問い');
  assert.deepEqual(g.map(x => x.key), ['constructor', '__proto__', 'toString']);
  assert.equal(g[0].items.length, 2);
  assert.equal(g[1].items.length, 1);
});

test('self.json: pillar の割り振りと ref_label の裁定が守られている', () => {
  const keys = S.pillarKeys(canon.items);
  const counts = {};
  keys.forEach(k => { counts[k] = S.byPillar(canon.items, k).length; });
  assert.deepEqual(counts, { 知る: 3, 感じる: 3, 歩く: 3, 関わる: 3, 創る: 2, 楽しむ: 3, 素直に: 8 });

  const labelled = canon.items.filter(i => i.ref_label !== undefined);
  assert.equal(labelled.length, 6);
  labelled.forEach(i => assert.ok(i.ref, i.title + ' に ref が無い'));
  assert.deepEqual(S.byKind(canon.items, '柱').filter(i => i.ref_label).map(i => i.ref_label),
    ['旅', '創り方']);

  const noRef = S.byKind(canon.items, '原則').filter(i => i.ref === undefined);
  assert.equal(noRef.length, 1);
  assert.match(noRef[0].memo, /（下記）$/);
});

test('validateSelf は prototype 由来の名前の柱の key を誤って重複としない', () => {
  const items = [
    { kind: '柱', key: 'constructor', title: 'a', memo: 'm' },
    { kind: '柱', key: '__proto__', title: 'b', memo: 'm' },
    { kind: '柱', key: 'toString', title: 'c', memo: 'm' }
  ];
  assert.deepEqual(S.validateSelf(items), []);
});
