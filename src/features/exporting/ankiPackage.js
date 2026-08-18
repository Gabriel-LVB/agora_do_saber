import { strToU8, zipSync } from 'fflate';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DECK_ID = 1740000000000;
const BASIC_MODEL_ID = 1740000000001;
const CLOZE_MODEL_ID = 1740000000002;
const FIELD_SEPARATOR = '\u001f';
const LATEX_PRE = String.raw`\documentclass[12pt]{article}
\special{papersize=3in,5in}
\usepackage[utf8]{inputenc}
\usepackage{amssymb,amsmath}
\pagestyle{empty}
\setlength{\parindent}{0in}
\begin{document}`;

const SCHEMA_SQL = `
CREATE TABLE col (
  id integer PRIMARY KEY, crt integer NOT NULL, mod integer NOT NULL,
  scm integer NOT NULL, ver integer NOT NULL, dty integer NOT NULL,
  usn integer NOT NULL, ls integer NOT NULL, conf text NOT NULL,
  models text NOT NULL, decks text NOT NULL, dconf text NOT NULL,
  tags text NOT NULL
);
CREATE TABLE notes (
  id integer PRIMARY KEY, guid text NOT NULL, mid integer NOT NULL,
  mod integer NOT NULL, usn integer NOT NULL, tags text NOT NULL,
  flds text NOT NULL, sfld integer NOT NULL, csum integer NOT NULL,
  flags integer NOT NULL, data text NOT NULL
);
CREATE TABLE cards (
  id integer PRIMARY KEY, nid integer NOT NULL, did integer NOT NULL,
  ord integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL,
  type integer NOT NULL, queue integer NOT NULL, due integer NOT NULL,
  ivl integer NOT NULL, factor integer NOT NULL, reps integer NOT NULL,
  lapses integer NOT NULL, left integer NOT NULL, odue integer NOT NULL,
  odid integer NOT NULL, flags integer NOT NULL, data text NOT NULL
);
CREATE TABLE revlog (
  id integer PRIMARY KEY, cid integer NOT NULL, usn integer NOT NULL,
  ease integer NOT NULL, ivl integer NOT NULL, lastIvl integer NOT NULL,
  factor integer NOT NULL, time integer NOT NULL, type integer NOT NULL
);
CREATE TABLE graves (usn integer NOT NULL, oid integer NOT NULL, type integer NOT NULL);
CREATE INDEX ix_notes_usn ON notes (usn);
CREATE INDEX ix_cards_usn ON cards (usn);
CREATE INDEX ix_revlog_usn ON revlog (usn);
CREATE INDEX ix_cards_nid ON cards (nid);
CREATE INDEX ix_cards_sched ON cards (did, queue, due);
CREATE INDEX ix_revlog_cid ON revlog (cid);
CREATE INDEX ix_notes_csum ON notes (csum);
`;

const field = (name, ord) => ({
  name,
  ord,
  sticky:false,
  rtl:false,
  font:'Arial',
  size:20,
  media:[],
});

const template = ({ name, qfmt, afmt }) => ({
  name,
  ord:0,
  qfmt,
  afmt,
  bqfmt:'',
  bafmt:'',
  did:null,
  bfont:'',
  bsize:0,
});

const model = ({ id, name, type, fields, template:cardTemplate, css, now }) => ({
  id,
  name,
  type,
  mod:now,
  usn:-1,
  sortf:0,
  did:DECK_ID,
  tmpls:[cardTemplate],
  flds:fields.map(field),
  css,
  latexPre:LATEX_PRE,
  latexPost:'\\end{document}',
  latexsvg:false,
  req:[[0, 'all', [0]]],
  tags:[],
  vers:[],
});

