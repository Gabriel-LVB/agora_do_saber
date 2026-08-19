import{n as e}from"./rolldown-runtime-Bh1tDfsg.js";import{i as t,n}from"./fflate-vendor-CV66q1LI.js";import{n as r,t as i}from"./sql-vendor-Bz7sY320.js";var a=e(r()),o=174e10,s=1740000000001,c=1740000000002,l=``,u=String.raw`\documentclass[12pt]{article}
\special{papersize=3in,5in}
\usepackage[utf8]{inputenc}
\usepackage{amssymb,amsmath}
\pagestyle{empty}
\setlength{\parindent}{0in}
\begin{document}`,d=`
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
`,f=(e,t)=>({name:e,ord:t,sticky:!1,rtl:!1,font:`Arial`,size:20,media:[]}),p=({name:e,qfmt:t,afmt:n})=>({name:e,ord:0,qfmt:t,afmt:n,bqfmt:``,bafmt:``,did:null,bfont:``,bsize:0}),m=({id:e,name:t,type:n,fields:r,template:i,css:a,now:s})=>({id:e,name:t,type:n,mod:s,usn:-1,sortf:0,did:o,tmpls:[i],flds:r.map(f),css:a,latexPre:u,latexPost:`\\end{document}`,latexsvg:!1,req:[[0,`all`,[0]]],tags:[],vers:[]}),h=async e=>{let t=new TextEncoder().encode(String(e||``)),n=await globalThis.crypto.subtle.digest(`SHA-1`,t);return Array.from(new Uint8Array(n),e=>e.toString(16).padStart(2,`0`)).join(``)},g=(e,t=0n)=>Number(1700000000000n+(BigInt(`0x${e.slice(0,15)}`)+t)%700000000000n),_=e=>String(e||``).replace(/<br\s*\/?\s*>/gi,` `).replace(/<[^>]+>/g,``).replace(/&[a-z0-9#]+;/gi,` `).replace(/\s+/g,` `).trim(),v=e=>({id:1,name:`Padrão`,mod:e,usn:0,maxTaken:60,autoplay:!0,timer:0,replayq:!0,new:{perDay:20,delays:[1,10],separate:!0,ints:[1,4,7],initialFactor:2500,bury:!0,order:1},rev:{perDay:200,fuzz:.05,ivlFct:1,maxIvl:36500,ease4:1.3,bury:!0,minSpace:1},lapse:{leechFails:8,minInt:1,delays:[10],leechAction:0,mult:0}}),y=(e,t)=>({id:o,name:e,desc:`Flashcards do Ágora do Saber. A organização é feita por tags hierárquicas.`,mod:t,usn:-1,dyn:0,collapsed:!1,browserCollapsed:!1,conf:1,extendNew:0,extendRev:0,newToday:[0,0],revToday:[0,0],lrnToday:[0,0],timeToday:[0,0]}),b=e=>{let t=new Set;return(e||[]).filter(e=>{let n=String(e?.stableKey||e?.fields?.join(l)||``);return!n||t.has(n)?!1:(t.add(n),!0)})},x=async({cards:e,deckName:r,css:u})=>{let f=b(e);if(!f.length)throw Error(`EMPTY_ANKI_PACKAGE`);let x=new(await((0,a.default)({locateFile:()=>i}))).Database,S=Math.floor(Date.now()/1e3),C=Date.now(),w={[s]:m({id:s,name:`Ágora Flashcard v5`,type:0,fields:[`Front`,`Answer`,`Explanation`,`Source`],template:p({name:`Card 1`,qfmt:`<main class="agora-card"><section class="agora-front">{{Front}}</section></main>`,afmt:`<main class="agora-card"><section class="agora-back-question">{{Front}}</section><section class="agora-answer">{{Answer}}</section>{{#Explanation}}<section class="agora-explain">{{Explanation}}</section>{{/Explanation}}</main>`}),css:u,now:S}),[c]:m({id:c,name:`Ágora Cloze v2`,type:1,fields:[`Text`,`Extra`,`Source`],template:p({name:`Cloze`,qfmt:`<main class="agora-card"><section class="agora-front">{{cloze:Text}}</section></main>`,afmt:`<main class="agora-card"><section class="agora-front">{{cloze:Text}}</section>{{#Extra}}<section class="agora-explain">{{Extra}}</section>{{/Extra}}</main>`}),css:u,now:S})},T={[o]:y(r,S)},E={nextPos:f.length+1,estTimes:!0,activeDecks:[o],sortType:`noteFld`,timeLim:0,sortBackwards:!1,addToCur:!0,curDeck:o,curModel:s,newBury:!0,newSpread:0,dueCounts:!0,collapseTime:1200,schedVer:2};x.run(d),x.run(`INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[1,S,C,C,11,0,0,0,JSON.stringify(E),JSON.stringify(w),JSON.stringify(T),JSON.stringify({1:v(S)}),`{}`]);let D=await Promise.all(f.map(async(e,t)=>{let n=`${e.type||`basic`}|${e.stableKey}|${e.fields.join(l)}`,[r,i,a]=await Promise.all([h(`note|${n}`),h(`card|${n}`),h(_(e.fields[0]))]);return{...e,noteId:g(r),cardId:g(i,800000000000n),guid:r.slice(0,20),checksum:Number.parseInt(a.slice(0,8),16)>>>0,due:t+1}})),O=x.prepare(`INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),k=x.prepare(`INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);try{x.run(`BEGIN`),D.forEach(e=>{let t=e.type===`cloze`?c:s,n=` ${(e.tags||[]).join(` `)} `;O.run([e.noteId,e.guid,t,S,-1,n,e.fields.join(l),_(e.fields[0]),e.checksum,0,``]),k.run([e.cardId,e.noteId,o,0,S,-1,0,0,e.due,0,2500,0,0,0,0,0,0,``])}),x.run(`COMMIT`)}catch(e){throw x.run(`ROLLBACK`),e}finally{O.free(),k.free()}let A=x.export();return x.close(),t({"collection.anki2":A,media:n(`{}`)},{level:6})},S=({bytes:e,filename:t})=>{let n=new Blob([e],{type:`application/octet-stream`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),i.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3)};export{x as createAnkiPackage,S as downloadAnkiPackage};