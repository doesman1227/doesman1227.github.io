/* 自分のしくみ(SELF)の正典を検証する・切り口で引く(ブラウザと Node の両方で使う) */
(function (root) {
  'use strict';

  var KINDS = ['柱', '終わりに', 'ありたい姿', '現状', '隔たり', '原則', '手がかり', 'しるし',
               '差し出すもの', '問い', '続け方', 'ルーチン',
               'やりたい', '行きたい', '欲しい', 'やったこと', '行ったところ', '楽しかったこと'];
  var STATES = ['いま', 'これから', 'これまで'];
  var SCENES = ['住む', '着る', '食べる', '健康', 'おかね'];
  var OPTIONAL_STRINGS = ['memo', 'key', 'state', 'date', 'source', 'ref', 'ref_label'];

  function toPillarList(v) {
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v : [v];
  }

  function pillarKeys(items) {
    if (!Array.isArray(items)) return [];
    var out = [];
    items.forEach(function (it) {
      if (it && it.kind === '柱' && typeof it.key === 'string' && it.key !== '' &&
          out.indexOf(it.key) === -1) out.push(it.key);
    });
    return out;
  }

  function validateSelf(items) {
    if (!Array.isArray(items)) return ['データが配列ではありません'];
    var errors = [];
    var keys = pillarKeys(items);
    var seen = Object.create(null);
    items.forEach(function (it, n) {
      var where = '[' + n + '] ' + (it && it.title ? it.title : '(titleなし)') + ': ';
      if (!it || typeof it !== 'object') { errors.push('[' + n + '] 項目がオブジェクトではありません'); return; }

      if (typeof it.title !== 'string' || it.title.trim() === '') errors.push(where + 'title が空です');
      if (KINDS.indexOf(it.kind) === -1) errors.push(where + 'kind が不正です: ' + it.kind);

      OPTIONAL_STRINGS.forEach(function (f) {
        if (it[f] !== undefined && typeof it[f] !== 'string') {
          errors.push(where + f + ' は文字列にしてください');
        }
      });
      if (it.state !== undefined && STATES.indexOf(it.state) === -1) {
        errors.push(where + 'state が不正です: ' + it.state);
      }

      if (it.kind === '柱') {
        if (typeof it.key !== 'string' || it.key.trim() === '') {
          errors.push(where + '柱は key が必要です');
        } else if (seen[it.key]) {
          errors.push(where + 'key が重複しています: ' + it.key);
        } else {
          seen[it.key] = true;
        }
        if (it.pillar !== undefined) errors.push(where + '柱は pillar を持てません');
      } else {
        toPillarList(it.pillar).forEach(function (p) {
          if (keys.indexOf(p) === -1) errors.push(where + 'pillar が不正です: ' + p);
        });
      }

      if (it.kind === '問い' && (typeof it.key !== 'string' || it.key.trim() === '')) {
        errors.push(where + '問いは key が必要です');
      }
      if (it.kind === 'ルーチン' && it.key !== undefined && SCENES.indexOf(it.key) === -1) {
        errors.push(where + 'key は五つの場面から選んでください: ' + it.key);
      }
    });
    return errors;
  }

  function byKind(items, kind) {
    if (!Array.isArray(items)) return [];
    return items.filter(function (it) { return it && it.kind === kind; });
  }

  function groupByKey(items, kind) {
    var order = [];
    var bucket = Object.create(null);
    byKind(items, kind).forEach(function (it) {
      var k = typeof it.key === 'string' ? it.key : '';
      if (!(k in bucket)) { bucket[k] = []; order.push(k); }
      bucket[k].push(it);
    });
    return order.map(function (k) { return { key: k, items: bucket[k] }; });
  }

  function byPillar(items, pillarKey) {
    if (!Array.isArray(items)) return [];
    return items.filter(function (it) {
      return it && it.kind !== '柱' && toPillarList(it.pillar).indexOf(pillarKey) !== -1;
    });
  }

  var api = {
    KINDS: KINDS, STATES: STATES, SCENES: SCENES,
    validateSelf: validateSelf, pillarKeys: pillarKeys, toPillarList: toPillarList,
    byKind: byKind, groupByKey: groupByKey, byPillar: byPillar
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Self = api;
})(this);