const digestHex = async value => {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await globalThis.crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const numericId = (hex, offset = 0n) => {
  const span = 700000000000n;
  return Number(1700000000000n + ((BigInt(`0x${hex.slice(0, 15)}`) + offset) % span));
};

const plainText = value => String(value || '')
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const defaultDeckConfig = now => ({
  id:1,
  name:'Padrão',
  mod:now,
  usn:0,
  maxTaken:60,
  autoplay:true,
  timer:0,
  replayq:true,
  new:{ perDay:20, delays:[1,10], separate:true, ints:[1,4,7], initialFactor:2500, bury:true, order:1 },
  rev:{ perDay:200, fuzz:0.05, ivlFct:1, maxIvl:36500, ease4:1.3, bury:true, minSpace:1 },
  lapse:{ leechFails:8, minInt:1, delays:[10], leechAction:0, mult:0 },
});

const deck = (deckName, now) => ({
  id:DECK_ID,
  name:deckName,
  desc:'Flashcards do Ágora do Saber. A organização é feita por tags hierárquicas.',
  mod:now,
  usn:-1,
  dyn:0,
  collapsed:false,
  browserCollapsed:false,
  conf:1,
  extendNew:0,
  extendRev:0,
  newToday:[0,0],
  revToday:[0,0],
  lrnToday:[0,0],
  timeToday:[0,0],
});

const uniqueCards = cards => {
  const seen = new Set();
  return (cards || []).filter(card => {
    const key = String(card?.stableKey || card?.fields?.join(FIELD_SEPARATOR) || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const createAnkiPackage = async ({ cards, deckName, css }) => {
  const packageCards = uniqueCards(cards);
  if (!packageCards.length) throw new Error('EMPTY_ANKI_PACKAGE');

  const SQL = await initSqlJs({ locateFile:() => sqlWasmUrl });
  const db = new SQL.Database();
  const now = Math.floor(Date.now() / 1000);
  const nowMs = Date.now();
  const models = {
    [BASIC_MODEL_ID]:model({
      id:BASIC_MODEL_ID,
      name:'Ágora Flashcard v5',
      type:0,
      fields:['Front', 'Answer', 'Explanation', 'Source'],
      template:template({
        name:'Card 1',
        qfmt:'<main class="agora-card"><section class="agora-front">{{Front}}</section></main>',
        afmt:'<main class="agora-card"><section class="agora-back-question">{{Front}}</section><section class="agora-answer">{{Answer}}</section>{{#Explanation}}<section class="agora-explain">{{Explanation}}</section>{{/Explanation}}</main>',
      }),
      css,
      now,
    }),
    [CLOZE_MODEL_ID]:model({
      id:CLOZE_MODEL_ID,
      name:'Ágora Cloze v2',
      type:1,
      fields:['Text', 'Extra', 'Source'],
      template:template({
        name:'Cloze',
        qfmt:'<main class="agora-card"><section class="agora-front">{{cloze:Text}}</section></main>',
        afmt:'<main class="agora-card"><section class="agora-front">{{cloze:Text}}</section>{{#Extra}}<section class="agora-explain">{{Extra}}</section>{{/Extra}}</main>',
      }),
      css,
      now,
    }),
  };
  const decks = { [DECK_ID]:deck(deckName, now) };
  const conf = {
    nextPos:packageCards.length + 1,
    estTimes:true,
    activeDecks:[DECK_ID],
    sortType:'noteFld',
    timeLim:0,
    sortBackwards:false,
    addToCur:true,
    curDeck:DECK_ID,
    curModel:BASIC_MODEL_ID,
    newBury:true,
    newSpread:0,
    dueCounts:true,
    collapseTime:1200,
    schedVer:2,
  };

  db.run(SCHEMA_SQL);
  db.run(
    'INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [1, now, nowMs, nowMs, 11, 0, 0, 0, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify({1:defaultDeckConfig(now)}), '{}']
  );

  const prepared = await Promise.all(packageCards.map(async (card, index) => {
    const stableKey = `${card.type || 'basic'}|${card.stableKey}|${card.fields.join(FIELD_SEPARATOR)}`;
    const [noteHash, cardHash, checksumHash] = await Promise.all([
      digestHex(`note|${stableKey}`),
      digestHex(`card|${stableKey}`),
      digestHex(plainText(card.fields[0])),
    ]);
    return {
      ...card,
      noteId:numericId(noteHash),
      cardId:numericId(cardHash, 800000000000n),
      guid:noteHash.slice(0, 20),
      checksum:Number.parseInt(checksumHash.slice(0, 8), 16) >>> 0,
      due:index + 1,
    };
  }));

  const insertNote = db.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertCard = db.prepare('INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  try {
    db.run('BEGIN');
    prepared.forEach(card => {
      const modelId = card.type === 'cloze' ? CLOZE_MODEL_ID : BASIC_MODEL_ID;
      const tags = ` ${(card.tags || []).join(' ')} `;
      insertNote.run([
        card.noteId,
        card.guid,
        modelId,
        now,
        -1,
        tags,
        card.fields.join(FIELD_SEPARATOR),
        plainText(card.fields[0]),
        card.checksum,
        0,
        '',
      ]);
      insertCard.run([
        card.cardId,
        card.noteId,
        DECK_ID,
        0,
        now,
        -1,
        0,
        0,
        card.due,
        0,
        2500,
        0,
        0,
        0,
        0,
        0,
        0,
        '',
      ]);
    });
    db.run('COMMIT');
  } catch(error) {
    db.run('ROLLBACK');
    throw error;
  } finally {
    insertNote.free();
    insertCard.free();
  }

  const collection = db.export();
  db.close();
  return zipSync({
    'collection.anki2':collection,
    media:strToU8('{}'),
  }, { level:6 });
};

export const downloadAnkiPackage = ({ bytes, filename }) => {
  const blob = new Blob([bytes], { type:'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
