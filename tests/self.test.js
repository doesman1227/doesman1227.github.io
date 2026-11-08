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
    { kind: 'やりたい', title: '部屋を片付けて、物を減らす', state: 'これから', memo: 'm' },
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
  const e = S.validateSelf([{ kind: 'やりたい', title: 'x', state: 'むかし' }]);
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
