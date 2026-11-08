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
