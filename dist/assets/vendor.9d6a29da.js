var Yu=Object.defineProperty,Xu=Object.defineProperties;var Ju=Object.getOwnPropertyDescriptors;var wo=Object.getOwnPropertySymbols;var Zu=Object.prototype.hasOwnProperty,th=Object.prototype.propertyIsEnumerable;var Ro=(n,t,e)=>t in n?Yu(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e,It=(n,t)=>{for(var e in t||(t={}))Zu.call(t,e)&&Ro(n,e,t[e]);if(wo)for(var e of wo(t))th.call(t,e)&&Ro(n,e,t[e]);return n},Kn=(n,t)=>Xu(n,Ju(t));/*
object-assign
(c) Sindre Sorhus
@license MIT
*/var So=Object.getOwnPropertySymbols,eh=Object.prototype.hasOwnProperty,nh=Object.prototype.propertyIsEnumerable;function rh(n){if(n==null)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(n)}function sh(){try{if(!Object.assign)return!1;var n=new String("abc");if(n[5]="de",Object.getOwnPropertyNames(n)[0]==="5")return!1;for(var t={},e=0;e<10;e++)t["_"+String.fromCharCode(e)]=e;var r=Object.getOwnPropertyNames(t).map(function(o){return t[o]});if(r.join("")!=="0123456789")return!1;var s={};return"abcdefghijklmnopqrst".split("").forEach(function(o){s[o]=o}),Object.keys(Object.assign({},s)).join("")==="abcdefghijklmnopqrst"}catch{return!1}}var op=sh()?Object.assign:function(n,t){for(var e,r=rh(n),s,o=1;o<arguments.length;o++){e=Object(arguments[o]);for(var a in e)eh.call(e,a)&&(r[a]=e[a]);if(So){s=So(e);for(var h=0;h<s.length;h++)nh.call(e,s[h])&&(r[s[h]]=e[s[h]])}}return r};const ih=()=>{};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bo=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?t[e++]=s:s<2048?(t[e++]=s>>6|192,t[e++]=s&63|128):(s&64512)==55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)==56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=s>>18|240,t[e++]=s>>12&63|128,t[e++]=s>>6&63|128,t[e++]=s&63|128):(t[e++]=s>>12|224,t[e++]=s>>6&63|128,t[e++]=s&63|128)}return t},oh=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const s=n[e++];if(s<128)t[r++]=String.fromCharCode(s);else if(s>191&&s<224){const o=n[e++];t[r++]=String.fromCharCode((s&31)<<6|o&63)}else if(s>239&&s<365){const o=n[e++],a=n[e++],h=n[e++],l=((s&7)<<18|(o&63)<<12|(a&63)<<6|h&63)-65536;t[r++]=String.fromCharCode(55296+(l>>10)),t[r++]=String.fromCharCode(56320+(l&1023))}else{const o=n[e++],a=n[e++];t[r++]=String.fromCharCode((s&15)<<12|(o&63)<<6|a&63)}}return t.join("")},Po={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const o=n[s],a=s+1<n.length,h=a?n[s+1]:0,l=s+2<n.length,f=l?n[s+2]:0,g=o>>2,v=(o&3)<<4|h>>4;let R=(h&15)<<2|f>>6,P=f&63;l||(P=64,a||(R=64)),r.push(e[g],e[v],e[R],e[P])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(bo(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):oh(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const o=e[n.charAt(s++)],h=s<n.length?e[n.charAt(s)]:0;++s;const f=s<n.length?e[n.charAt(s)]:64;++s;const v=s<n.length?e[n.charAt(s)]:64;if(++s,o==null||h==null||f==null||v==null)throw new ah;const R=o<<2|h>>4;if(r.push(R),f!==64){const P=h<<4&240|f>>2;if(r.push(P),v!==64){const k=f<<6&192|v;r.push(k)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class ah extends Error{constructor(){super(...arguments);this.name="DecodeBase64StringError"}}const ch=function(n){const t=bo(n);return Po.encodeByteArray(t,!0)},Wn=function(n){return ch(n).replace(/\./g,"")},uh=function(n){try{return Po.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hh(){if(typeof self!="undefined")return self;if(typeof window!="undefined")return window;if(typeof global!="undefined")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lh=()=>hh().__FIREBASE_DEFAULTS__,dh=()=>{!(typeof process=="undefined"||typeof process.env=="undefined")},fh=()=>{if(typeof document=="undefined")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&uh(n[1]);return t&&JSON.parse(t)},Qn=()=>{try{return ih()||lh()||dh()||fh()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},mh=n=>{var t,e;return(e=(t=Qn())==null?void 0:t.emulatorHosts)==null?void 0:e[n]},ph=n=>{const t=mh(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},Co=()=>{var n;return(n=Qn())==null?void 0:n.config},ap=n=>{var t;return(t=Qn())==null?void 0:t[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gh{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _h(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",s=n.iat||0,o=n.sub||n.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a=It({iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}}},n),h="";return[Wn(JSON.stringify(e)),Wn(JSON.stringify(a)),h].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cs(){return typeof navigator!="undefined"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function cp(){return typeof window!="undefined"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(cs())}function yh(){var t;const n=(t=Qn())==null?void 0:t.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function up(){return typeof navigator!="undefined"&&navigator.userAgent==="Cloudflare-Workers"}function hp(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function lp(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function dp(){const n=cs();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function Eh(){return!yh()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Th(){try{return typeof indexedDB=="object"}catch{return!1}}function vh(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{e=!1},s.onerror=()=>{var o;t(((o=s.error)==null?void 0:o.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ih="FirebaseError";class be extends Error{constructor(t,e,r){super(e);this.code=t,this.customData=r,this.name=Ih,Object.setPrototypeOf(this,be.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Vo.prototype.create)}}class Vo{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},s=`${this.service}/${t}`,o=this.errors[t],a=o?Ah(o,r):"Error",h=`${this.serviceName}: ${a} (${s}).`;return new be(s,h,r)}}function Ah(n,t){return n.replace(wh,(e,r)=>{const s=t[r];return s!=null?String(s):`<${r}?>`})}const wh=/\{\$([^}]+)}/g;function fp(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}function Yn(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const s of e){if(!r.includes(s))return!1;const o=n[s],a=t[s];if(Do(o)&&Do(a)){if(!Yn(o,a))return!1}else if(o!==a)return!1}for(const s of r)if(!e.includes(s))return!1;return!0}function Do(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mp(n){const t=[];for(const[e,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{t.push(encodeURIComponent(e)+"="+encodeURIComponent(s))}):t.push(encodeURIComponent(e)+"="+encodeURIComponent(r));return t.length?"&"+t.join("&"):""}function pp(n,t){const e=new Rh(n,t);return e.subscribe.bind(e)}class Rh{constructor(t,e){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=e,this.task.then(()=>{t(this)}).catch(r=>{this.error(r)})}next(t){this.forEachObserver(e=>{e.next(t)})}error(t){this.forEachObserver(e=>{e.error(t)}),this.close(t)}complete(){this.forEachObserver(t=>{t.complete()}),this.close()}subscribe(t,e,r){let s;if(t===void 0&&e===void 0&&r===void 0)throw new Error("Missing Observer.");Sh(t,["next","error","complete"])?s=t:s={next:t,error:e,complete:r},s.next===void 0&&(s.next=us),s.error===void 0&&(s.error=us),s.complete===void 0&&(s.complete=us);const o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),o}unsubscribeOne(t){this.observers===void 0||this.observers[t]===void 0||(delete this.observers[t],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(t){if(!this.finalized)for(let e=0;e<this.observers.length;e++)this.sendOne(e,t)}sendOne(t,e){this.task.then(()=>{if(this.observers!==void 0&&this.observers[t]!==void 0)try{e(this.observers[t])}catch(r){typeof console!="undefined"&&console.error&&console.error(r)}})}close(t){this.finalized||(this.finalized=!0,t!==void 0&&(this.finalError=t),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Sh(n,t){if(typeof n!="object"||n===null)return!1;for(const e of t)if(e in n&&typeof n[e]=="function")return!0;return!1}function us(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pe(n){return n&&n._delegate?n._delegate:n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function No(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function bh(n){return(await fetch(n,{credentials:"include"})).ok}class an{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const de="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ph{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new gh;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:e});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){var s;const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(s=t==null?void 0:t.optional)!=null?s:!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(o){if(r)return null;throw o}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Vh(t))try{this.getOrInitializeService({instanceIdentifier:de})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:s});r.resolve(o)}catch{}}}}clearInstance(t=de){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=de){return this.instances.has(t)}getOptions(t=de){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[o,a]of this.instancesDeferred.entries()){const h=this.normalizeInstanceIdentifier(o);r===h&&a.resolve(s)}return s}onInit(t,e){var a;const r=this.normalizeInstanceIdentifier(e),s=(a=this.onInitCallbacks.get(r))!=null?a:new Set;s.add(t),this.onInitCallbacks.set(r,s);const o=this.instances.get(r);return o&&t(o,r),()=>{s.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(!!r)for(const s of r)try{s(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Ch(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=de){return this.component?this.component.multipleInstances?t:de:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Ch(n){return n===de?void 0:n}function Vh(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dh{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Ph(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var q;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(q||(q={}));const Nh={debug:q.DEBUG,verbose:q.VERBOSE,info:q.INFO,warn:q.WARN,error:q.ERROR,silent:q.SILENT},kh=q.INFO,Oh={[q.DEBUG]:"log",[q.VERBOSE]:"log",[q.INFO]:"info",[q.WARN]:"warn",[q.ERROR]:"error"},xh=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),s=Oh[t];if(s)console[s](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class ko{constructor(t){this.name=t,this._logLevel=kh,this._logHandler=xh,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in q))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Nh[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,q.DEBUG,...t),this._logHandler(this,q.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,q.VERBOSE,...t),this._logHandler(this,q.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,q.INFO,...t),this._logHandler(this,q.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,q.WARN,...t),this._logHandler(this,q.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,q.ERROR,...t),this._logHandler(this,q.ERROR,...t)}}const Mh=(n,t)=>t.some(e=>n instanceof e);let Oo,xo;function Lh(){return Oo||(Oo=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Fh(){return xo||(xo=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Mo=new WeakMap,hs=new WeakMap,Lo=new WeakMap,ls=new WeakMap,ds=new WeakMap;function Uh(n){const t=new Promise((e,r)=>{const s=()=>{n.removeEventListener("success",o),n.removeEventListener("error",a)},o=()=>{e(Yt(n.result)),s()},a=()=>{r(n.error),s()};n.addEventListener("success",o),n.addEventListener("error",a)});return t.then(e=>{e instanceof IDBCursor&&Mo.set(e,n)}).catch(()=>{}),ds.set(t,n),t}function Bh(n){if(hs.has(n))return;const t=new Promise((e,r)=>{const s=()=>{n.removeEventListener("complete",o),n.removeEventListener("error",a),n.removeEventListener("abort",a)},o=()=>{e(),s()},a=()=>{r(n.error||new DOMException("AbortError","AbortError")),s()};n.addEventListener("complete",o),n.addEventListener("error",a),n.addEventListener("abort",a)});hs.set(n,t)}let fs={get(n,t,e){if(n instanceof IDBTransaction){if(t==="done")return hs.get(n);if(t==="objectStoreNames")return n.objectStoreNames||Lo.get(n);if(t==="store")return e.objectStoreNames[1]?void 0:e.objectStore(e.objectStoreNames[0])}return Yt(n[t])},set(n,t,e){return n[t]=e,!0},has(n,t){return n instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in n}};function jh(n){fs=n(fs)}function qh(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...e){const r=n.call(ms(this),t,...e);return Lo.set(r,t.sort?t.sort():[t]),Yt(r)}:Fh().includes(n)?function(...t){return n.apply(ms(this),t),Yt(Mo.get(this))}:function(...t){return Yt(n.apply(ms(this),t))}}function $h(n){return typeof n=="function"?qh(n):(n instanceof IDBTransaction&&Bh(n),Mh(n,Lh())?new Proxy(n,fs):n)}function Yt(n){if(n instanceof IDBRequest)return Uh(n);if(ls.has(n))return ls.get(n);const t=$h(n);return t!==n&&(ls.set(n,t),ds.set(t,n)),t}const ms=n=>ds.get(n);function zh(n,t,{blocked:e,upgrade:r,blocking:s,terminated:o}={}){const a=indexedDB.open(n,t),h=Yt(a);return r&&a.addEventListener("upgradeneeded",l=>{r(Yt(a.result),l.oldVersion,l.newVersion,Yt(a.transaction),l)}),e&&a.addEventListener("blocked",l=>e(l.oldVersion,l.newVersion,l)),h.then(l=>{o&&l.addEventListener("close",()=>o()),s&&l.addEventListener("versionchange",f=>s(f.oldVersion,f.newVersion,f))}).catch(()=>{}),h}const Gh=["get","getKey","getAll","getAllKeys","count"],Hh=["put","add","delete","clear"],ps=new Map;function Fo(n,t){if(!(n instanceof IDBDatabase&&!(t in n)&&typeof t=="string"))return;if(ps.get(t))return ps.get(t);const e=t.replace(/FromIndex$/,""),r=t!==e,s=Hh.includes(e);if(!(e in(r?IDBIndex:IDBObjectStore).prototype)||!(s||Gh.includes(e)))return;const o=async function(a,...h){const l=this.transaction(a,s?"readwrite":"readonly");let f=l.store;return r&&(f=f.index(h.shift())),(await Promise.all([f[e](...h),s&&l.done]))[0]};return ps.set(t,o),o}jh(n=>Kn(It({},n),{get:(t,e,r)=>Fo(t,e)||n.get(t,e,r),has:(t,e)=>!!Fo(t,e)||n.has(t,e)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kh{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(Wh(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function Wh(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const gs="@firebase/app",Uo="0.14.11";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ut=new ko("@firebase/app"),Qh="@firebase/app-compat",Yh="@firebase/analytics-compat",Xh="@firebase/analytics",Jh="@firebase/app-check-compat",Zh="@firebase/app-check",tl="@firebase/auth",el="@firebase/auth-compat",nl="@firebase/database",rl="@firebase/data-connect",sl="@firebase/database-compat",il="@firebase/functions",ol="@firebase/functions-compat",al="@firebase/installations",cl="@firebase/installations-compat",ul="@firebase/messaging",hl="@firebase/messaging-compat",ll="@firebase/performance",dl="@firebase/performance-compat",fl="@firebase/remote-config",ml="@firebase/remote-config-compat",pl="@firebase/storage",gl="@firebase/storage-compat",_l="@firebase/firestore",yl="@firebase/ai",El="@firebase/firestore-compat",Tl="firebase",vl="12.12.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _s="[DEFAULT]",Il={[gs]:"fire-core",[Qh]:"fire-core-compat",[Xh]:"fire-analytics",[Yh]:"fire-analytics-compat",[Zh]:"fire-app-check",[Jh]:"fire-app-check-compat",[tl]:"fire-auth",[el]:"fire-auth-compat",[nl]:"fire-rtdb",[rl]:"fire-data-connect",[sl]:"fire-rtdb-compat",[il]:"fire-fn",[ol]:"fire-fn-compat",[al]:"fire-iid",[cl]:"fire-iid-compat",[ul]:"fire-fcm",[hl]:"fire-fcm-compat",[ll]:"fire-perf",[dl]:"fire-perf-compat",[fl]:"fire-rc",[ml]:"fire-rc-compat",[pl]:"fire-gcs",[gl]:"fire-gcs-compat",[_l]:"fire-fst",[El]:"fire-fst-compat",[yl]:"fire-vertex","fire-js":"fire-js",[Tl]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cn=new Map,Al=new Map,ys=new Map;function Bo(n,t){try{n.container.addComponent(t)}catch(e){Ut.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function Xn(n){const t=n.name;if(ys.has(t))return Ut.debug(`There were multiple attempts to register component ${t}.`),!1;ys.set(t,n);for(const e of cn.values())Bo(e,n);for(const e of Al.values())Bo(e,n);return!0}function wl(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function Rl(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sl={["no-app"]:"No Firebase App '{$appName}' has been created - call initializeApp() first",["bad-app-name"]:"Illegal App name: '{$appName}'",["duplicate-app"]:"Firebase App named '{$appName}' already exists with different options or config",["app-deleted"]:"Firebase App named '{$appName}' already deleted",["server-app-deleted"]:"Firebase Server App has been deleted",["no-options"]:"Need to provide options, when not being deployed to hosting via source.",["invalid-app-argument"]:"firebase.{$appName}() takes either no argument or a Firebase App instance.",["invalid-log-argument"]:"First argument to `onLog` must be null or a function.",["idb-open"]:"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",["idb-get"]:"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",["idb-set"]:"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",["idb-delete"]:"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",["finalization-registry-not-supported"]:"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",["invalid-server-app-environment"]:"FirebaseServerApp is not for use in browser environments."},Xt=new Vo("app","Firebase",Sl);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bl{constructor(t,e,r){this._isDeleted=!1,this._options=It({},t),this._config=It({},e),this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new an("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw Xt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pl=vl;function Cl(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r=It({name:_s,automaticDataCollectionEnabled:!0},t),s=r.name;if(typeof s!="string"||!s)throw Xt.create("bad-app-name",{appName:String(s)});if(e||(e=Co()),!e)throw Xt.create("no-options");const o=cn.get(s);if(o){if(Yn(e,o.options)&&Yn(r,o.config))return o;throw Xt.create("duplicate-app",{appName:s})}const a=new Dh(s);for(const l of ys.values())a.addComponent(l);const h=new bl(e,r,a);return cn.set(s,h),h}function Vl(n=_s){const t=cn.get(n);if(!t&&n===_s&&Co())return Cl();if(!t)throw Xt.create("no-app",{appName:n});return t}function gp(){return Array.from(cn.values())}function un(n,t,e){var a;let r=(a=Il[n])!=null?a:n;e&&(r+=`-${e}`);const s=r.match(/\s|\//),o=t.match(/\s|\//);if(s||o){const h=[`Unable to register library "${r}" with version "${t}":`];s&&h.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&o&&h.push("and"),o&&h.push(`version name "${t}" contains illegal characters (whitespace or "/")`),Ut.warn(h.join(" "));return}Xn(new an(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dl="firebase-heartbeat-database",Nl=1,hn="firebase-heartbeat-store";let Es=null;function jo(){return Es||(Es=zh(Dl,Nl,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(hn)}catch(e){console.warn(e)}}}}).catch(n=>{throw Xt.create("idb-open",{originalErrorMessage:n.message})})),Es}async function kl(n){try{const e=(await jo()).transaction(hn),r=await e.objectStore(hn).get($o(n));return await e.done,r}catch(t){if(t instanceof be)Ut.warn(t.message);else{const e=Xt.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});Ut.warn(e.message)}}}async function qo(n,t){try{const r=(await jo()).transaction(hn,"readwrite");await r.objectStore(hn).put(t,$o(n)),await r.done}catch(e){if(e instanceof be)Ut.warn(e.message);else{const r=Xt.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});Ut.warn(r.message)}}}function $o(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ol=1024,xl=30;class Ml{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Fl(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=zo();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(a=>a.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:s}),this._heartbeatsCache.heartbeats.length>xl){const a=Ul(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){Ut.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=zo(),{heartbeatsToSend:r,unsentEntries:s}=Ll(this._heartbeatsCache.heartbeats),o=Wn(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return Ut.warn(e),""}}}function zo(){return new Date().toISOString().substring(0,10)}function Ll(n,t=Ol){const e=[];let r=n.slice();for(const s of n){const o=e.find(a=>a.agent===s.agent);if(o){if(o.dates.push(s.date),Go(e)>t){o.dates.pop();break}}else if(e.push({agent:s.agent,dates:[s.date]}),Go(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Fl{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Th()?vh().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await kl(this.app);return(e==null?void 0:e.heartbeats)?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var r;if(await this._canUseIndexedDBPromise){const s=await this.read();return qo(this.app,{lastSentHeartbeatDate:(r=t.lastSentHeartbeatDate)!=null?r:s.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var r;if(await this._canUseIndexedDBPromise){const s=await this.read();return qo(this.app,{lastSentHeartbeatDate:(r=t.lastSentHeartbeatDate)!=null?r:s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...t.heartbeats]})}else return}}function Go(n){return Wn(JSON.stringify({version:2,heartbeats:n})).length}function Ul(n){if(n.length===0)return-1;let t=0,e=n[0].date;for(let r=1;r<n.length;r++)n[r].date<e&&(e=n[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bl(n){Xn(new an("platform-logger",t=>new Kh(t),"PRIVATE")),Xn(new an("heartbeat",t=>new Ml(t),"PRIVATE")),un(gs,Uo,n),un(gs,Uo,"esm2020"),un("fire-js","")}Bl("");var Ho=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Jt,Ko;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(E,m){function _(){}_.prototype=m.prototype,E.F=m.prototype,E.prototype=new _,E.prototype.constructor=E,E.D=function(T,y,A){for(var p=Array(arguments.length-2),vt=2;vt<arguments.length;vt++)p[vt-2]=arguments[vt];return m.prototype[y].apply(T,p)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(r,e),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(E,m,_){_||(_=0);const T=Array(16);if(typeof m=="string")for(var y=0;y<16;++y)T[y]=m.charCodeAt(_++)|m.charCodeAt(_++)<<8|m.charCodeAt(_++)<<16|m.charCodeAt(_++)<<24;else for(y=0;y<16;++y)T[y]=m[_++]|m[_++]<<8|m[_++]<<16|m[_++]<<24;m=E.g[0],_=E.g[1],y=E.g[2];let A=E.g[3],p;p=m+(A^_&(y^A))+T[0]+3614090360&4294967295,m=_+(p<<7&4294967295|p>>>25),p=A+(y^m&(_^y))+T[1]+3905402710&4294967295,A=m+(p<<12&4294967295|p>>>20),p=y+(_^A&(m^_))+T[2]+606105819&4294967295,y=A+(p<<17&4294967295|p>>>15),p=_+(m^y&(A^m))+T[3]+3250441966&4294967295,_=y+(p<<22&4294967295|p>>>10),p=m+(A^_&(y^A))+T[4]+4118548399&4294967295,m=_+(p<<7&4294967295|p>>>25),p=A+(y^m&(_^y))+T[5]+1200080426&4294967295,A=m+(p<<12&4294967295|p>>>20),p=y+(_^A&(m^_))+T[6]+2821735955&4294967295,y=A+(p<<17&4294967295|p>>>15),p=_+(m^y&(A^m))+T[7]+4249261313&4294967295,_=y+(p<<22&4294967295|p>>>10),p=m+(A^_&(y^A))+T[8]+1770035416&4294967295,m=_+(p<<7&4294967295|p>>>25),p=A+(y^m&(_^y))+T[9]+2336552879&4294967295,A=m+(p<<12&4294967295|p>>>20),p=y+(_^A&(m^_))+T[10]+4294925233&4294967295,y=A+(p<<17&4294967295|p>>>15),p=_+(m^y&(A^m))+T[11]+2304563134&4294967295,_=y+(p<<22&4294967295|p>>>10),p=m+(A^_&(y^A))+T[12]+1804603682&4294967295,m=_+(p<<7&4294967295|p>>>25),p=A+(y^m&(_^y))+T[13]+4254626195&4294967295,A=m+(p<<12&4294967295|p>>>20),p=y+(_^A&(m^_))+T[14]+2792965006&4294967295,y=A+(p<<17&4294967295|p>>>15),p=_+(m^y&(A^m))+T[15]+1236535329&4294967295,_=y+(p<<22&4294967295|p>>>10),p=m+(y^A&(_^y))+T[1]+4129170786&4294967295,m=_+(p<<5&4294967295|p>>>27),p=A+(_^y&(m^_))+T[6]+3225465664&4294967295,A=m+(p<<9&4294967295|p>>>23),p=y+(m^_&(A^m))+T[11]+643717713&4294967295,y=A+(p<<14&4294967295|p>>>18),p=_+(A^m&(y^A))+T[0]+3921069994&4294967295,_=y+(p<<20&4294967295|p>>>12),p=m+(y^A&(_^y))+T[5]+3593408605&4294967295,m=_+(p<<5&4294967295|p>>>27),p=A+(_^y&(m^_))+T[10]+38016083&4294967295,A=m+(p<<9&4294967295|p>>>23),p=y+(m^_&(A^m))+T[15]+3634488961&4294967295,y=A+(p<<14&4294967295|p>>>18),p=_+(A^m&(y^A))+T[4]+3889429448&4294967295,_=y+(p<<20&4294967295|p>>>12),p=m+(y^A&(_^y))+T[9]+568446438&4294967295,m=_+(p<<5&4294967295|p>>>27),p=A+(_^y&(m^_))+T[14]+3275163606&4294967295,A=m+(p<<9&4294967295|p>>>23),p=y+(m^_&(A^m))+T[3]+4107603335&4294967295,y=A+(p<<14&4294967295|p>>>18),p=_+(A^m&(y^A))+T[8]+1163531501&4294967295,_=y+(p<<20&4294967295|p>>>12),p=m+(y^A&(_^y))+T[13]+2850285829&4294967295,m=_+(p<<5&4294967295|p>>>27),p=A+(_^y&(m^_))+T[2]+4243563512&4294967295,A=m+(p<<9&4294967295|p>>>23),p=y+(m^_&(A^m))+T[7]+1735328473&4294967295,y=A+(p<<14&4294967295|p>>>18),p=_+(A^m&(y^A))+T[12]+2368359562&4294967295,_=y+(p<<20&4294967295|p>>>12),p=m+(_^y^A)+T[5]+4294588738&4294967295,m=_+(p<<4&4294967295|p>>>28),p=A+(m^_^y)+T[8]+2272392833&4294967295,A=m+(p<<11&4294967295|p>>>21),p=y+(A^m^_)+T[11]+1839030562&4294967295,y=A+(p<<16&4294967295|p>>>16),p=_+(y^A^m)+T[14]+4259657740&4294967295,_=y+(p<<23&4294967295|p>>>9),p=m+(_^y^A)+T[1]+2763975236&4294967295,m=_+(p<<4&4294967295|p>>>28),p=A+(m^_^y)+T[4]+1272893353&4294967295,A=m+(p<<11&4294967295|p>>>21),p=y+(A^m^_)+T[7]+4139469664&4294967295,y=A+(p<<16&4294967295|p>>>16),p=_+(y^A^m)+T[10]+3200236656&4294967295,_=y+(p<<23&4294967295|p>>>9),p=m+(_^y^A)+T[13]+681279174&4294967295,m=_+(p<<4&4294967295|p>>>28),p=A+(m^_^y)+T[0]+3936430074&4294967295,A=m+(p<<11&4294967295|p>>>21),p=y+(A^m^_)+T[3]+3572445317&4294967295,y=A+(p<<16&4294967295|p>>>16),p=_+(y^A^m)+T[6]+76029189&4294967295,_=y+(p<<23&4294967295|p>>>9),p=m+(_^y^A)+T[9]+3654602809&4294967295,m=_+(p<<4&4294967295|p>>>28),p=A+(m^_^y)+T[12]+3873151461&4294967295,A=m+(p<<11&4294967295|p>>>21),p=y+(A^m^_)+T[15]+530742520&4294967295,y=A+(p<<16&4294967295|p>>>16),p=_+(y^A^m)+T[2]+3299628645&4294967295,_=y+(p<<23&4294967295|p>>>9),p=m+(y^(_|~A))+T[0]+4096336452&4294967295,m=_+(p<<6&4294967295|p>>>26),p=A+(_^(m|~y))+T[7]+1126891415&4294967295,A=m+(p<<10&4294967295|p>>>22),p=y+(m^(A|~_))+T[14]+2878612391&4294967295,y=A+(p<<15&4294967295|p>>>17),p=_+(A^(y|~m))+T[5]+4237533241&4294967295,_=y+(p<<21&4294967295|p>>>11),p=m+(y^(_|~A))+T[12]+1700485571&4294967295,m=_+(p<<6&4294967295|p>>>26),p=A+(_^(m|~y))+T[3]+2399980690&4294967295,A=m+(p<<10&4294967295|p>>>22),p=y+(m^(A|~_))+T[10]+4293915773&4294967295,y=A+(p<<15&4294967295|p>>>17),p=_+(A^(y|~m))+T[1]+2240044497&4294967295,_=y+(p<<21&4294967295|p>>>11),p=m+(y^(_|~A))+T[8]+1873313359&4294967295,m=_+(p<<6&4294967295|p>>>26),p=A+(_^(m|~y))+T[15]+4264355552&4294967295,A=m+(p<<10&4294967295|p>>>22),p=y+(m^(A|~_))+T[6]+2734768916&4294967295,y=A+(p<<15&4294967295|p>>>17),p=_+(A^(y|~m))+T[13]+1309151649&4294967295,_=y+(p<<21&4294967295|p>>>11),p=m+(y^(_|~A))+T[4]+4149444226&4294967295,m=_+(p<<6&4294967295|p>>>26),p=A+(_^(m|~y))+T[11]+3174756917&4294967295,A=m+(p<<10&4294967295|p>>>22),p=y+(m^(A|~_))+T[2]+718787259&4294967295,y=A+(p<<15&4294967295|p>>>17),p=_+(A^(y|~m))+T[9]+3951481745&4294967295,E.g[0]=E.g[0]+m&4294967295,E.g[1]=E.g[1]+(y+(p<<21&4294967295|p>>>11))&4294967295,E.g[2]=E.g[2]+y&4294967295,E.g[3]=E.g[3]+A&4294967295}r.prototype.v=function(E,m){m===void 0&&(m=E.length);const _=m-this.blockSize,T=this.C;let y=this.h,A=0;for(;A<m;){if(y==0)for(;A<=_;)s(this,E,A),A+=this.blockSize;if(typeof E=="string"){for(;A<m;)if(T[y++]=E.charCodeAt(A++),y==this.blockSize){s(this,T),y=0;break}}else for(;A<m;)if(T[y++]=E[A++],y==this.blockSize){s(this,T),y=0;break}}this.h=y,this.o+=m},r.prototype.A=function(){var E=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);E[0]=128;for(var m=1;m<E.length-8;++m)E[m]=0;m=this.o*8;for(var _=E.length-8;_<E.length;++_)E[_]=m&255,m/=256;for(this.v(E),E=Array(16),m=0,_=0;_<4;++_)for(let T=0;T<32;T+=8)E[m++]=this.g[_]>>>T&255;return E};function o(E,m){var _=h;return Object.prototype.hasOwnProperty.call(_,E)?_[E]:_[E]=m(E)}function a(E,m){this.h=m;const _=[];let T=!0;for(let y=E.length-1;y>=0;y--){const A=E[y]|0;T&&A==m||(_[y]=A,T=!1)}this.g=_}var h={};function l(E){return-128<=E&&E<128?o(E,function(m){return new a([m|0],m<0?-1:0)}):new a([E|0],E<0?-1:0)}function f(E){if(isNaN(E)||!isFinite(E))return v;if(E<0)return V(f(-E));const m=[];let _=1;for(let T=0;E>=_;T++)m[T]=E/_|0,_*=4294967296;return new a(m,0)}function g(E,m){if(E.length==0)throw Error("number format error: empty string");if(m=m||10,m<2||36<m)throw Error("radix out of range: "+m);if(E.charAt(0)=="-")return V(g(E.substring(1),m));if(E.indexOf("-")>=0)throw Error('number format error: interior "-" character');const _=f(Math.pow(m,8));let T=v;for(let A=0;A<E.length;A+=8){var y=Math.min(8,E.length-A);const p=parseInt(E.substring(A,A+y),m);y<8?(y=f(Math.pow(m,y)),T=T.j(y).add(f(p))):(T=T.j(_),T=T.add(f(p)))}return T}var v=l(0),R=l(1),P=l(16777216);n=a.prototype,n.m=function(){if(x(this))return-V(this).m();let E=0,m=1;for(let _=0;_<this.g.length;_++){const T=this.i(_);E+=(T>=0?T:4294967296+T)*m,m*=4294967296}return E},n.toString=function(E){if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(k(this))return"0";if(x(this))return"-"+V(this).toString(E);const m=f(Math.pow(E,6));var _=this;let T="";for(;;){const y=yt(_,m).g;_=H(_,y.j(m));let A=((_.g.length>0?_.g[0]:_.h)>>>0).toString(E);if(_=y,k(_))return A+T;for(;A.length<6;)A="0"+A;T=A+T}},n.i=function(E){return E<0?0:E<this.g.length?this.g[E]:this.h};function k(E){if(E.h!=0)return!1;for(let m=0;m<E.g.length;m++)if(E.g[m]!=0)return!1;return!0}function x(E){return E.h==-1}n.l=function(E){return E=H(this,E),x(E)?-1:k(E)?0:1};function V(E){const m=E.g.length,_=[];for(let T=0;T<m;T++)_[T]=~E.g[T];return new a(_,~E.h).add(R)}n.abs=function(){return x(this)?V(this):this},n.add=function(E){const m=Math.max(this.g.length,E.g.length),_=[];let T=0;for(let y=0;y<=m;y++){let A=T+(this.i(y)&65535)+(E.i(y)&65535),p=(A>>>16)+(this.i(y)>>>16)+(E.i(y)>>>16);T=p>>>16,A&=65535,p&=65535,_[y]=p<<16|A}return new a(_,_[_.length-1]&-2147483648?-1:0)};function H(E,m){return E.add(V(m))}n.j=function(E){if(k(this)||k(E))return v;if(x(this))return x(E)?V(this).j(V(E)):V(V(this).j(E));if(x(E))return V(this.j(V(E)));if(this.l(P)<0&&E.l(P)<0)return f(this.m()*E.m());const m=this.g.length+E.g.length,_=[];for(var T=0;T<2*m;T++)_[T]=0;for(T=0;T<this.g.length;T++)for(let y=0;y<E.g.length;y++){const A=this.i(T)>>>16,p=this.i(T)&65535,vt=E.i(y)>>>16,$t=E.i(y)&65535;_[2*T+2*y]+=p*$t,z(_,2*T+2*y),_[2*T+2*y+1]+=A*$t,z(_,2*T+2*y+1),_[2*T+2*y+1]+=p*vt,z(_,2*T+2*y+1),_[2*T+2*y+2]+=A*vt,z(_,2*T+2*y+2)}for(E=0;E<m;E++)_[E]=_[2*E+1]<<16|_[2*E];for(E=m;E<2*m;E++)_[E]=0;return new a(_,0)};function z(E,m){for(;(E[m]&65535)!=E[m];)E[m+1]+=E[m]>>>16,E[m]&=65535,m++}function W(E,m){this.g=E,this.h=m}function yt(E,m){if(k(m))throw Error("division by zero");if(k(E))return new W(v,v);if(x(E))return m=yt(V(E),m),new W(V(m.g),V(m.h));if(x(m))return m=yt(E,V(m)),new W(V(m.g),m.h);if(E.g.length>30){if(x(E)||x(m))throw Error("slowDivide_ only works with positive integers.");for(var _=R,T=m;T.l(E)<=0;)_=st(_),T=st(T);var y=it(_,1),A=it(T,1);for(T=it(T,2),_=it(_,2);!k(T);){var p=A.add(T);p.l(E)<=0&&(y=y.add(_),A=p),T=it(T,1),_=it(_,1)}return m=H(E,y.j(m)),new W(y,m)}for(y=v;E.l(m)>=0;){for(_=Math.max(1,Math.floor(E.m()/m.m())),T=Math.ceil(Math.log(_)/Math.LN2),T=T<=48?1:Math.pow(2,T-48),A=f(_),p=A.j(m);x(p)||p.l(E)>0;)_-=T,A=f(_),p=A.j(m);k(A)&&(A=R),y=y.add(A),E=H(E,p)}return new W(y,E)}n.B=function(E){return yt(this,E).h},n.and=function(E){const m=Math.max(this.g.length,E.g.length),_=[];for(let T=0;T<m;T++)_[T]=this.i(T)&E.i(T);return new a(_,this.h&E.h)},n.or=function(E){const m=Math.max(this.g.length,E.g.length),_=[];for(let T=0;T<m;T++)_[T]=this.i(T)|E.i(T);return new a(_,this.h|E.h)},n.xor=function(E){const m=Math.max(this.g.length,E.g.length),_=[];for(let T=0;T<m;T++)_[T]=this.i(T)^E.i(T);return new a(_,this.h^E.h)};function st(E){const m=E.g.length+1,_=[];for(let T=0;T<m;T++)_[T]=E.i(T)<<1|E.i(T-1)>>>31;return new a(_,E.h)}function it(E,m){const _=m>>5;m%=32;const T=E.g.length-_,y=[];for(let A=0;A<T;A++)y[A]=m>0?E.i(A+_)>>>m|E.i(A+_+1)<<32-m:E.i(A+_);return new a(y,E.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,Ko=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.B,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=f,a.fromString=g,Jt=a}).apply(typeof Ho!="undefined"?Ho:typeof self!="undefined"?self:typeof window!="undefined"?window:{});var Jn=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Wo,ln,Qo,Zn,Ts,Yo,Xo,Jo;(function(){var n,t=Object.defineProperty;function e(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof Jn=="object"&&Jn];for(var c=0;c<i.length;++c){var u=i[c];if(u&&u.Math==Math)return u}throw Error("Cannot find global object")}var r=e(this);function s(i,c){if(c)t:{var u=r;i=i.split(".");for(var d=0;d<i.length-1;d++){var I=i[d];if(!(I in u))break t;u=u[I]}i=i[i.length-1],d=u[i],c=c(d),c!=d&&c!=null&&t(u,i,{configurable:!0,writable:!0,value:c})}}s("Symbol.dispose",function(i){return i||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(i){return i||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(i){return i||function(c){var u=[],d;for(d in c)Object.prototype.hasOwnProperty.call(c,d)&&u.push([d,c[d]]);return u}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var o=o||{},a=this||self;function h(i){var c=typeof i;return c=="object"&&i!=null||c=="function"}function l(i,c,u){return i.call.apply(i.bind,arguments)}function f(i,c,u){return f=l,f.apply(null,arguments)}function g(i,c){var u=Array.prototype.slice.call(arguments,1);return function(){var d=u.slice();return d.push.apply(d,arguments),i.apply(this,d)}}function v(i,c){function u(){}u.prototype=c.prototype,i.Z=c.prototype,i.prototype=new u,i.prototype.constructor=i,i.Ob=function(d,I,w){for(var C=Array(arguments.length-2),U=2;U<arguments.length;U++)C[U-2]=arguments[U];return c.prototype[I].apply(d,C)}}var R=typeof AsyncContext!="undefined"&&typeof AsyncContext.Snapshot=="function"?i=>i&&AsyncContext.Snapshot.wrap(i):i=>i;function P(i){const c=i.length;if(c>0){const u=Array(c);for(let d=0;d<c;d++)u[d]=i[d];return u}return[]}function k(i,c){for(let d=1;d<arguments.length;d++){const I=arguments[d];var u=typeof I;if(u=u!="object"?u:I?Array.isArray(I)?"array":u:"null",u=="array"||u=="object"&&typeof I.length=="number"){u=i.length||0;const w=I.length||0;i.length=u+w;for(let C=0;C<w;C++)i[u+C]=I[C]}else i.push(I)}}class x{constructor(c,u){this.i=c,this.j=u,this.h=0,this.g=null}get(){let c;return this.h>0?(this.h--,c=this.g,this.g=c.next,c.next=null):c=this.i(),c}}function V(i){a.setTimeout(()=>{throw i},0)}function H(){var i=E;let c=null;return i.g&&(c=i.g,i.g=i.g.next,i.g||(i.h=null),c.next=null),c}class z{constructor(){this.h=this.g=null}add(c,u){const d=W.get();d.set(c,u),this.h?this.h.next=d:this.g=d,this.h=d}}var W=new x(()=>new yt,i=>i.reset());class yt{constructor(){this.next=this.g=this.h=null}set(c,u){this.h=c,this.g=u,this.next=null}reset(){this.next=this.g=this.h=null}}let st,it=!1,E=new z,m=()=>{const i=Promise.resolve(void 0);st=()=>{i.then(_)}};function _(){for(var i;i=H();){try{i.h.call(i.g)}catch(u){V(u)}var c=W;c.j(i),c.h<100&&(c.h++,i.next=c.g,c.g=i)}it=!1}function T(){this.u=this.u,this.C=this.C}T.prototype.u=!1,T.prototype.dispose=function(){this.u||(this.u=!0,this.N())},T.prototype[Symbol.dispose]=function(){this.dispose()},T.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function y(i,c){this.type=i,this.g=this.target=c,this.defaultPrevented=!1}y.prototype.h=function(){this.defaultPrevented=!0};var A=function(){if(!a.addEventListener||!Object.defineProperty)return!1;var i=!1,c=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const u=()=>{};a.addEventListener("test",u,c),a.removeEventListener("test",u,c)}catch{}return i}();function p(i){return/^[\s\xa0]*$/.test(i)}function vt(i,c){y.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i&&this.init(i,c)}v(vt,y),vt.prototype.init=function(i,c){const u=this.type=i.type,d=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;this.target=i.target||i.srcElement,this.g=c,c=i.relatedTarget,c||(u=="mouseover"?c=i.fromElement:u=="mouseout"&&(c=i.toElement)),this.relatedTarget=c,d?(this.clientX=d.clientX!==void 0?d.clientX:d.pageX,this.clientY=d.clientY!==void 0?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=i.pointerType,this.state=i.state,this.i=i,i.defaultPrevented&&vt.Z.h.call(this)},vt.prototype.h=function(){vt.Z.h.call(this);const i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var $t="closure_listenable_"+(Math.random()*1e6|0),Eu=0;function Tu(i,c,u,d,I){this.listener=i,this.proxy=null,this.src=c,this.type=u,this.capture=!!d,this.ha=I,this.key=++Eu,this.da=this.fa=!1}function Nn(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function kn(i,c,u){for(const d in i)c.call(u,i[d],d,i)}function vu(i,c){for(const u in i)c.call(void 0,i[u],u,i)}function vi(i){const c={};for(const u in i)c[u]=i[u];return c}const Ii="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Ai(i,c){let u,d;for(let I=1;I<arguments.length;I++){d=arguments[I];for(u in d)i[u]=d[u];for(let w=0;w<Ii.length;w++)u=Ii[w],Object.prototype.hasOwnProperty.call(d,u)&&(i[u]=d[u])}}function On(i){this.src=i,this.g={},this.h=0}On.prototype.add=function(i,c,u,d,I){const w=i.toString();i=this.g[w],i||(i=this.g[w]=[],this.h++);const C=Fr(i,c,d,I);return C>-1?(c=i[C],u||(c.fa=!1)):(c=new Tu(c,this.src,w,!!d,I),c.fa=u,i.push(c)),c};function Lr(i,c){const u=c.type;if(u in i.g){var d=i.g[u],I=Array.prototype.indexOf.call(d,c,void 0),w;(w=I>=0)&&Array.prototype.splice.call(d,I,1),w&&(Nn(c),i.g[u].length==0&&(delete i.g[u],i.h--))}}function Fr(i,c,u,d){for(let I=0;I<i.length;++I){const w=i[I];if(!w.da&&w.listener==c&&w.capture==!!u&&w.ha==d)return I}return-1}var Ur="closure_lm_"+(Math.random()*1e6|0),Br={};function wi(i,c,u,d,I){if(d&&d.once)return Si(i,c,u,d,I);if(Array.isArray(c)){for(let w=0;w<c.length;w++)wi(i,c[w],u,d,I);return null}return u=zr(u),i&&i[$t]?i.J(c,u,h(d)?!!d.capture:!!d,I):Ri(i,c,u,!1,d,I)}function Ri(i,c,u,d,I,w){if(!c)throw Error("Invalid event type");const C=h(I)?!!I.capture:!!I;let U=qr(i);if(U||(i[Ur]=U=new On(i)),u=U.add(c,u,d,C,w),u.proxy)return u;if(d=Iu(),u.proxy=d,d.src=i,d.listener=u,i.addEventListener)A||(I=C),I===void 0&&(I=!1),i.addEventListener(c.toString(),d,I);else if(i.attachEvent)i.attachEvent(Pi(c.toString()),d);else if(i.addListener&&i.removeListener)i.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");return u}function Iu(){function i(u){return c.call(i.src,i.listener,u)}const c=Au;return i}function Si(i,c,u,d,I){if(Array.isArray(c)){for(let w=0;w<c.length;w++)Si(i,c[w],u,d,I);return null}return u=zr(u),i&&i[$t]?i.K(c,u,h(d)?!!d.capture:!!d,I):Ri(i,c,u,!0,d,I)}function bi(i,c,u,d,I){if(Array.isArray(c))for(var w=0;w<c.length;w++)bi(i,c[w],u,d,I);else d=h(d)?!!d.capture:!!d,u=zr(u),i&&i[$t]?(i=i.i,w=String(c).toString(),w in i.g&&(c=i.g[w],u=Fr(c,u,d,I),u>-1&&(Nn(c[u]),Array.prototype.splice.call(c,u,1),c.length==0&&(delete i.g[w],i.h--)))):i&&(i=qr(i))&&(c=i.g[c.toString()],i=-1,c&&(i=Fr(c,u,d,I)),(u=i>-1?c[i]:null)&&jr(u))}function jr(i){if(typeof i!="number"&&i&&!i.da){var c=i.src;if(c&&c[$t])Lr(c.i,i);else{var u=i.type,d=i.proxy;c.removeEventListener?c.removeEventListener(u,d,i.capture):c.detachEvent?c.detachEvent(Pi(u),d):c.addListener&&c.removeListener&&c.removeListener(d),(u=qr(c))?(Lr(u,i),u.h==0&&(u.src=null,c[Ur]=null)):Nn(i)}}}function Pi(i){return i in Br?Br[i]:Br[i]="on"+i}function Au(i,c){if(i.da)i=!0;else{c=new vt(c,this);const u=i.listener,d=i.ha||i.src;i.fa&&jr(i),i=u.call(d,c)}return i}function qr(i){return i=i[Ur],i instanceof On?i:null}var $r="__closure_events_fn_"+(Math.random()*1e9>>>0);function zr(i){return typeof i=="function"?i:(i[$r]||(i[$r]=function(c){return i.handleEvent(c)}),i[$r])}function mt(){T.call(this),this.i=new On(this),this.M=this,this.G=null}v(mt,T),mt.prototype[$t]=!0,mt.prototype.removeEventListener=function(i,c,u,d){bi(this,i,c,u,d)};function Et(i,c){var u,d=i.G;if(d)for(u=[];d;d=d.G)u.push(d);if(i=i.M,d=c.type||c,typeof c=="string")c=new y(c,i);else if(c instanceof y)c.target=c.target||i;else{var I=c;c=new y(d,i),Ai(c,I)}I=!0;let w,C;if(u)for(C=u.length-1;C>=0;C--)w=c.g=u[C],I=xn(w,d,!0,c)&&I;if(w=c.g=i,I=xn(w,d,!0,c)&&I,I=xn(w,d,!1,c)&&I,u)for(C=0;C<u.length;C++)w=c.g=u[C],I=xn(w,d,!1,c)&&I}mt.prototype.N=function(){if(mt.Z.N.call(this),this.i){var i=this.i;for(const c in i.g){const u=i.g[c];for(let d=0;d<u.length;d++)Nn(u[d]);delete i.g[c],i.h--}}this.G=null},mt.prototype.J=function(i,c,u,d){return this.i.add(String(i),c,!1,u,d)},mt.prototype.K=function(i,c,u,d){return this.i.add(String(i),c,!0,u,d)};function xn(i,c,u,d){if(c=i.i.g[String(c)],!c)return!0;c=c.concat();let I=!0;for(let w=0;w<c.length;++w){const C=c[w];if(C&&!C.da&&C.capture==u){const U=C.listener,ot=C.ha||C.src;C.fa&&Lr(i.i,C),I=U.call(ot,d)!==!1&&I}}return I&&!d.defaultPrevented}function wu(i,c){if(typeof i!="function")if(i&&typeof i.handleEvent=="function")i=f(i.handleEvent,i);else throw Error("Invalid listener argument");return Number(c)>2147483647?-1:a.setTimeout(i,c||0)}function Ci(i){i.g=wu(()=>{i.g=null,i.i&&(i.i=!1,Ci(i))},i.l);const c=i.h;i.h=null,i.m.apply(null,c)}class Ru extends T{constructor(c,u){super();this.m=c,this.l=u,this.h=null,this.i=!1,this.g=null}j(c){this.h=arguments,this.g?this.i=!0:Ci(this)}N(){super.N(),this.g&&(a.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ze(i){T.call(this),this.h=i,this.g={}}v(ze,T);var Vi=[];function Di(i){kn(i.g,function(c,u){this.g.hasOwnProperty(u)&&jr(c)},i),i.g={}}ze.prototype.N=function(){ze.Z.N.call(this),Di(this)},ze.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Gr=a.JSON.stringify,Su=a.JSON.parse,bu=class{stringify(i){return a.JSON.stringify(i,void 0)}parse(i){return a.JSON.parse(i,void 0)}};function Ni(){}function ki(){}var Ge={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Hr(){y.call(this,"d")}v(Hr,y);function Kr(){y.call(this,"c")}v(Kr,y);var ae={},Oi=null;function Mn(){return Oi=Oi||new mt}ae.Ia="serverreachability";function xi(i){y.call(this,ae.Ia,i)}v(xi,y);function He(i){const c=Mn();Et(c,new xi(c))}ae.STAT_EVENT="statevent";function Mi(i,c){y.call(this,ae.STAT_EVENT,i),this.stat=c}v(Mi,y);function Tt(i){const c=Mn();Et(c,new Mi(c,i))}ae.Ja="timingevent";function Li(i,c){y.call(this,ae.Ja,i),this.size=c}v(Li,y);function Ke(i,c){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return a.setTimeout(function(){i()},c)}function We(){this.g=!0}We.prototype.ua=function(){this.g=!1};function Pu(i,c,u,d,I,w){i.info(function(){if(i.g)if(w){var C="",U=w.split("&");for(let K=0;K<U.length;K++){var ot=U[K].split("=");if(ot.length>1){const ut=ot[0];ot=ot[1];const Dt=ut.split("_");C=Dt.length>=2&&Dt[1]=="type"?C+(ut+"="+ot+"&"):C+(ut+"=redacted&")}}}else C=null;else C=w;return"XMLHTTP REQ ("+d+") [attempt "+I+"]: "+c+`
`+u+`
`+C})}function Cu(i,c,u,d,I,w,C){i.info(function(){return"XMLHTTP RESP ("+d+") [ attempt "+I+"]: "+c+`
`+u+`
`+w+" "+C})}function we(i,c,u,d){i.info(function(){return"XMLHTTP TEXT ("+c+"): "+Du(i,u)+(d?" "+d:"")})}function Vu(i,c){i.info(function(){return"TIMEOUT: "+c})}We.prototype.info=function(){};function Du(i,c){if(!i.g)return c;if(!c)return null;try{const w=JSON.parse(c);if(w){for(i=0;i<w.length;i++)if(Array.isArray(w[i])){var u=w[i];if(!(u.length<2)){var d=u[1];if(Array.isArray(d)&&!(d.length<1)){var I=d[0];if(I!="noop"&&I!="stop"&&I!="close")for(let C=1;C<d.length;C++)d[C]=""}}}}return Gr(w)}catch{return c}}var Ln={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Fi={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Ui;function Wr(){}v(Wr,Ni),Wr.prototype.g=function(){return new XMLHttpRequest},Ui=new Wr;function Qe(i){return encodeURIComponent(String(i))}function Nu(i){var c=1;i=i.split(":");const u=[];for(;c>0&&i.length;)u.push(i.shift()),c--;return i.length&&u.push(i.join(":")),u}function zt(i,c,u,d){this.j=i,this.i=c,this.l=u,this.S=d||1,this.V=new ze(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Bi}function Bi(){this.i=null,this.g="",this.h=!1}var ji={},Qr={};function Yr(i,c,u){i.M=1,i.A=Un(Vt(c)),i.u=u,i.R=!0,qi(i,null)}function qi(i,c){i.F=Date.now(),Fn(i),i.B=Vt(i.A);var u=i.B,d=i.S;Array.isArray(d)||(d=[String(d)]),eo(u.i,"t",d),i.C=0,u=i.j.L,i.h=new Bi,i.g=To(i.j,u?c:null,!i.u),i.P>0&&(i.O=new Ru(f(i.Y,i,i.g),i.P)),c=i.V,u=i.g,d=i.ba;var I="readystatechange";Array.isArray(I)||(I&&(Vi[0]=I.toString()),I=Vi);for(let w=0;w<I.length;w++){const C=wi(u,I[w],d||c.handleEvent,!1,c.h||c);if(!C)break;c.g[C.key]=C}c=i.J?vi(i.J):{},i.u?(i.v||(i.v="POST"),c["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.B,i.v,i.u,c)):(i.v="GET",i.g.ea(i.B,i.v,null,c)),He(),Pu(i.i,i.v,i.B,i.l,i.S,i.u)}zt.prototype.ba=function(i){i=i.target;const c=this.O;c&&Kt(i)==3?c.j():this.Y(i)},zt.prototype.Y=function(i){try{if(i==this.g)t:{const U=Kt(this.g),ot=this.g.ya(),K=this.g.ca();if(!(U<3)&&(U!=3||this.g&&(this.h.h||this.g.la()||co(this.g)))){this.K||U!=4||ot==7||(ot==8||K<=0?He(3):He(2)),Xr(this);var c=this.g.ca();this.X=c;var u=ku(this);if(this.o=c==200,Cu(this.i,this.v,this.B,this.l,this.S,U,c),this.o){if(this.U&&!this.L){e:{if(this.g){var d,I=this.g;if((d=I.g?I.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!p(d)){var w=d;break e}}w=null}if(i=w)we(this.i,this.l,i,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Jr(this,i);else{this.o=!1,this.m=3,Tt(12),ce(this),Ye(this);break t}}if(this.R){i=!0;let ut;for(;!this.K&&this.C<u.length;)if(ut=Ou(this,u),ut==Qr){U==4&&(this.m=4,Tt(14),i=!1),we(this.i,this.l,null,"[Incomplete Response]");break}else if(ut==ji){this.m=4,Tt(15),we(this.i,this.l,u,"[Invalid Chunk]"),i=!1;break}else we(this.i,this.l,ut,null),Jr(this,ut);if($i(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),U!=4||u.length!=0||this.h.h||(this.m=1,Tt(16),i=!1),this.o=this.o&&i,!i)we(this.i,this.l,u,"[Invalid Chunked Response]"),ce(this),Ye(this);else if(u.length>0&&!this.W){this.W=!0;var C=this.j;C.g==this&&C.aa&&!C.P&&(C.j.info("Great, no buffering proxy detected. Bytes received: "+u.length),os(C),C.P=!0,Tt(11))}}else we(this.i,this.l,u,null),Jr(this,u);U==4&&ce(this),this.o&&!this.K&&(U==4?go(this.j,this):(this.o=!1,Fn(this)))}else Wu(this.g),c==400&&u.indexOf("Unknown SID")>0?(this.m=3,Tt(12)):(this.m=0,Tt(13)),ce(this),Ye(this)}}}catch{}finally{}};function ku(i){if(!$i(i))return i.g.la();const c=co(i.g);if(c==="")return"";let u="";const d=c.length,I=Kt(i.g)==4;if(!i.h.i){if(typeof TextDecoder=="undefined")return ce(i),Ye(i),"";i.h.i=new a.TextDecoder}for(let w=0;w<d;w++)i.h.h=!0,u+=i.h.i.decode(c[w],{stream:!(I&&w==d-1)});return c.length=0,i.h.g+=u,i.C=0,i.h.g}function $i(i){return i.g?i.v=="GET"&&i.M!=2&&i.j.Aa:!1}function Ou(i,c){var u=i.C,d=c.indexOf(`
`,u);return d==-1?Qr:(u=Number(c.substring(u,d)),isNaN(u)?ji:(d+=1,d+u>c.length?Qr:(c=c.slice(d,d+u),i.C=d+u,c)))}zt.prototype.cancel=function(){this.K=!0,ce(this)};function Fn(i){i.T=Date.now()+i.H,zi(i,i.H)}function zi(i,c){if(i.D!=null)throw Error("WatchDog timer not null");i.D=Ke(f(i.aa,i),c)}function Xr(i){i.D&&(a.clearTimeout(i.D),i.D=null)}zt.prototype.aa=function(){this.D=null;const i=Date.now();i-this.T>=0?(Vu(this.i,this.B),this.M!=2&&(He(),Tt(17)),ce(this),this.m=2,Ye(this)):zi(this,this.T-i)};function Ye(i){i.j.I==0||i.K||go(i.j,i)}function ce(i){Xr(i);var c=i.O;c&&typeof c.dispose=="function"&&c.dispose(),i.O=null,Di(i.V),i.g&&(c=i.g,i.g=null,c.abort(),c.dispose())}function Jr(i,c){try{var u=i.j;if(u.I!=0&&(u.g==i||Zr(u.h,i))){if(!i.L&&Zr(u.h,i)&&u.I==3){try{var d=u.Ba.g.parse(c)}catch{d=null}if(Array.isArray(d)&&d.length==3){var I=d;if(I[0]==0)t:if(!u.v){if(u.g)if(u.g.F+3e3<i.F)zn(u),qn(u);else break t;is(u),Tt(18)}else u.xa=I[1],0<u.xa-u.K&&I[2]<37500&&u.F&&u.A==0&&!u.C&&(u.C=Ke(f(u.Va,u),6e3));Ki(u.h)<=1&&u.ta&&(u.ta=void 0)}else he(u,11)}else if((i.L||u.g==i)&&zn(u),!p(c))for(I=u.Ba.g.parse(c),c=0;c<I.length;c++){let K=I[c];const ut=K[0];if(!(ut<=u.K))if(u.K=ut,K=K[1],u.I==2)if(K[0]=="c"){u.M=K[1],u.ba=K[2];const Dt=K[3];Dt!=null&&(u.ka=Dt,u.j.info("VER="+u.ka));const le=K[4];le!=null&&(u.za=le,u.j.info("SVER="+u.za));const Wt=K[5];Wt!=null&&typeof Wt=="number"&&Wt>0&&(d=1.5*Wt,u.O=d,u.j.info("backChannelRequestTimeoutMs_="+d)),d=u;const Qt=i.g;if(Qt){const Hn=Qt.g?Qt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Hn){var w=d.h;w.g||Hn.indexOf("spdy")==-1&&Hn.indexOf("quic")==-1&&Hn.indexOf("h2")==-1||(w.j=w.l,w.g=new Set,w.h&&(ts(w,w.h),w.h=null))}if(d.G){const as=Qt.g?Qt.g.getResponseHeader("X-HTTP-Session-Id"):null;as&&(d.wa=as,Q(d.J,d.G,as))}}u.I=3,u.l&&u.l.ra(),u.aa&&(u.T=Date.now()-i.F,u.j.info("Handshake RTT: "+u.T+"ms")),d=u;var C=i;if(d.na=Eo(d,d.L?d.ba:null,d.W),C.L){Wi(d.h,C);var U=C,ot=d.O;ot&&(U.H=ot),U.D&&(Xr(U),Fn(U)),d.g=C}else mo(d);u.i.length>0&&$n(u)}else K[0]!="stop"&&K[0]!="close"||he(u,7);else u.I==3&&(K[0]=="stop"||K[0]=="close"?K[0]=="stop"?he(u,7):ss(u):K[0]!="noop"&&u.l&&u.l.qa(K),u.A=0)}}He(4)}catch{}}var xu=class{constructor(i,c){this.g=i,this.map=c}};function Gi(i){this.l=i||10,a.PerformanceNavigationTiming?(i=a.performance.getEntriesByType("navigation"),i=i.length>0&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(a.chrome&&a.chrome.loadTimes&&a.chrome.loadTimes()&&a.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Hi(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function Ki(i){return i.h?1:i.g?i.g.size:0}function Zr(i,c){return i.h?i.h==c:i.g?i.g.has(c):!1}function ts(i,c){i.g?i.g.add(c):i.h=c}function Wi(i,c){i.h&&i.h==c?i.h=null:i.g&&i.g.has(c)&&i.g.delete(c)}Gi.prototype.cancel=function(){if(this.i=Qi(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function Qi(i){if(i.h!=null)return i.i.concat(i.h.G);if(i.g!=null&&i.g.size!==0){let c=i.i;for(const u of i.g.values())c=c.concat(u.G);return c}return P(i.i)}var Yi=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Mu(i,c){if(i){i=i.split("&");for(let u=0;u<i.length;u++){const d=i[u].indexOf("=");let I,w=null;d>=0?(I=i[u].substring(0,d),w=i[u].substring(d+1)):I=i[u],c(I,w?decodeURIComponent(w.replace(/\+/g," ")):"")}}}function Gt(i){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let c;i instanceof Gt?(this.l=i.l,Xe(this,i.j),this.o=i.o,this.g=i.g,Je(this,i.u),this.h=i.h,es(this,no(i.i)),this.m=i.m):i&&(c=String(i).match(Yi))?(this.l=!1,Xe(this,c[1]||"",!0),this.o=Ze(c[2]||""),this.g=Ze(c[3]||"",!0),Je(this,c[4]),this.h=Ze(c[5]||"",!0),es(this,c[6]||"",!0),this.m=Ze(c[7]||"")):(this.l=!1,this.i=new en(null,this.l))}Gt.prototype.toString=function(){const i=[];var c=this.j;c&&i.push(tn(c,Xi,!0),":");var u=this.g;return(u||c=="file")&&(i.push("//"),(c=this.o)&&i.push(tn(c,Xi,!0),"@"),i.push(Qe(u).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),u=this.u,u!=null&&i.push(":",String(u))),(u=this.h)&&(this.g&&u.charAt(0)!="/"&&i.push("/"),i.push(tn(u,u.charAt(0)=="/"?Uu:Fu,!0))),(u=this.i.toString())&&i.push("?",u),(u=this.m)&&i.push("#",tn(u,ju)),i.join("")},Gt.prototype.resolve=function(i){const c=Vt(this);let u=!!i.j;u?Xe(c,i.j):u=!!i.o,u?c.o=i.o:u=!!i.g,u?c.g=i.g:u=i.u!=null;var d=i.h;if(u)Je(c,i.u);else if(u=!!i.h){if(d.charAt(0)!="/")if(this.g&&!this.h)d="/"+d;else{var I=c.h.lastIndexOf("/");I!=-1&&(d=c.h.slice(0,I+1)+d)}if(I=d,I==".."||I==".")d="";else if(I.indexOf("./")!=-1||I.indexOf("/.")!=-1){d=I.lastIndexOf("/",0)==0,I=I.split("/");const w=[];for(let C=0;C<I.length;){const U=I[C++];U=="."?d&&C==I.length&&w.push(""):U==".."?((w.length>1||w.length==1&&w[0]!="")&&w.pop(),d&&C==I.length&&w.push("")):(w.push(U),d=!0)}d=w.join("/")}else d=I}return u?c.h=d:u=i.i.toString()!=="",u?es(c,no(i.i)):u=!!i.m,u&&(c.m=i.m),c};function Vt(i){return new Gt(i)}function Xe(i,c,u){i.j=u?Ze(c,!0):c,i.j&&(i.j=i.j.replace(/:$/,""))}function Je(i,c){if(c){if(c=Number(c),isNaN(c)||c<0)throw Error("Bad port number "+c);i.u=c}else i.u=null}function es(i,c,u){c instanceof en?(i.i=c,qu(i.i,i.l)):(u||(c=tn(c,Bu)),i.i=new en(c,i.l))}function Q(i,c,u){i.i.set(c,u)}function Un(i){return Q(i,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),i}function Ze(i,c){return i?c?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function tn(i,c,u){return typeof i=="string"?(i=encodeURI(i).replace(c,Lu),u&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function Lu(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var Xi=/[#\/\?@]/g,Fu=/[#\?:]/g,Uu=/[#\?]/g,Bu=/[#\?@]/g,ju=/#/g;function en(i,c){this.h=this.g=null,this.i=i||null,this.j=!!c}function ue(i){i.g||(i.g=new Map,i.h=0,i.i&&Mu(i.i,function(c,u){i.add(decodeURIComponent(c.replace(/\+/g," ")),u)}))}n=en.prototype,n.add=function(i,c){ue(this),this.i=null,i=Re(this,i);let u=this.g.get(i);return u||this.g.set(i,u=[]),u.push(c),this.h+=1,this};function Ji(i,c){ue(i),c=Re(i,c),i.g.has(c)&&(i.i=null,i.h-=i.g.get(c).length,i.g.delete(c))}function Zi(i,c){return ue(i),c=Re(i,c),i.g.has(c)}n.forEach=function(i,c){ue(this),this.g.forEach(function(u,d){u.forEach(function(I){i.call(c,I,d,this)},this)},this)};function to(i,c){ue(i);let u=[];if(typeof c=="string")Zi(i,c)&&(u=u.concat(i.g.get(Re(i,c))));else for(i=Array.from(i.g.values()),c=0;c<i.length;c++)u=u.concat(i[c]);return u}n.set=function(i,c){return ue(this),this.i=null,i=Re(this,i),Zi(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[c]),this.h+=1,this},n.get=function(i,c){return i?(i=to(this,i),i.length>0?String(i[0]):c):c};function eo(i,c,u){Ji(i,c),u.length>0&&(i.i=null,i.g.set(Re(i,c),P(u)),i.h+=u.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],c=Array.from(this.g.keys());for(let d=0;d<c.length;d++){var u=c[d];const I=Qe(u);u=to(this,u);for(let w=0;w<u.length;w++){let C=I;u[w]!==""&&(C+="="+Qe(u[w])),i.push(C)}}return this.i=i.join("&")};function no(i){const c=new en;return c.i=i.i,i.g&&(c.g=new Map(i.g),c.h=i.h),c}function Re(i,c){return c=String(c),i.j&&(c=c.toLowerCase()),c}function qu(i,c){c&&!i.j&&(ue(i),i.i=null,i.g.forEach(function(u,d){const I=d.toLowerCase();d!=I&&(Ji(this,d),eo(this,I,u))},i)),i.j=c}function $u(i,c){const u=new We;if(a.Image){const d=new Image;d.onload=g(Ht,u,"TestLoadImage: loaded",!0,c,d),d.onerror=g(Ht,u,"TestLoadImage: error",!1,c,d),d.onabort=g(Ht,u,"TestLoadImage: abort",!1,c,d),d.ontimeout=g(Ht,u,"TestLoadImage: timeout",!1,c,d),a.setTimeout(function(){d.ontimeout&&d.ontimeout()},1e4),d.src=i}else c(!1)}function zu(i,c){const u=new We,d=new AbortController,I=setTimeout(()=>{d.abort(),Ht(u,"TestPingServer: timeout",!1,c)},1e4);fetch(i,{signal:d.signal}).then(w=>{clearTimeout(I),w.ok?Ht(u,"TestPingServer: ok",!0,c):Ht(u,"TestPingServer: server error",!1,c)}).catch(()=>{clearTimeout(I),Ht(u,"TestPingServer: error",!1,c)})}function Ht(i,c,u,d,I){try{I&&(I.onload=null,I.onerror=null,I.onabort=null,I.ontimeout=null),d(u)}catch{}}function Gu(){this.g=new bu}function ns(i){this.i=i.Sb||null,this.h=i.ab||!1}v(ns,Ni),ns.prototype.g=function(){return new Bn(this.i,this.h)};function Bn(i,c){mt.call(this),this.H=i,this.o=c,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}v(Bn,mt),n=Bn.prototype,n.open=function(i,c){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=i,this.D=c,this.readyState=1,rn(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const c={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};i&&(c.body=i),(this.H||a).fetch(new Request(this.D,c)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,nn(this)),this.readyState=0},n.Pa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,rn(this)),this.g&&(this.readyState=3,rn(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof a.ReadableStream!="undefined"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;ro(this)}else i.text().then(this.Oa.bind(this),this.ga.bind(this))};function ro(i){i.j.read().then(i.Ma.bind(i)).catch(i.ga.bind(i))}n.Ma=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var c=i.value?i.value:new Uint8Array(0);(c=this.B.decode(c,{stream:!i.done}))&&(this.response=this.responseText+=c)}i.done?nn(this):rn(this),this.readyState==3&&ro(this)}},n.Oa=function(i){this.g&&(this.response=this.responseText=i,nn(this))},n.Na=function(i){this.g&&(this.response=i,nn(this))},n.ga=function(){this.g&&nn(this)};function nn(i){i.readyState=4,i.l=null,i.j=null,i.B=null,rn(i)}n.setRequestHeader=function(i,c){this.A.append(i,c)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],c=this.h.entries();for(var u=c.next();!u.done;)u=u.value,i.push(u[0]+": "+u[1]),u=c.next();return i.join(`\r
`)};function rn(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(Bn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function so(i){let c="";return kn(i,function(u,d){c+=d,c+=":",c+=u,c+=`\r
`}),c}function rs(i,c,u){t:{for(d in u){var d=!1;break t}d=!0}d||(u=so(u),typeof i=="string"?u!=null&&Qe(u):Q(i,c,u))}function Z(i){mt.call(this),this.headers=new Map,this.L=i||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}v(Z,mt);var Hu=/^https?$/i,Ku=["POST","PUT"];n=Z.prototype,n.Fa=function(i){this.H=i},n.ea=function(i,c,u,d){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);c=c?c.toUpperCase():"GET",this.D=i,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Ui.g(),this.g.onreadystatechange=R(f(this.Ca,this));try{this.B=!0,this.g.open(c,String(i),!0),this.B=!1}catch(w){io(this,w);return}if(i=u||"",u=new Map(this.headers),d)if(Object.getPrototypeOf(d)===Object.prototype)for(var I in d)u.set(I,d[I]);else if(typeof d.keys=="function"&&typeof d.get=="function")for(const w of d.keys())u.set(w,d.get(w));else throw Error("Unknown input type for opt_headers: "+String(d));d=Array.from(u.keys()).find(w=>w.toLowerCase()=="content-type"),I=a.FormData&&i instanceof a.FormData,!(Array.prototype.indexOf.call(Ku,c,void 0)>=0)||d||I||u.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[w,C]of u)this.g.setRequestHeader(w,C);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(i),this.v=!1}catch(w){io(this,w)}};function io(i,c){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=c,i.o=5,oo(i),jn(i)}function oo(i){i.A||(i.A=!0,Et(i,"complete"),Et(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=i||7,Et(this,"complete"),Et(this,"abort"),jn(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),jn(this,!0)),Z.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?ao(this):this.Xa())},n.Xa=function(){ao(this)};function ao(i){if(i.h&&typeof o!="undefined"){if(i.v&&Kt(i)==4)setTimeout(i.Ca.bind(i),0);else if(Et(i,"readystatechange"),Kt(i)==4){i.h=!1;try{const w=i.ca();t:switch(w){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break t;default:c=!1}var u;if(!(u=c)){var d;if(d=w===0){let C=String(i.D).match(Yi)[1]||null;!C&&a.self&&a.self.location&&(C=a.self.location.protocol.slice(0,-1)),d=!Hu.test(C?C.toLowerCase():"")}u=d}if(u)Et(i,"complete"),Et(i,"success");else{i.o=6;try{var I=Kt(i)>2?i.g.statusText:""}catch{I=""}i.l=I+" ["+i.ca()+"]",oo(i)}}finally{jn(i)}}}}function jn(i,c){if(i.g){i.m&&(clearTimeout(i.m),i.m=null);const u=i.g;i.g=null,c||Et(i,"ready");try{u.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Kt(i){return i.g?i.g.readyState:0}n.ca=function(){try{return Kt(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(i){if(this.g){var c=this.g.responseText;return i&&c.indexOf(i)==0&&(c=c.substring(i.length)),Su(c)}};function co(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.F){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function Wu(i){const c={};i=(i.g&&Kt(i)>=2&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let d=0;d<i.length;d++){if(p(i[d]))continue;var u=Nu(i[d]);const I=u[0];if(u=u[1],typeof u!="string")continue;u=u.trim();const w=c[I]||[];c[I]=w,w.push(u)}vu(c,function(d){return d.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function sn(i,c,u){return u&&u.internalChannelParams&&u.internalChannelParams[i]||c}function uo(i){this.za=0,this.i=[],this.j=new We,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=sn("failFast",!1,i),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=sn("baseRetryDelayMs",5e3,i),this.Za=sn("retryDelaySeedMs",1e4,i),this.Ta=sn("forwardChannelMaxRetries",2,i),this.va=sn("forwardChannelRequestTimeoutMs",2e4,i),this.ma=i&&i.xmlHttpFactory||void 0,this.Ua=i&&i.Rb||void 0,this.Aa=i&&i.useFetchStreams||!1,this.O=void 0,this.L=i&&i.supportsCrossDomainXhr||!1,this.M="",this.h=new Gi(i&&i.concurrentRequestLimit),this.Ba=new Gu,this.S=i&&i.fastHandshake||!1,this.R=i&&i.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=i&&i.Pb||!1,i&&i.ua&&this.j.ua(),i&&i.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&i&&i.detectBufferingProxy||!1,this.ia=void 0,i&&i.longPollingTimeout&&i.longPollingTimeout>0&&(this.ia=i.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=uo.prototype,n.ka=8,n.I=1,n.connect=function(i,c,u,d){Tt(0),this.W=i,this.H=c||{},u&&d!==void 0&&(this.H.OSID=u,this.H.OAID=d),this.F=this.X,this.J=Eo(this,null,this.W),$n(this)};function ss(i){if(ho(i),i.I==3){var c=i.V++,u=Vt(i.J);if(Q(u,"SID",i.M),Q(u,"RID",c),Q(u,"TYPE","terminate"),on(i,u),c=new zt(i,i.j,c),c.M=2,c.A=Un(Vt(u)),u=!1,a.navigator&&a.navigator.sendBeacon)try{u=a.navigator.sendBeacon(c.A.toString(),"")}catch{}!u&&a.Image&&(new Image().src=c.A,u=!0),u||(c.g=To(c.j,null),c.g.ea(c.A)),c.F=Date.now(),Fn(c)}yo(i)}function qn(i){i.g&&(os(i),i.g.cancel(),i.g=null)}function ho(i){qn(i),i.v&&(a.clearTimeout(i.v),i.v=null),zn(i),i.h.cancel(),i.m&&(typeof i.m=="number"&&a.clearTimeout(i.m),i.m=null)}function $n(i){if(!Hi(i.h)&&!i.m){i.m=!0;var c=i.Ea;st||m(),it||(st(),it=!0),E.add(c,i),i.D=0}}function Qu(i,c){return Ki(i.h)>=i.h.j-(i.m?1:0)?!1:i.m?(i.i=c.G.concat(i.i),!0):i.I==1||i.I==2||i.D>=(i.Sa?0:i.Ta)?!1:(i.m=Ke(f(i.Ea,i,c),_o(i,i.D)),i.D++,!0)}n.Ea=function(i){if(this.m)if(this.m=null,this.I==1){if(!i){this.V=Math.floor(Math.random()*1e5),i=this.V++;const I=new zt(this,this.j,i);let w=this.o;if(this.U&&(w?(w=vi(w),Ai(w,this.U)):w=this.U),this.u!==null||this.R||(I.J=w,w=null),this.S)t:{for(var c=0,u=0;u<this.i.length;u++){e:{var d=this.i[u];if("__data__"in d.map&&(d=d.map.__data__,typeof d=="string")){d=d.length;break e}d=void 0}if(d===void 0)break;if(c+=d,c>4096){c=u;break t}if(c===4096||u===this.i.length-1){c=u+1;break t}}c=1e3}else c=1e3;c=fo(this,I,c),u=Vt(this.J),Q(u,"RID",i),Q(u,"CVER",22),this.G&&Q(u,"X-HTTP-Session-Id",this.G),on(this,u),w&&(this.R?c="headers="+Qe(so(w))+"&"+c:this.u&&rs(u,this.u,w)),ts(this.h,I),this.Ra&&Q(u,"TYPE","init"),this.S?(Q(u,"$req",c),Q(u,"SID","null"),I.U=!0,Yr(I,u,null)):Yr(I,u,c),this.I=2}}else this.I==3&&(i?lo(this,i):this.i.length==0||Hi(this.h)||lo(this))};function lo(i,c){var u;c?u=c.l:u=i.V++;const d=Vt(i.J);Q(d,"SID",i.M),Q(d,"RID",u),Q(d,"AID",i.K),on(i,d),i.u&&i.o&&rs(d,i.u,i.o),u=new zt(i,i.j,u,i.D+1),i.u===null&&(u.J=i.o),c&&(i.i=c.G.concat(i.i)),c=fo(i,u,1e3),u.H=Math.round(i.va*.5)+Math.round(i.va*.5*Math.random()),ts(i.h,u),Yr(u,d,c)}function on(i,c){i.H&&kn(i.H,function(u,d){Q(c,d,u)}),i.l&&kn({},function(u,d){Q(c,d,u)})}function fo(i,c,u){u=Math.min(i.i.length,u);const d=i.l?f(i.l.Ka,i.l,i):null;t:{var I=i.i;let U=-1;for(;;){const ot=["count="+u];U==-1?u>0?(U=I[0].g,ot.push("ofs="+U)):U=0:ot.push("ofs="+U);let K=!0;for(let ut=0;ut<u;ut++){var w=I[ut].g;const Dt=I[ut].map;if(w-=U,w<0)U=Math.max(0,I[ut].g-100),K=!1;else try{w="req"+w+"_"||"";try{var C=Dt instanceof Map?Dt:Object.entries(Dt);for(const[le,Wt]of C){let Qt=Wt;h(Wt)&&(Qt=Gr(Wt)),ot.push(w+le+"="+encodeURIComponent(Qt))}}catch(le){throw ot.push(w+"type="+encodeURIComponent("_badmap")),le}}catch{d&&d(Dt)}}if(K){C=ot.join("&");break t}}C=void 0}return i=i.i.splice(0,u),c.G=i,C}function mo(i){if(!i.g&&!i.v){i.Y=1;var c=i.Da;st||m(),it||(st(),it=!0),E.add(c,i),i.A=0}}function is(i){return i.g||i.v||i.A>=3?!1:(i.Y++,i.v=Ke(f(i.Da,i),_o(i,i.A)),i.A++,!0)}n.Da=function(){if(this.v=null,po(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var i=4*this.T;this.j.info("BP detection timer enabled: "+i),this.B=Ke(f(this.Wa,this),i)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Tt(10),qn(this),po(this))};function os(i){i.B!=null&&(a.clearTimeout(i.B),i.B=null)}function po(i){i.g=new zt(i,i.j,"rpc",i.Y),i.u===null&&(i.g.J=i.o),i.g.P=0;var c=Vt(i.na);Q(c,"RID","rpc"),Q(c,"SID",i.M),Q(c,"AID",i.K),Q(c,"CI",i.F?"0":"1"),!i.F&&i.ia&&Q(c,"TO",i.ia),Q(c,"TYPE","xmlhttp"),on(i,c),i.u&&i.o&&rs(c,i.u,i.o),i.O&&(i.g.H=i.O);var u=i.g;i=i.ba,u.M=1,u.A=Un(Vt(c)),u.u=null,u.R=!0,qi(u,i)}n.Va=function(){this.C!=null&&(this.C=null,qn(this),is(this),Tt(19))};function zn(i){i.C!=null&&(a.clearTimeout(i.C),i.C=null)}function go(i,c){var u=null;if(i.g==c){zn(i),os(i),i.g=null;var d=2}else if(Zr(i.h,c))u=c.G,Wi(i.h,c),d=1;else return;if(i.I!=0){if(c.o)if(d==1){u=c.u?c.u.length:0,c=Date.now()-c.F;var I=i.D;d=Mn(),Et(d,new Li(d,u)),$n(i)}else mo(i);else if(I=c.m,I==3||I==0&&c.X>0||!(d==1&&Qu(i,c)||d==2&&is(i)))switch(u&&u.length>0&&(c=i.h,c.i=c.i.concat(u)),I){case 1:he(i,5);break;case 4:he(i,10);break;case 3:he(i,6);break;default:he(i,2)}}}function _o(i,c){let u=i.Qa+Math.floor(Math.random()*i.Za);return i.isActive()||(u*=2),u*c}function he(i,c){if(i.j.info("Error code "+c),c==2){var u=f(i.bb,i),d=i.Ua;const I=!d;d=new Gt(d||"//www.google.com/images/cleardot.gif"),a.location&&a.location.protocol=="http"||Xe(d,"https"),Un(d),I?$u(d.toString(),u):zu(d.toString(),u)}else Tt(2);i.I=0,i.l&&i.l.pa(c),yo(i),ho(i)}n.bb=function(i){i?(this.j.info("Successfully pinged google.com"),Tt(2)):(this.j.info("Failed to ping google.com"),Tt(1))};function yo(i){if(i.I=0,i.ja=[],i.l){const c=Qi(i.h);(c.length!=0||i.i.length!=0)&&(k(i.ja,c),k(i.ja,i.i),i.h.i.length=0,P(i.i),i.i.length=0),i.l.oa()}}function Eo(i,c,u){var d=u instanceof Gt?Vt(u):new Gt(u);if(d.g!="")c&&(d.g=c+"."+d.g),Je(d,d.u);else{var I=a.location;d=I.protocol,c=c?c+"."+I.hostname:I.hostname,I=+I.port;const w=new Gt(null);d&&Xe(w,d),c&&(w.g=c),I&&Je(w,I),u&&(w.h=u),d=w}return u=i.G,c=i.wa,u&&c&&Q(d,u,c),Q(d,"VER",i.ka),on(i,d),d}function To(i,c,u){if(c&&!i.L)throw Error("Can't create secondary domain capable XhrIo object.");return c=i.Aa&&!i.ma?new Z(new ns({ab:u})):new Z(i.ma),c.Fa(i.L),c}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function vo(){}n=vo.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function Gn(){}Gn.prototype.g=function(i,c){return new wt(i,c)};function wt(i,c){mt.call(this),this.g=new uo(c),this.l=i,this.h=c&&c.messageUrlParams||null,i=c&&c.messageHeaders||null,c&&c.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=c&&c.initMessageHeaders||null,c&&c.messageContentType&&(i?i["X-WebChannel-Content-Type"]=c.messageContentType:i={"X-WebChannel-Content-Type":c.messageContentType}),c&&c.sa&&(i?i["X-WebChannel-Client-Profile"]=c.sa:i={"X-WebChannel-Client-Profile":c.sa}),this.g.U=i,(i=c&&c.Qb)&&!p(i)&&(this.g.u=i),this.A=c&&c.supportsCrossDomainXhr||!1,this.v=c&&c.sendRawJson||!1,(c=c&&c.httpSessionIdParam)&&!p(c)&&(this.g.G=c,i=this.h,i!==null&&c in i&&(i=this.h,c in i&&delete i[c])),this.j=new Se(this)}v(wt,mt),wt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},wt.prototype.close=function(){ss(this.g)},wt.prototype.o=function(i){var c=this.g;if(typeof i=="string"){var u={};u.__data__=i,i=u}else this.v&&(u={},u.__data__=Gr(i),i=u);c.i.push(new xu(c.Ya++,i)),c.I==3&&$n(c)},wt.prototype.N=function(){this.g.l=null,delete this.j,ss(this.g),delete this.g,wt.Z.N.call(this)};function Io(i){Hr.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var c=i.__sm__;if(c){t:{for(const u in c){i=u;break t}i=void 0}(this.i=i)&&(i=this.i,c=c!==null&&i in c?c[i]:void 0),this.data=c}else this.data=i}v(Io,Hr);function Ao(){Kr.call(this),this.status=1}v(Ao,Kr);function Se(i){this.g=i}v(Se,vo),Se.prototype.ra=function(){Et(this.g,"a")},Se.prototype.qa=function(i){Et(this.g,new Io(i))},Se.prototype.pa=function(i){Et(this.g,new Ao)},Se.prototype.oa=function(){Et(this.g,"b")},Gn.prototype.createWebChannel=Gn.prototype.g,wt.prototype.send=wt.prototype.o,wt.prototype.open=wt.prototype.m,wt.prototype.close=wt.prototype.close,Jo=function(){return new Gn},Xo=function(){return Mn()},Yo=ae,Ts={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ln.NO_ERROR=0,Ln.TIMEOUT=8,Ln.HTTP_ERROR=6,Zn=Ln,Fi.COMPLETE="complete",Qo=Fi,ki.EventType=Ge,Ge.OPEN="a",Ge.CLOSE="b",Ge.ERROR="c",Ge.MESSAGE="d",mt.prototype.listen=mt.prototype.J,ln=ki,Z.prototype.listenOnce=Z.prototype.K,Z.prototype.getLastError=Z.prototype.Ha,Z.prototype.getLastErrorCode=Z.prototype.ya,Z.prototype.getStatus=Z.prototype.ca,Z.prototype.getResponseJson=Z.prototype.La,Z.prototype.getResponseText=Z.prototype.la,Z.prototype.send=Z.prototype.ea,Z.prototype.setWithCredentials=Z.prototype.Fa,Wo=Z}).apply(typeof Jn!="undefined"?Jn:typeof self!="undefined"?self:typeof window!="undefined"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}pt.UNAUTHENTICATED=new pt(null),pt.GOOGLE_CREDENTIALS=new pt("google-credentials-uid"),pt.FIRST_PARTY=new pt("first-party-uid"),pt.MOCK_USER=new pt("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ce="12.12.0";function jl(n){Ce=n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fe=new ko("@firebase/firestore");function Ve(){return fe.logLevel}function D(n,...t){if(fe.logLevel<=q.DEBUG){const e=t.map(vs);fe.debug(`Firestore (${Ce}): ${n}`,...e)}}function Bt(n,...t){if(fe.logLevel<=q.ERROR){const e=t.map(vs);fe.error(`Firestore (${Ce}): ${n}`,...e)}}function me(n,...t){if(fe.logLevel<=q.WARN){const e=t.map(vs);fe.warn(`Firestore (${Ce}): ${n}`,...e)}}function vs(n){if(typeof n=="string")return n;try{return function(e){return JSON.stringify(e)}(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(n,t,e){let r="Unexpected state";typeof t=="string"?r=t:e=t,Zo(n,r,e)}function Zo(n,t,e){let r=`FIRESTORE (${Ce}) INTERNAL ASSERTION FAILED: ${t} (ID: ${n.toString(16)})`;if(e!==void 0)try{r+=" CONTEXT: "+JSON.stringify(e)}catch{r+=" CONTEXT: "+e}throw Bt(r),new Error(r)}function G(n,t,e,r){let s="Unexpected state";typeof e=="string"?s=e:r=e,n||Zo(t,s,r)}function F(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class N extends be{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ta{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class ql{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(pt.UNAUTHENTICATED))}shutdown(){}}class $l{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class zl{constructor(t){this.t=t,this.currentUser=pt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){G(this.o===void 0,42304);let r=this.i;const s=l=>this.i!==r?(r=this.i,e(l)):Promise.resolve();let o=new jt;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new jt,t.enqueueRetryable(()=>s(this.currentUser))};const a=()=>{const l=o;t.enqueueRetryable(async()=>{await l.promise,await s(this.currentUser)})},h=l=>{D("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(l=>h(l)),setTimeout(()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?h(l):(D("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new jt)}},0),a()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(r=>this.i!==t?(D("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(G(typeof r.accessToken=="string",31837,{l:r}),new ta(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return G(t===null||typeof t=="string",2055,{h:t}),new pt(t)}}class Gl{constructor(t,e,r){this.P=t,this.T=e,this.I=r,this.type="FirstParty",this.user=pt.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const t=this.A();return t&&this.R.set("Authorization",t),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class Hl{constructor(t,e,r){this.P=t,this.T=e,this.I=r}getToken(){return Promise.resolve(new Gl(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable(()=>e(pt.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class ea{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Kl{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Rl(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){G(this.o===void 0,3512);const r=o=>{o.error!=null&&D("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const a=o.token!==this.m;return this.m=o.token,D("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable(()=>r(o))};const s=o=>{D("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(o=>s(o)),setTimeout(()=>{if(!this.appCheck){const o=this.V.getImmediate({optional:!0});o?s(o):D("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new ea(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(e=>e?(G(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new ea(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wl(n){const t=typeof self!="undefined"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Is{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(256/62);let r="";for(;r.length<20;){const s=Wl(40);for(let o=0;o<s.length;++o)r.length<20&&s[o]<e&&(r+=t.charAt(s[o]%62))}return r}}function B(n,t){return n<t?-1:n>t?1:0}function As(n,t){const e=Math.min(n.length,t.length);for(let r=0;r<e;r++){const s=n.charAt(r),o=t.charAt(r);if(s!==o)return ws(s)===ws(o)?B(s,o):ws(s)?1:-1}return B(n.length,t.length)}const Ql=55296,Yl=57343;function ws(n){const t=n.charCodeAt(0);return t>=Ql&&t<=Yl}function De(n,t,e){return n.length===t.length&&n.every((r,s)=>e(r,t[s]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const na="__name__";class Nt{constructor(t,e,r){e===void 0?e=0:e>t.length&&M(637,{offset:e,range:t.length}),r===void 0?r=t.length-e:r>t.length-e&&M(1746,{length:r,range:t.length-e}),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return Nt.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof Nt?t.forEach(r=>{e.push(r)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let s=0;s<r;s++){const o=Nt.compareSegments(t.get(s),e.get(s));if(o!==0)return o}return B(t.length,e.length)}static compareSegments(t,e){const r=Nt.isNumericId(t),s=Nt.isNumericId(e);return r&&!s?-1:!r&&s?1:r&&s?Nt.extractNumericId(t).compare(Nt.extractNumericId(e)):As(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Jt.fromString(t.substring(4,t.length-2))}}class Y extends Nt{construct(t,e,r){return new Y(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new N(b.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter(s=>s.length>0))}return new Y(e)}static emptyPath(){return new Y([])}}const Xl=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class lt extends Nt{construct(t,e,r){return new lt(t,e,r)}static isValidIdentifier(t){return Xl.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),lt.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===na}static keyField(){return new lt([na])}static fromServerFormat(t){const e=[];let r="",s=0;const o=()=>{if(r.length===0)throw new N(b.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let a=!1;for(;s<t.length;){const h=t[s];if(h==="\\"){if(s+1===t.length)throw new N(b.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const l=t[s+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new N(b.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=l,s+=2}else h==="`"?(a=!a,s++):h!=="."||a?(r+=h,s++):(o(),s++)}if(o(),a)throw new N(b.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new lt(e)}static emptyPath(){return new lt([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class O{constructor(t){this.path=t}static fromPath(t){return new O(Y.fromString(t))}static fromName(t){return new O(Y.fromString(t).popFirst(5))}static empty(){return new O(Y.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&Y.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return Y.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new O(new Y(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ra(n,t,e){if(!e)throw new N(b.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function Jl(n,t,e,r){if(t===!0&&r===!0)throw new N(b.INVALID_ARGUMENT,`${n} and ${e} cannot be used together.`)}function sa(n){if(!O.isDocumentKey(n))throw new N(b.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function ia(n){if(O.isDocumentKey(n))throw new N(b.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function oa(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Rs(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=function(r){return r.constructor?r.constructor.name:null}(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":M(12329,{type:typeof n})}function bt(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new N(b.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=Rs(n);throw new N(b.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function et(n,t){const e={typeString:n};return t&&(e.value=t),e}function dn(n,t){if(!oa(n))throw new N(b.INVALID_ARGUMENT,"JSON must be an object");let e;for(const r in t)if(t[r]){const s=t[r].typeString,o="value"in t[r]?{value:t[r].value}:void 0;if(!(r in n)){e=`JSON missing required field: '${r}'`;break}const a=n[r];if(s&&typeof a!==s){e=`JSON field '${r}' must be a ${s}.`;break}if(o!==void 0&&a!==o.value){e=`Expected '${r}' field to equal '${o.value}'`;break}}if(e)throw new N(b.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aa=-62135596800,ca=1e6;class X{static now(){return X.fromMillis(Date.now())}static fromDate(t){return X.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor((t-1e3*e)*ca);return new X(e,r)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new N(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new N(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<aa)throw new N(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new N(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/ca}_compareTo(t){return this.seconds===t.seconds?B(this.nanoseconds,t.nanoseconds):B(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:X._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(dn(t,X._jsonSchema))return new X(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-aa;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}X._jsonSchemaVersion="firestore/timestamp/1.0",X._jsonSchema={type:et("string",X._jsonSchemaVersion),seconds:et("number"),nanoseconds:et("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L{static fromTimestamp(t){return new L(t)}static min(){return new L(new X(0,0))}static max(){return new L(new X(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn=-1;function Zl(n,t){const e=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=L.fromTimestamp(r===1e9?new X(e+1,0):new X(e,r));return new Zt(s,O.empty(),t)}function td(n){return new Zt(n.readTime,n.key,fn)}class Zt{constructor(t,e,r){this.readTime=t,this.documentKey=e,this.largestBatchId=r}static min(){return new Zt(L.min(),O.empty(),fn)}static max(){return new Zt(L.max(),O.empty(),fn)}}function ed(n,t){let e=n.readTime.compareTo(t.readTime);return e!==0?e:(e=O.comparator(n.documentKey,t.documentKey),e!==0?e:B(n.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nd="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class rd{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ne(n){if(n.code!==b.FAILED_PRECONDITION||n.message!==nd)throw n;D("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class S{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&M(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new S((r,s)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(r,s)},this.catchCallback=o=>{this.wrapFailure(e,o).next(r,s)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof S?e:S.resolve(e)}catch(e){return S.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):S.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):S.reject(e)}static resolve(t){return new S((e,r)=>{e(t)})}static reject(t){return new S((e,r)=>{r(t)})}static waitFor(t){return new S((e,r)=>{let s=0,o=0,a=!1;t.forEach(h=>{++s,h.next(()=>{++o,a&&o===s&&e()},l=>r(l))}),a=!0,o===s&&e()})}static or(t){let e=S.resolve(!1);for(const r of t)e=e.next(s=>s?S.resolve(s):r());return e}static forEach(t,e){const r=[];return t.forEach((s,o)=>{r.push(e.call(this,s,o))}),this.waitFor(r)}static mapArray(t,e){return new S((r,s)=>{const o=t.length,a=new Array(o);let h=0;for(let l=0;l<o;l++){const f=l;e(t[f]).next(g=>{a[f]=g,++h,h===o&&r(a)},g=>s(g))}})}static doWhile(t,e){return new S((r,s)=>{const o=()=>{t()===!0?e().next(()=>{o()},s):r()};o()})}}function sd(n){const t=n.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function ke(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tr{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>e.writeSequenceNumber(r))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}tr.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ss=-1;function er(n){return n==null}function nr(n){return n===0&&1/n==-1/0}function id(n){return typeof n=="number"&&Number.isInteger(n)&&!nr(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ua="";function od(n){let t="";for(let e=0;e<n.length;e++)t.length>0&&(t=ha(t)),t=ad(n.get(e),t);return ha(t)}function ad(n,t){let e=t;const r=n.length;for(let s=0;s<r;s++){const o=n.charAt(s);switch(o){case"\0":e+="";break;case ua:e+="";break;default:e+=o}}return e}function ha(n){return n+ua+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function la(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function pe(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}function da(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class J{constructor(t,e){this.comparator=t,this.root=e||dt.EMPTY}insert(t,e){return new J(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,dt.BLACK,null,null))}remove(t){return new J(this.comparator,this.root.remove(t,this.comparator).copy(null,null,dt.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(t,r.key);if(s===0)return e+r.left.size;s<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,r)=>(t(e,r),!1))}toString(){const t=[];return this.inorderTraversal((e,r)=>(t.push(`${e}:${r}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new rr(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new rr(this.root,t,this.comparator,!1)}getReverseIterator(){return new rr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new rr(this.root,t,this.comparator,!0)}}class rr{constructor(t,e,r,s){this.isReverse=s,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?r(t.key,e):1,e&&s&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class dt{constructor(t,e,r,s,o){this.key=t,this.value=e,this.color=r!=null?r:dt.RED,this.left=s!=null?s:dt.EMPTY,this.right=o!=null?o:dt.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,s,o){return new dt(t!=null?t:this.key,e!=null?e:this.value,r!=null?r:this.color,s!=null?s:this.left,o!=null?o:this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let s=this;const o=r(t,s.key);return s=o<0?s.copy(null,null,null,s.left.insert(t,e,r),null):o===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return dt.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return dt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,dt.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,dt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw M(43730,{key:this.key,value:this.value});if(this.right.isRed())throw M(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw M(27949);return t+(this.isRed()?0:1)}}dt.EMPTY=null,dt.RED=!0,dt.BLACK=!1;dt.EMPTY=new class{constructor(){this.size=0}get key(){throw M(57766)}get value(){throw M(16141)}get color(){throw M(16727)}get left(){throw M(29726)}get right(){throw M(36894)}copy(t,e,r,s,o){return this}insert(t,e,r){return new dt(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class at{constructor(t){this.comparator=t,this.data=new J(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,r)=>(t(e),!1))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new fa(this.data.getIterator())}getIteratorFrom(t){return new fa(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(r=>{e=e.add(r)}),e}isEqual(t){if(!(t instanceof at)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(this.comparator(s,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new at(this.comparator);return e.data=t,e}}class fa{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(t){this.fields=t,t.sort(lt.comparator)}static empty(){return new Pt([])}unionWith(t){let e=new at(lt.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new Pt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return De(this.fields,t.fields,(e,r)=>e.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ma extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ft{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(s){try{return atob(s)}catch(o){throw typeof DOMException!="undefined"&&o instanceof DOMException?new ma("Invalid base64 string: "+o):o}}(t);return new ft(e)}static fromUint8Array(t){const e=function(s){let o="";for(let a=0;a<s.length;++a)o+=String.fromCharCode(s[a]);return o}(t);return new ft(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return B(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}ft.EMPTY_BYTE_STRING=new ft("");const cd=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function te(n){if(G(!!n,39018),typeof n=="string"){let t=0;const e=cd.exec(n);if(G(!!e,46558,{timestamp:n}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:tt(n.seconds),nanos:tt(n.nanos)}}function tt(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function ee(n){return typeof n=="string"?ft.fromBase64String(n):ft.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pa="server_timestamp",ga="__type__",_a="__previous_value__",ya="__local_write_time__";function bs(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[ga])==null?void 0:r.stringValue)===pa}function sr(n){const t=n.mapValue.fields[_a];return bs(t)?sr(t):t}function mn(n){const t=te(n.mapValue.fields[ya].timestampValue);return new X(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ud{constructor(t,e,r,s,o,a,h,l,f,g,v){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=s,this.ssl=o,this.forceLongPolling=a,this.autoDetectLongPolling=h,this.longPollingOptions=l,this.useFetchStreams=f,this.isUsingEmulator=g,this.apiKey=v}}const ir="(default)";class pn{constructor(t,e){this.projectId=t,this.database=e||ir}static empty(){return new pn("","")}get isDefaultDatabase(){return this.database===ir}isEqual(t){return t instanceof pn&&t.projectId===this.projectId&&t.database===this.database}}function hd(n,t){if(!Object.prototype.hasOwnProperty.apply(n.options,["projectId"]))throw new N(b.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new pn(n.options.projectId,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ea="__type__",Ta="__max__",or={mapValue:{fields:{__type__:{stringValue:Ta}}}},va="__vector__",ar="value";function ne(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?bs(n)?4:dd(n)?9007199254740991:ld(n)?10:11:M(28295,{value:n})}function kt(n,t){if(n===t)return!0;const e=ne(n);if(e!==ne(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return mn(n).isEqual(mn(t));case 3:return function(s,o){if(typeof s.timestampValue=="string"&&typeof o.timestampValue=="string"&&s.timestampValue.length===o.timestampValue.length)return s.timestampValue===o.timestampValue;const a=te(s.timestampValue),h=te(o.timestampValue);return a.seconds===h.seconds&&a.nanos===h.nanos}(n,t);case 5:return n.stringValue===t.stringValue;case 6:return function(s,o){return ee(s.bytesValue).isEqual(ee(o.bytesValue))}(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return function(s,o){return tt(s.geoPointValue.latitude)===tt(o.geoPointValue.latitude)&&tt(s.geoPointValue.longitude)===tt(o.geoPointValue.longitude)}(n,t);case 2:return function(s,o){if("integerValue"in s&&"integerValue"in o)return tt(s.integerValue)===tt(o.integerValue);if("doubleValue"in s&&"doubleValue"in o){const a=tt(s.doubleValue),h=tt(o.doubleValue);return a===h?nr(a)===nr(h):isNaN(a)&&isNaN(h)}return!1}(n,t);case 9:return De(n.arrayValue.values||[],t.arrayValue.values||[],kt);case 10:case 11:return function(s,o){const a=s.mapValue.fields||{},h=o.mapValue.fields||{};if(la(a)!==la(h))return!1;for(const l in a)if(a.hasOwnProperty(l)&&(h[l]===void 0||!kt(a[l],h[l])))return!1;return!0}(n,t);default:return M(52216,{left:n})}}function gn(n,t){return(n.values||[]).find(e=>kt(e,t))!==void 0}function Oe(n,t){if(n===t)return 0;const e=ne(n),r=ne(t);if(e!==r)return B(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return B(n.booleanValue,t.booleanValue);case 2:return function(o,a){const h=tt(o.integerValue||o.doubleValue),l=tt(a.integerValue||a.doubleValue);return h<l?-1:h>l?1:h===l?0:isNaN(h)?isNaN(l)?0:-1:1}(n,t);case 3:return Ia(n.timestampValue,t.timestampValue);case 4:return Ia(mn(n),mn(t));case 5:return As(n.stringValue,t.stringValue);case 6:return function(o,a){const h=ee(o),l=ee(a);return h.compareTo(l)}(n.bytesValue,t.bytesValue);case 7:return function(o,a){const h=o.split("/"),l=a.split("/");for(let f=0;f<h.length&&f<l.length;f++){const g=B(h[f],l[f]);if(g!==0)return g}return B(h.length,l.length)}(n.referenceValue,t.referenceValue);case 8:return function(o,a){const h=B(tt(o.latitude),tt(a.latitude));return h!==0?h:B(tt(o.longitude),tt(a.longitude))}(n.geoPointValue,t.geoPointValue);case 9:return Aa(n.arrayValue,t.arrayValue);case 10:return function(o,a){var R,P,k,x;const h=o.fields||{},l=a.fields||{},f=(R=h[ar])==null?void 0:R.arrayValue,g=(P=l[ar])==null?void 0:P.arrayValue,v=B(((k=f==null?void 0:f.values)==null?void 0:k.length)||0,((x=g==null?void 0:g.values)==null?void 0:x.length)||0);return v!==0?v:Aa(f,g)}(n.mapValue,t.mapValue);case 11:return function(o,a){if(o===or.mapValue&&a===or.mapValue)return 0;if(o===or.mapValue)return 1;if(a===or.mapValue)return-1;const h=o.fields||{},l=Object.keys(h),f=a.fields||{},g=Object.keys(f);l.sort(),g.sort();for(let v=0;v<l.length&&v<g.length;++v){const R=As(l[v],g[v]);if(R!==0)return R;const P=Oe(h[l[v]],f[g[v]]);if(P!==0)return P}return B(l.length,g.length)}(n.mapValue,t.mapValue);default:throw M(23264,{he:e})}}function Ia(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return B(n,t);const e=te(n),r=te(t),s=B(e.seconds,r.seconds);return s!==0?s:B(e.nanos,r.nanos)}function Aa(n,t){const e=n.values||[],r=t.values||[];for(let s=0;s<e.length&&s<r.length;++s){const o=Oe(e[s],r[s]);if(o)return o}return B(e.length,r.length)}function xe(n){return Ps(n)}function Ps(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(e){const r=te(e);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(e){return ee(e).toBase64()}(n.bytesValue):"referenceValue"in n?function(e){return O.fromName(e).toString()}(n.referenceValue):"geoPointValue"in n?function(e){return`geo(${e.latitude},${e.longitude})`}(n.geoPointValue):"arrayValue"in n?function(e){let r="[",s=!0;for(const o of e.values||[])s?s=!1:r+=",",r+=Ps(o);return r+"]"}(n.arrayValue):"mapValue"in n?function(e){const r=Object.keys(e.fields||{}).sort();let s="{",o=!0;for(const a of r)o?o=!1:s+=",",s+=`${a}:${Ps(e.fields[a])}`;return s+"}"}(n.mapValue):M(61005,{value:n})}function cr(n){switch(ne(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=sr(n);return t?16+cr(t):16;case 5:return 2*n.stringValue.length;case 6:return ee(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((s,o)=>s+cr(o),0)}(n.arrayValue);case 10:case 11:return function(r){let s=0;return pe(r.fields,(o,a)=>{s+=o.length+cr(a)}),s}(n.mapValue);default:throw M(13486,{value:n})}}function Cs(n){return!!n&&"integerValue"in n}function Vs(n){return!!n&&"arrayValue"in n}function wa(n){return!!n&&"nullValue"in n}function Ra(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function ur(n){return!!n&&"mapValue"in n}function ld(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[Ea])==null?void 0:r.stringValue)===va}function _n(n){if(n.geoPointValue)return{geoPointValue:It({},n.geoPointValue)};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:It({},n.timestampValue)};if(n.mapValue){const t={mapValue:{fields:{}}};return pe(n.mapValue.fields,(e,r)=>t.mapValue.fields[e]=_n(r)),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=_n(n.arrayValue.values[e]);return t}return It({},n)}function dd(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Ta}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt{constructor(t){this.value=t}static empty(){return new Rt({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!ur(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=_n(e)}setAll(t){let e=lt.emptyPath(),r={},s=[];t.forEach((a,h)=>{if(!e.isImmediateParentOf(h)){const l=this.getFieldsMap(e);this.applyChanges(l,r,s),r={},s=[],e=h.popLast()}a?r[h.lastSegment()]=_n(a):s.push(h.lastSegment())});const o=this.getFieldsMap(e);this.applyChanges(o,r,s)}delete(t){const e=this.field(t.popLast());ur(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return kt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let s=e.mapValue.fields[t.get(r)];ur(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,r){pe(e,(s,o)=>t[s]=o);for(const s of r)delete t[s]}clone(){return new Rt(_n(this.value))}}function Sa(n){const t=[];return pe(n.fields,(e,r)=>{const s=new lt([e]);if(ur(r)){const o=Sa(r.mapValue).fields;if(o.length===0)t.push(s);else for(const a of o)t.push(s.child(a))}else t.push(s)}),new Pt(t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gt{constructor(t,e,r,s,o,a,h){this.key=t,this.documentType=e,this.version=r,this.readTime=s,this.createTime=o,this.data=a,this.documentState=h}static newInvalidDocument(t){return new gt(t,0,L.min(),L.min(),L.min(),Rt.empty(),0)}static newFoundDocument(t,e,r,s){return new gt(t,1,e,L.min(),r,s,0)}static newNoDocument(t,e){return new gt(t,2,e,L.min(),L.min(),Rt.empty(),0)}static newUnknownDocument(t,e){return new gt(t,3,e,L.min(),L.min(),Rt.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(L.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Rt.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Rt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=L.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof gt&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new gt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hr{constructor(t,e){this.position=t,this.inclusive=e}}function ba(n,t,e){let r=0;for(let s=0;s<n.position.length;s++){const o=t[s],a=n.position[s];if(o.field.isKeyField()?r=O.comparator(O.fromName(a.referenceValue),e.key):r=Oe(a,e.data.field(o.field)),o.dir==="desc"&&(r*=-1),r!==0)break}return r}function Pa(n,t){if(n===null)return t===null;if(t===null||n.inclusive!==t.inclusive||n.position.length!==t.position.length)return!1;for(let e=0;e<n.position.length;e++)if(!kt(n.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lr{constructor(t,e="asc"){this.field=t,this.dir=e}}function fd(n,t){return n.dir===t.dir&&n.field.isEqual(t.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ca{}class ct extends Ca{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new pd(t,e,r):e==="array-contains"?new yd(t,r):e==="in"?new Ed(t,r):e==="not-in"?new Td(t,r):e==="array-contains-any"?new vd(t,r):new ct(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new gd(t,r):new _d(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(Oe(e,this.value)):e!==null&&ne(this.value)===ne(e)&&this.matchesComparison(Oe(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return M(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Ot extends Ca{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new Ot(t,e)}matches(t){return Va(this)?this.filters.find(e=>!e.matches(t))===void 0:this.filters.find(e=>e.matches(t))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Va(n){return n.op==="and"}function Da(n){return md(n)&&Va(n)}function md(n){for(const t of n.filters)if(t instanceof Ot)return!1;return!0}function Ds(n){if(n instanceof ct)return n.field.canonicalString()+n.op.toString()+xe(n.value);if(Da(n))return n.filters.map(t=>Ds(t)).join(",");{const t=n.filters.map(e=>Ds(e)).join(",");return`${n.op}(${t})`}}function Na(n,t){return n instanceof ct?function(r,s){return s instanceof ct&&r.op===s.op&&r.field.isEqual(s.field)&&kt(r.value,s.value)}(n,t):n instanceof Ot?function(r,s){return s instanceof Ot&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce((o,a,h)=>o&&Na(a,s.filters[h]),!0):!1}(n,t):void M(19439)}function ka(n){return n instanceof ct?function(e){return`${e.field.canonicalString()} ${e.op} ${xe(e.value)}`}(n):n instanceof Ot?function(e){return e.op.toString()+" {"+e.getFilters().map(ka).join(" ,")+"}"}(n):"Filter"}class pd extends ct{constructor(t,e,r){super(t,e,r),this.key=O.fromName(r.referenceValue)}matches(t){const e=O.comparator(t.key,this.key);return this.matchesComparison(e)}}class gd extends ct{constructor(t,e){super(t,"in",e),this.keys=Oa("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class _d extends ct{constructor(t,e){super(t,"not-in",e),this.keys=Oa("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function Oa(n,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map(r=>O.fromName(r.referenceValue))}class yd extends ct{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Vs(e)&&gn(e.arrayValue,this.value)}}class Ed extends ct{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&gn(this.value.arrayValue,e)}}class Td extends ct{constructor(t,e){super(t,"not-in",e)}matches(t){if(gn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!gn(this.value.arrayValue,e)}}class vd extends ct{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Vs(e)||!e.arrayValue.values)&&e.arrayValue.values.some(r=>gn(this.value.arrayValue,r))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Id{constructor(t,e=null,r=[],s=[],o=null,a=null,h=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=s,this.limit=o,this.startAt=a,this.endAt=h,this.Te=null}}function xa(n,t=null,e=[],r=[],s=null,o=null,a=null){return new Id(n,t,e,r,s,o,a)}function Ns(n){const t=F(n);if(t.Te===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(r=>Ds(r)).join(","),e+="|ob:",e+=t.orderBy.map(r=>function(o){return o.field.canonicalString()+o.dir}(r)).join(","),er(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(r=>xe(r)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(r=>xe(r)).join(",")),t.Te=e}return t.Te}function ks(n,t){if(n.limit!==t.limit||n.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<n.orderBy.length;e++)if(!fd(n.orderBy[e],t.orderBy[e]))return!1;if(n.filters.length!==t.filters.length)return!1;for(let e=0;e<n.filters.length;e++)if(!Na(n.filters[e],t.filters[e]))return!1;return n.collectionGroup===t.collectionGroup&&!!n.path.isEqual(t.path)&&!!Pa(n.startAt,t.startAt)&&Pa(n.endAt,t.endAt)}function Os(n){return O.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dr{constructor(t,e=null,r=[],s=[],o=null,a="F",h=null,l=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=s,this.limit=o,this.limitType=a,this.startAt=h,this.endAt=l,this.Ee=null,this.Ie=null,this.Re=null,this.startAt,this.endAt}}function Ad(n,t,e,r,s,o,a,h){return new dr(n,t,e,r,s,o,a,h)}function fr(n){return new dr(n)}function Ma(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function wd(n){return O.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}function Rd(n){return n.collectionGroup!==null}function yn(n){const t=F(n);if(t.Ee===null){t.Ee=[];const e=new Set;for(const o of t.explicitOrderBy)t.Ee.push(o),e.add(o.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(a){let h=new at(lt.comparator);return a.filters.forEach(l=>{l.getFlattenedFilters().forEach(f=>{f.isInequality()&&(h=h.add(f.field))})}),h})(t).forEach(o=>{e.has(o.canonicalString())||o.isKeyField()||t.Ee.push(new lr(o,r))}),e.has(lt.keyField().canonicalString())||t.Ee.push(new lr(lt.keyField(),r))}return t.Ee}function xt(n){const t=F(n);return t.Ie||(t.Ie=Sd(t,yn(n))),t.Ie}function Sd(n,t){if(n.limitType==="F")return xa(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map(s=>{const o=s.dir==="desc"?"asc":"desc";return new lr(s.field,o)});const e=n.endAt?new hr(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new hr(n.startAt.position,n.startAt.inclusive):null;return xa(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function xs(n,t,e){return new dr(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),t,e,n.startAt,n.endAt)}function mr(n,t){return ks(xt(n),xt(t))&&n.limitType===t.limitType}function La(n){return`${Ns(xt(n))}|lt:${n.limitType}`}function Me(n){return`Query(target=${function(e){let r=e.path.canonicalString();return e.collectionGroup!==null&&(r+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(r+=`, filters: [${e.filters.map(s=>ka(s)).join(", ")}]`),er(e.limit)||(r+=", limit: "+e.limit),e.orderBy.length>0&&(r+=`, orderBy: [${e.orderBy.map(s=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(s)).join(", ")}]`),e.startAt&&(r+=", startAt: ",r+=e.startAt.inclusive?"b:":"a:",r+=e.startAt.position.map(s=>xe(s)).join(",")),e.endAt&&(r+=", endAt: ",r+=e.endAt.inclusive?"a:":"b:",r+=e.endAt.position.map(s=>xe(s)).join(",")),`Target(${r})`}(xt(n))}; limitType=${n.limitType})`}function pr(n,t){return t.isFoundDocument()&&function(r,s){const o=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(o):O.isDocumentKey(r.path)?r.path.isEqual(o):r.path.isImmediateParentOf(o)}(n,t)&&function(r,s){for(const o of yn(r))if(!o.field.isKeyField()&&s.data.field(o.field)===null)return!1;return!0}(n,t)&&function(r,s){for(const o of r.filters)if(!o.matches(s))return!1;return!0}(n,t)&&function(r,s){return!(r.startAt&&!function(a,h,l){const f=ba(a,h,l);return a.inclusive?f<=0:f<0}(r.startAt,yn(r),s)||r.endAt&&!function(a,h,l){const f=ba(a,h,l);return a.inclusive?f>=0:f>0}(r.endAt,yn(r),s))}(n,t)}function bd(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function Fa(n){return(t,e)=>{let r=!1;for(const s of yn(n)){const o=Pd(s,t,e);if(o!==0)return o;r=r||s.field.isKeyField()}return 0}}function Pd(n,t,e){const r=n.field.isKeyField()?O.comparator(t.key,e.key):function(o,a,h){const l=a.data.field(o),f=h.data.field(o);return l!==null&&f!==null?Oe(l,f):M(42886)}(n.field,t,e);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return M(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ge{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r!==void 0){for(const[s,o]of r)if(this.equalsFn(s,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const r=this.mapKeyFn(t),s=this.inner[r];if(s===void 0)return this.inner[r]=[[t,e]],void this.innerSize++;for(let o=0;o<s.length;o++)if(this.equalsFn(s[o][0],t))return void(s[o]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],t))return r.length===1?delete this.inner[e]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(t){pe(this.inner,(e,r)=>{for(const[s,o]of r)t(s,o)})}isEmpty(){return da(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cd=new J(O.comparator);function qt(){return Cd}const Ua=new J(O.comparator);function En(...n){let t=Ua;for(const e of n)t=t.insert(e.key,e);return t}function Ba(n){let t=Ua;return n.forEach((e,r)=>t=t.insert(e,r.overlayedDocument)),t}function _e(){return Tn()}function ja(){return Tn()}function Tn(){return new ge(n=>n.toString(),(n,t)=>n.isEqual(t))}const Vd=new J(O.comparator),Dd=new at(O.comparator);function j(...n){let t=Dd;for(const e of n)t=t.add(e);return t}const Nd=new at(B);function kd(){return Nd}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ms(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:nr(t)?"-0":t}}function qa(n){return{integerValue:""+n}}function Od(n,t){return id(t)?qa(t):Ms(n,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gr{constructor(){this._=void 0}}function xd(n,t,e){return n instanceof _r?function(s,o){const a={fields:{[ga]:{stringValue:pa},[ya]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return o&&bs(o)&&(o=sr(o)),o&&(a.fields[_a]=o),{mapValue:a}}(e,t):n instanceof vn?za(n,t):n instanceof In?Ga(n,t):function(s,o){const a=$a(s,o),h=Ha(a)+Ha(s.Ae);return Cs(a)&&Cs(s.Ae)?qa(h):Ms(s.serializer,h)}(n,t)}function Md(n,t,e){return n instanceof vn?za(n,t):n instanceof In?Ga(n,t):e}function $a(n,t){return n instanceof yr?function(r){return Cs(r)||function(o){return!!o&&"doubleValue"in o}(r)}(t)?t:{integerValue:0}:null}class _r extends gr{}class vn extends gr{constructor(t){super(),this.elements=t}}function za(n,t){const e=Ka(t);for(const r of n.elements)e.some(s=>kt(s,r))||e.push(r);return{arrayValue:{values:e}}}class In extends gr{constructor(t){super(),this.elements=t}}function Ga(n,t){let e=Ka(t);for(const r of n.elements)e=e.filter(s=>!kt(s,r));return{arrayValue:{values:e}}}class yr extends gr{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function Ha(n){return tt(n.integerValue||n.doubleValue)}function Ka(n){return Vs(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}function Ld(n,t){return n.field.isEqual(t.field)&&function(r,s){return r instanceof vn&&s instanceof vn||r instanceof In&&s instanceof In?De(r.elements,s.elements,kt):r instanceof yr&&s instanceof yr?kt(r.Ae,s.Ae):r instanceof _r&&s instanceof _r}(n.transform,t.transform)}class Fd{constructor(t,e){this.version=t,this.transformResults=e}}class Mt{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new Mt}static exists(t){return new Mt(void 0,t)}static updateTime(t){return new Mt(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Er(n,t){return n.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(n.updateTime):n.exists===void 0||n.exists===t.isFoundDocument()}class Tr{}function Wa(n,t){if(!n.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return n.isNoDocument()?new Ls(n.key,Mt.none()):new wn(n.key,n.data,Mt.none());{const e=n.data,r=Rt.empty();let s=new at(lt.comparator);for(let o of t.fields)if(!s.has(o)){let a=e.field(o);a===null&&o.length>1&&(o=o.popLast(),a=e.field(o)),a===null?r.delete(o):r.set(o,a),s=s.add(o)}return new ye(n.key,r,new Pt(s.toArray()),Mt.none())}}function Ud(n,t,e){n instanceof wn?function(s,o,a){const h=s.value.clone(),l=Xa(s.fieldTransforms,o,a.transformResults);h.setAll(l),o.convertToFoundDocument(a.version,h).setHasCommittedMutations()}(n,t,e):n instanceof ye?function(s,o,a){if(!Er(s.precondition,o))return void o.convertToUnknownDocument(a.version);const h=Xa(s.fieldTransforms,o,a.transformResults),l=o.data;l.setAll(Ya(s)),l.setAll(h),o.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,t,e):function(s,o,a){o.convertToNoDocument(a.version).setHasCommittedMutations()}(0,t,e)}function An(n,t,e,r){return n instanceof wn?function(o,a,h,l){if(!Er(o.precondition,a))return h;const f=o.value.clone(),g=Ja(o.fieldTransforms,l,a);return f.setAll(g),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),null}(n,t,e,r):n instanceof ye?function(o,a,h,l){if(!Er(o.precondition,a))return h;const f=Ja(o.fieldTransforms,l,a),g=a.data;return g.setAll(Ya(o)),g.setAll(f),a.convertToFoundDocument(a.version,g).setHasLocalMutations(),h===null?null:h.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map(v=>v.field))}(n,t,e,r):function(o,a,h){return Er(o.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):h}(n,t,e)}function Bd(n,t){let e=null;for(const r of n.fieldTransforms){const s=t.data.field(r.field),o=$a(r.transform,s||null);o!=null&&(e===null&&(e=Rt.empty()),e.set(r.field,o))}return e||null}function Qa(n,t){return n.type===t.type&&!!n.key.isEqual(t.key)&&!!n.precondition.isEqual(t.precondition)&&!!function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&De(r,s,(o,a)=>Ld(o,a))}(n.fieldTransforms,t.fieldTransforms)&&(n.type===0?n.value.isEqual(t.value):n.type!==1||n.data.isEqual(t.data)&&n.fieldMask.isEqual(t.fieldMask))}class wn extends Tr{constructor(t,e,r,s=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class ye extends Tr{constructor(t,e,r,s,o=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=s,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function Ya(n){const t=new Map;return n.fieldMask.fields.forEach(e=>{if(!e.isEmpty()){const r=n.data.field(e);t.set(e,r)}}),t}function Xa(n,t,e){const r=new Map;G(n.length===e.length,32656,{Ve:e.length,de:n.length});for(let s=0;s<e.length;s++){const o=n[s],a=o.transform,h=t.data.field(o.field);r.set(o.field,Md(a,h,e[s]))}return r}function Ja(n,t,e){const r=new Map;for(const s of n){const o=s.transform,a=e.data.field(s.field);r.set(s.field,xd(o,a,t))}return r}class Ls extends Tr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class jd extends Tr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qd{constructor(t,e,r,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(t,e){const r=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const o=this.mutations[s];o.key.isEqual(t.key)&&Ud(o,t,r[s])}}applyToLocalView(t,e){for(const r of this.baseMutations)r.key.isEqual(t.key)&&(e=An(r,t,e,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(t.key)&&(e=An(r,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const r=ja();return this.mutations.forEach(s=>{const o=t.get(s.key),a=o.overlayedDocument;let h=this.applyToLocalView(a,o.mutatedFields);h=e.has(s.key)?null:h;const l=Wa(a,h);l!==null&&r.set(s.key,l),a.isValidDocument()||a.convertToNoDocument(L.min())}),r}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),j())}isEqual(t){return this.batchId===t.batchId&&De(this.mutations,t.mutations,(e,r)=>Qa(e,r))&&De(this.baseMutations,t.baseMutations,(e,r)=>Qa(e,r))}}class Fs{constructor(t,e,r,s){this.batch=t,this.commitVersion=e,this.mutationResults=r,this.docVersions=s}static from(t,e,r){G(t.mutations.length===r.length,58842,{me:t.mutations.length,fe:r.length});let s=function(){return Vd}();const o=t.mutations;for(let a=0;a<o.length;a++)s=s.insert(o[a].key,r[a].version);return new Fs(t,e,r,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $d{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zd{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var nt,$;function Gd(n){switch(n){case b.OK:return M(64938);case b.CANCELLED:case b.UNKNOWN:case b.DEADLINE_EXCEEDED:case b.RESOURCE_EXHAUSTED:case b.INTERNAL:case b.UNAVAILABLE:case b.UNAUTHENTICATED:return!1;case b.INVALID_ARGUMENT:case b.NOT_FOUND:case b.ALREADY_EXISTS:case b.PERMISSION_DENIED:case b.FAILED_PRECONDITION:case b.ABORTED:case b.OUT_OF_RANGE:case b.UNIMPLEMENTED:case b.DATA_LOSS:return!0;default:return M(15467,{code:n})}}function Za(n){if(n===void 0)return Bt("GRPC error has no .code"),b.UNKNOWN;switch(n){case nt.OK:return b.OK;case nt.CANCELLED:return b.CANCELLED;case nt.UNKNOWN:return b.UNKNOWN;case nt.DEADLINE_EXCEEDED:return b.DEADLINE_EXCEEDED;case nt.RESOURCE_EXHAUSTED:return b.RESOURCE_EXHAUSTED;case nt.INTERNAL:return b.INTERNAL;case nt.UNAVAILABLE:return b.UNAVAILABLE;case nt.UNAUTHENTICATED:return b.UNAUTHENTICATED;case nt.INVALID_ARGUMENT:return b.INVALID_ARGUMENT;case nt.NOT_FOUND:return b.NOT_FOUND;case nt.ALREADY_EXISTS:return b.ALREADY_EXISTS;case nt.PERMISSION_DENIED:return b.PERMISSION_DENIED;case nt.FAILED_PRECONDITION:return b.FAILED_PRECONDITION;case nt.ABORTED:return b.ABORTED;case nt.OUT_OF_RANGE:return b.OUT_OF_RANGE;case nt.UNIMPLEMENTED:return b.UNIMPLEMENTED;case nt.DATA_LOSS:return b.DATA_LOSS;default:return M(39323,{code:n})}}($=nt||(nt={}))[$.OK=0]="OK",$[$.CANCELLED=1]="CANCELLED",$[$.UNKNOWN=2]="UNKNOWN",$[$.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",$[$.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",$[$.NOT_FOUND=5]="NOT_FOUND",$[$.ALREADY_EXISTS=6]="ALREADY_EXISTS",$[$.PERMISSION_DENIED=7]="PERMISSION_DENIED",$[$.UNAUTHENTICATED=16]="UNAUTHENTICATED",$[$.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",$[$.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",$[$.ABORTED=10]="ABORTED",$[$.OUT_OF_RANGE=11]="OUT_OF_RANGE",$[$.UNIMPLEMENTED=12]="UNIMPLEMENTED",$[$.INTERNAL=13]="INTERNAL",$[$.UNAVAILABLE=14]="UNAVAILABLE",$[$.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Us=null;/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hd(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kd=new Jt([4294967295,4294967295],0);function tc(n){const t=Hd().encode(n),e=new Ko;return e.update(t),new Uint8Array(e.digest())}function ec(n){const t=new DataView(n.buffer),e=t.getUint32(0,!0),r=t.getUint32(4,!0),s=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new Jt([e,r],0),new Jt([s,o],0)]}class Bs{constructor(t,e,r){if(this.bitmap=t,this.padding=e,this.hashCount=r,e<0||e>=8)throw new Rn(`Invalid padding: ${e}`);if(r<0)throw new Rn(`Invalid hash count: ${r}`);if(t.length>0&&this.hashCount===0)throw new Rn(`Invalid hash count: ${r}`);if(t.length===0&&e!==0)throw new Rn(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=Jt.fromNumber(this.ge)}ye(t,e,r){let s=t.add(e.multiply(Jt.fromNumber(r)));return s.compare(Kd)===1&&(s=new Jt([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=tc(t),[r,s]=ec(e);for(let o=0;o<this.hashCount;o++){const a=this.ye(r,s,o);if(!this.we(a))return!1}return!0}static create(t,e,r){const s=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),a=new Bs(o,s,e);return r.forEach(h=>a.insert(h)),a}insert(t){if(this.ge===0)return;const e=tc(t),[r,s]=ec(e);for(let o=0;o<this.hashCount;o++){const a=this.ye(r,s,o);this.Se(a)}}Se(t){const e=Math.floor(t/8),r=t%8;this.bitmap[e]|=1<<r}}class Rn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vr{constructor(t,e,r,s,o){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(t,e,r){const s=new Map;return s.set(t,Sn.createSynthesizedTargetChangeForCurrentChange(t,e,r)),new vr(L.min(),s,new J(B),qt(),j())}}class Sn{constructor(t,e,r,s,o){this.resumeToken=t,this.current=e,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,r){return new Sn(r,e,j(),j(),j())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ir{constructor(t,e,r,s){this.be=t,this.removedTargetIds=e,this.key=r,this.De=s}}class nc{constructor(t,e){this.targetId=t,this.Ce=e}}class rc{constructor(t,e,r=ft.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=r,this.cause=s}}class sc{constructor(){this.ve=0,this.Fe=ic(),this.Me=ft.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=j(),e=j(),r=j();return this.Fe.forEach((s,o)=>{switch(o){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:r=r.add(s);break;default:M(38017,{changeType:o})}}),new Sn(this.Me,this.xe,t,e,r)}qe(){this.Oe=!1,this.Fe=ic()}Ke(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}Ue(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}$e(){this.ve+=1}We(){this.ve-=1,G(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class Wd{constructor(t){this.Ge=t,this.ze=new Map,this.je=qt(),this.Je=Ar(),this.He=Ar(),this.Ze=new J(B)}Xe(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Ye(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,e=>{const r=this.nt(e);switch(t.state){case 0:this.rt(e)&&r.Le(t.resumeToken);break;case 1:r.We(),r.Ne||r.qe(),r.Le(t.resumeToken);break;case 2:r.We(),r.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(r.Qe(),r.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),r.Le(t.resumeToken));break;default:M(56790,{state:t.state})}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach((r,s)=>{this.rt(s)&&e(s)})}st(t){const e=t.targetId,r=t.Ce.count,s=this.ot(e);if(s){const o=s.target;if(Os(o))if(r===0){const a=new O(o.path);this.et(e,a,gt.newNoDocument(a,L.min()))}else G(r===1,20013,{expectedCount:r});else{const a=this._t(e);if(a!==r){const h=this.ut(t),l=h?this.ct(h,t,a):1;if(l!==0){this.it(e);const f=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(e,f)}Us==null||Us.o(function(g,v,R,P,k){var H,z,W,yt,st,it;const x={localCacheCount:g,existenceFilterCount:v.count,databaseId:R.database,projectId:R.projectId},V=v.unchangedNames;return V&&(x.bloomFilter={applied:k===0,hashCount:(H=V==null?void 0:V.hashCount)!=null?H:0,bitmapLength:(yt=(W=(z=V==null?void 0:V.bits)==null?void 0:z.bitmap)==null?void 0:W.length)!=null?yt:0,padding:(it=(st=V==null?void 0:V.bits)==null?void 0:st.padding)!=null?it:0,mightContain:E=>{var m;return(m=P==null?void 0:P.mightContain(E))!=null?m:!1}}),x}(a,t.Ce,this.Ge.ht(),h,l))}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:o=0}=e;let a,h;try{a=ee(r).toUint8Array()}catch(l){if(l instanceof ma)return me("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{h=new Bs(a,s,o)}catch(l){return me(l instanceof Rn?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return h.ge===0?null:h}ct(t,e,r){return e.Ce.count===r-this.Pt(t,e.targetId)?0:2}Pt(t,e){const r=this.Ge.getRemoteKeysForTarget(e);let s=0;return r.forEach(o=>{const a=this.Ge.ht(),h=`projects/${a.projectId}/databases/${a.database}/documents/${o.path.canonicalString()}`;t.mightContain(h)||(this.et(e,o,null),s++)}),s}Tt(t){const e=new Map;this.ze.forEach((o,a)=>{const h=this.ot(a);if(h){if(o.current&&Os(h.target)){const l=new O(h.target.path);this.Et(l).has(a)||this.It(a,l)||this.et(a,l,gt.newNoDocument(l,t))}o.Be&&(e.set(a,o.ke()),o.qe())}});let r=j();this.He.forEach((o,a)=>{let h=!0;a.forEachWhile(l=>{const f=this.ot(l);return!f||f.purpose==="TargetPurposeLimboResolution"||(h=!1,!1)}),h&&(r=r.add(o))}),this.je.forEach((o,a)=>a.setReadTime(t));const s=new vr(t,e,this.Ze,this.je,r);return this.je=qt(),this.Je=Ar(),this.He=Ar(),this.Ze=new J(B),s}Ye(t,e){if(!this.rt(t))return;const r=this.It(t,e.key)?2:0;this.nt(t).Ke(e.key,r),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.Et(e.key).add(t)),this.He=this.He.insert(e.key,this.Rt(e.key).add(t))}et(t,e,r){if(!this.rt(t))return;const s=this.nt(t);this.It(t,e)?s.Ke(e,1):s.Ue(e),this.He=this.He.insert(e,this.Rt(e).delete(t)),this.He=this.He.insert(e,this.Rt(e).add(t)),r&&(this.je=this.je.insert(e,r))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}$e(t){this.nt(t).$e()}nt(t){let e=this.ze.get(t);return e||(e=new sc,this.ze.set(t,e)),e}Rt(t){let e=this.He.get(t);return e||(e=new at(B),this.He=this.He.insert(t,e)),e}Et(t){let e=this.Je.get(t);return e||(e=new at(B),this.Je=this.Je.insert(t,e)),e}rt(t){const e=this.ot(t)!==null;return e||D("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new sc),this.Ge.getRemoteKeysForTarget(t).forEach(e=>{this.et(t,e,null)})}It(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function Ar(){return new J(O.comparator)}function ic(){return new J(O.comparator)}const Qd=(()=>({asc:"ASCENDING",desc:"DESCENDING"}))(),Yd=(()=>({"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"}))(),Xd=(()=>({and:"AND",or:"OR"}))();class Jd{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function js(n,t){return n.useProto3Json||er(t)?t:{value:t}}function wr(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function oc(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function Zd(n,t){return wr(n,t.toTimestamp())}function Lt(n){return G(!!n,49232),L.fromTimestamp(function(e){const r=te(e);return new X(r.seconds,r.nanos)}(n))}function qs(n,t){return $s(n,t).canonicalString()}function $s(n,t){const e=function(s){return new Y(["projects",s.projectId,"databases",s.database])}(n).child("documents");return t===void 0?e:e.child(t)}function ac(n){const t=Y.fromString(n);return G(fc(t),10190,{key:t.toString()}),t}function zs(n,t){return qs(n.databaseId,t.path)}function Gs(n,t){const e=ac(t);if(e.get(1)!==n.databaseId.projectId)throw new N(b.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new N(b.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new O(uc(e))}function cc(n,t){return qs(n.databaseId,t)}function tf(n){const t=ac(n);return t.length===4?Y.emptyPath():uc(t)}function Hs(n){return new Y(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function uc(n){return G(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function hc(n,t,e){return{name:zs(n,t),fields:e.value.mapValue.fields}}function ef(n,t){let e;if("targetChange"in t){t.targetChange;const r=function(f){return f==="NO_CHANGE"?0:f==="ADD"?1:f==="REMOVE"?2:f==="CURRENT"?3:f==="RESET"?4:M(39313,{state:f})}(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],o=function(f,g){return f.useProto3Json?(G(g===void 0||typeof g=="string",58123),ft.fromBase64String(g||"")):(G(g===void 0||g instanceof Buffer||g instanceof Uint8Array,16193),ft.fromUint8Array(g||new Uint8Array))}(n,t.targetChange.resumeToken),a=t.targetChange.cause,h=a&&function(f){const g=f.code===void 0?b.UNKNOWN:Za(f.code);return new N(g,f.message||"")}(a);e=new rc(r,s,o,h||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const s=Gs(n,r.document.name),o=Lt(r.document.updateTime),a=r.document.createTime?Lt(r.document.createTime):L.min(),h=new Rt({mapValue:{fields:r.document.fields}}),l=gt.newFoundDocument(s,o,a,h),f=r.targetIds||[],g=r.removedTargetIds||[];e=new Ir(f,g,l.key,l)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const s=Gs(n,r.document),o=r.readTime?Lt(r.readTime):L.min(),a=gt.newNoDocument(s,o),h=r.removedTargetIds||[];e=new Ir([],h,a.key,a)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const s=Gs(n,r.document),o=r.removedTargetIds||[];e=new Ir([],o,s,null)}else{if(!("filter"in t))return M(11601,{Vt:t});{t.filter;const r=t.filter;r.targetId;const{count:s=0,unchangedNames:o}=r,a=new zd(s,o),h=r.targetId;e=new nc(h,a)}}return e}function nf(n,t){let e;if(t instanceof wn)e={update:hc(n,t.key,t.value)};else if(t instanceof Ls)e={delete:zs(n,t.key)};else if(t instanceof ye)e={update:hc(n,t.key,t.data),updateMask:df(t.fieldMask)};else{if(!(t instanceof jd))return M(16599,{dt:t.type});e={verify:zs(n,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map(r=>function(o,a){const h=a.transform;if(h instanceof _r)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(h instanceof vn)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:h.elements}};if(h instanceof In)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:h.elements}};if(h instanceof yr)return{fieldPath:a.field.canonicalString(),increment:h.Ae};throw M(20930,{transform:a.transform})}(0,r))),t.precondition.isNone||(e.currentDocument=function(s,o){return o.updateTime!==void 0?{updateTime:Zd(s,o.updateTime)}:o.exists!==void 0?{exists:o.exists}:M(27497)}(n,t.precondition)),e}function rf(n,t){return n&&n.length>0?(G(t!==void 0,14353),n.map(e=>function(s,o){let a=s.updateTime?Lt(s.updateTime):Lt(o);return a.isEqual(L.min())&&(a=Lt(o)),new Fd(a,s.transformResults||[])}(e,t))):[]}function sf(n,t){return{documents:[cc(n,t.path)]}}function of(n,t){const e={structuredQuery:{}},r=t.path;let s;t.collectionGroup!==null?(s=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=cc(n,s);const o=function(f){if(f.length!==0)return dc(Ot.create(f,"and"))}(t.filters);o&&(e.structuredQuery.where=o);const a=function(f){if(f.length!==0)return f.map(g=>function(R){return{field:Le(R.field),direction:uf(R.dir)}}(g))}(t.orderBy);a&&(e.structuredQuery.orderBy=a);const h=js(n,t.limit);return h!==null&&(e.structuredQuery.limit=h),t.startAt&&(e.structuredQuery.startAt=function(f){return{before:f.inclusive,values:f.position}}(t.startAt)),t.endAt&&(e.structuredQuery.endAt=function(f){return{before:!f.inclusive,values:f.position}}(t.endAt)),{ft:e,parent:s}}function af(n){let t=tf(n.parent);const e=n.structuredQuery,r=e.from?e.from.length:0;let s=null;if(r>0){G(r===1,65062);const g=e.from[0];g.allDescendants?s=g.collectionId:t=t.child(g.collectionId)}let o=[];e.where&&(o=function(v){const R=lc(v);return R instanceof Ot&&Da(R)?R.getFilters():[R]}(e.where));let a=[];e.orderBy&&(a=function(v){return v.map(R=>function(k){return new lr(Fe(k.field),function(V){switch(V){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(k.direction))}(R))}(e.orderBy));let h=null;e.limit&&(h=function(v){let R;return R=typeof v=="object"?v.value:v,er(R)?null:R}(e.limit));let l=null;e.startAt&&(l=function(v){const R=!!v.before,P=v.values||[];return new hr(P,R)}(e.startAt));let f=null;return e.endAt&&(f=function(v){const R=!v.before,P=v.values||[];return new hr(P,R)}(e.endAt)),Ad(t,s,a,o,h,"F",l,f)}function cf(n,t){const e=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return M(28987,{purpose:s})}}(t.purpose);return e==null?null:{"goog-listen-tags":e}}function lc(n){return n.unaryFilter!==void 0?function(e){switch(e.unaryFilter.op){case"IS_NAN":const r=Fe(e.unaryFilter.field);return ct.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=Fe(e.unaryFilter.field);return ct.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=Fe(e.unaryFilter.field);return ct.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=Fe(e.unaryFilter.field);return ct.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return M(61313);default:return M(60726)}}(n):n.fieldFilter!==void 0?function(e){return ct.create(Fe(e.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return M(58110);default:return M(50506)}}(e.fieldFilter.op),e.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(e){return Ot.create(e.compositeFilter.filters.map(r=>lc(r)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return M(1026)}}(e.compositeFilter.op))}(n):M(30097,{filter:n})}function uf(n){return Qd[n]}function hf(n){return Yd[n]}function lf(n){return Xd[n]}function Le(n){return{fieldPath:n.canonicalString()}}function Fe(n){return lt.fromServerFormat(n.fieldPath)}function dc(n){return n instanceof ct?function(e){if(e.op==="=="){if(Ra(e.value))return{unaryFilter:{field:Le(e.field),op:"IS_NAN"}};if(wa(e.value))return{unaryFilter:{field:Le(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Ra(e.value))return{unaryFilter:{field:Le(e.field),op:"IS_NOT_NAN"}};if(wa(e.value))return{unaryFilter:{field:Le(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Le(e.field),op:hf(e.op),value:e.value}}}(n):n instanceof Ot?function(e){const r=e.getFilters().map(s=>dc(s));return r.length===1?r[0]:{compositeFilter:{op:lf(e.op),filters:r}}}(n):M(54877,{filter:n})}function df(n){const t=[];return n.fields.forEach(e=>t.push(e.canonicalString())),{fieldPaths:t}}function fc(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}function mc(n){return!!n&&typeof n._toProto=="function"&&n._protoValueType==="ProtoValue"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class re{constructor(t,e,r,s,o=L.min(),a=L.min(),h=ft.EMPTY_BYTE_STRING,l=null){this.target=t,this.targetId=e,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=h,this.expectedCount=l}withSequenceNumber(t){return new re(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new re(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new re(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new re(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ff{constructor(t){this.yt=t}}function mf(n){const t=af({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?xs(t,t.limit,"L"):t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pf{constructor(){this.bn=new gf}addToCollectionParentIndex(t,e){return this.bn.add(e),S.resolve()}getCollectionParents(t,e){return S.resolve(this.bn.getEntries(e))}addFieldIndex(t,e){return S.resolve()}deleteFieldIndex(t,e){return S.resolve()}deleteAllFieldIndexes(t){return S.resolve()}createTargetIndexes(t,e){return S.resolve()}getDocumentsMatchingTarget(t,e){return S.resolve(null)}getIndexType(t,e){return S.resolve(0)}getFieldIndexes(t,e){return S.resolve([])}getNextCollectionGroupToUpdate(t){return S.resolve(null)}getMinOffset(t,e){return S.resolve(Zt.min())}getMinOffsetFromCollectionGroup(t,e){return S.resolve(Zt.min())}updateCollectionGroup(t,e,r){return S.resolve()}updateIndexEntries(t,e){return S.resolve()}}class gf{constructor(){this.index={}}add(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e]||new at(Y.comparator),o=!s.has(r);return this.index[e]=s.add(r),o}has(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e];return s&&s.has(r)}getEntries(t){return(this.index[t]||new at(Y.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pc={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},gc=41943040;class At{static withCacheSize(t){return new At(t,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,r){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */At.DEFAULT_COLLECTION_PERCENTILE=10,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,At.DEFAULT=new At(gc,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),At.DISABLED=new At(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ue{constructor(t){this.sr=t}next(){return this.sr+=2,this.sr}static _r(){return new Ue(0)}static ar(){return new Ue(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _c="LruGarbageCollector",_f=1048576;function yc([n,t],[e,r]){const s=B(n,e);return s===0?B(t,r):s}class yf{constructor(t){this.Pr=t,this.buffer=new at(yc),this.Tr=0}Er(){return++this.Tr}Ir(t){const e=[t,this.Er()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(e);else{const r=this.buffer.last();yc(e,r)<0&&(this.buffer=this.buffer.delete(r).add(e))}}get maxValue(){return this.buffer.last()[0]}}class Ef{constructor(t,e,r){this.garbageCollector=t,this.asyncQueue=e,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Ar(t){D(_c,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){ke(e)?D(_c,"Ignoring IndexedDB error during garbage collection: ",e):await Ne(e)}await this.Ar(3e5)})}}class Tf{constructor(t,e){this.Vr=t,this.params=e}calculateTargetCount(t,e){return this.Vr.dr(t).next(r=>Math.floor(e/100*r))}nthSequenceNumber(t,e){if(e===0)return S.resolve(tr.ce);const r=new yf(e);return this.Vr.forEachTarget(t,s=>r.Ir(s.sequenceNumber)).next(()=>this.Vr.mr(t,s=>r.Ir(s))).next(()=>r.maxValue)}removeTargets(t,e,r){return this.Vr.removeTargets(t,e,r)}removeOrphanedDocuments(t,e){return this.Vr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(D("LruGarbageCollector","Garbage collection skipped; disabled"),S.resolve(pc)):this.getCacheSize(t).next(r=>r<this.params.cacheSizeCollectionThreshold?(D("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),pc):this.gr(t,e))}getCacheSize(t){return this.Vr.getCacheSize(t)}gr(t,e){let r,s,o,a,h,l,f;const g=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next(v=>(v>this.params.maximumSequenceNumbersToCollect?(D("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${v}`),s=this.params.maximumSequenceNumbersToCollect):s=v,a=Date.now(),this.nthSequenceNumber(t,s))).next(v=>(r=v,h=Date.now(),this.removeTargets(t,r,e))).next(v=>(o=v,l=Date.now(),this.removeOrphanedDocuments(t,r))).next(v=>(f=Date.now(),Ve()<=q.DEBUG&&D("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-g}ms
	Determined least recently used ${s} in `+(h-a)+`ms
	Removed ${o} targets in `+(l-h)+`ms
	Removed ${v} documents in `+(f-l)+`ms
Total Duration: ${f-g}ms`),S.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:o,documentsRemoved:v})))}}function vf(n,t){return new Tf(n,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class If{constructor(){this.changes=new ge(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,gt.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const r=this.changes.get(e);return r!==void 0?S.resolve(r):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Af{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wf{constructor(t,e,r,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=r,this.indexManager=s}getDocument(t,e){let r=null;return this.documentOverlayCache.getOverlay(t,e).next(s=>(r=s,this.remoteDocumentCache.getEntry(t,e))).next(s=>(r!==null&&An(r.mutation,s,Pt.empty(),X.now()),s))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.getLocalViewOfDocuments(t,r,j()).next(()=>r))}getLocalViewOfDocuments(t,e,r=j()){const s=_e();return this.populateOverlays(t,s,e).next(()=>this.computeViews(t,e,s,r).next(o=>{let a=En();return o.forEach((h,l)=>{a=a.insert(h,l.overlayedDocument)}),a}))}getOverlayedDocuments(t,e){const r=_e();return this.populateOverlays(t,r,e).next(()=>this.computeViews(t,e,r,j()))}populateOverlays(t,e,r){const s=[];return r.forEach(o=>{e.has(o)||s.push(o)}),this.documentOverlayCache.getOverlays(t,s).next(o=>{o.forEach((a,h)=>{e.set(a,h)})})}computeViews(t,e,r,s){let o=qt();const a=Tn(),h=function(){return Tn()}();return e.forEach((l,f)=>{const g=r.get(f.key);s.has(f.key)&&(g===void 0||g.mutation instanceof ye)?o=o.insert(f.key,f):g!==void 0?(a.set(f.key,g.mutation.getFieldMask()),An(g.mutation,f,g.mutation.getFieldMask(),X.now())):a.set(f.key,Pt.empty())}),this.recalculateAndSaveOverlays(t,o).next(l=>(l.forEach((f,g)=>a.set(f,g)),e.forEach((f,g)=>{var v;return h.set(f,new Af(g,(v=a.get(f))!=null?v:null))}),h))}recalculateAndSaveOverlays(t,e){const r=Tn();let s=new J((a,h)=>a-h),o=j();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(a=>{for(const h of a)h.keys().forEach(l=>{const f=e.get(l);if(f===null)return;let g=r.get(l)||Pt.empty();g=h.applyToLocalView(f,g),r.set(l,g);const v=(s.get(h.batchId)||j()).add(l);s=s.insert(h.batchId,v)})}).next(()=>{const a=[],h=s.getReverseIterator();for(;h.hasNext();){const l=h.getNext(),f=l.key,g=l.value,v=ja();g.forEach(R=>{if(!o.has(R)){const P=Wa(e.get(R),r.get(R));P!==null&&v.set(R,P),o=o.add(R)}}),a.push(this.documentOverlayCache.saveOverlays(t,f,v))}return S.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.recalculateAndSaveOverlays(t,r))}getDocumentsMatchingQuery(t,e,r,s){return wd(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):Rd(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,r,s):this.getDocumentsMatchingCollectionQuery(t,e,r,s)}getNextDocuments(t,e,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,r,s).next(o=>{const a=s-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,r.largestBatchId,s-o.size):S.resolve(_e());let h=fn,l=o;return a.next(f=>S.forEach(f,(g,v)=>(h<v.largestBatchId&&(h=v.largestBatchId),o.get(g)?S.resolve():this.remoteDocumentCache.getEntry(t,g).next(R=>{l=l.insert(g,R)}))).next(()=>this.populateOverlays(t,f,o)).next(()=>this.computeViews(t,l,f,j())).next(g=>({batchId:h,changes:Ba(g)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new O(e)).next(r=>{let s=En();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s})}getDocumentsMatchingCollectionGroupQuery(t,e,r,s){const o=e.collectionGroup;let a=En();return this.indexManager.getCollectionParents(t,o).next(h=>S.forEach(h,l=>{const f=function(v,R){return new dr(R,null,v.explicitOrderBy.slice(),v.filters.slice(),v.limit,v.limitType,v.startAt,v.endAt)}(e,l.child(o));return this.getDocumentsMatchingCollectionQuery(t,f,r,s).next(g=>{g.forEach((v,R)=>{a=a.insert(v,R)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(t,e,r,s){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,r.largestBatchId).next(a=>(o=a,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,s))).next(a=>{o.forEach((l,f)=>{const g=f.getKey();a.get(g)===null&&(a=a.insert(g,gt.newInvalidDocument(g)))});let h=En();return a.forEach((l,f)=>{const g=o.get(l);g!==void 0&&An(g.mutation,f,Pt.empty(),X.now()),pr(e,f)&&(h=h.insert(l,f))}),h})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rf{constructor(t){this.serializer=t,this.Nr=new Map,this.Br=new Map}getBundleMetadata(t,e){return S.resolve(this.Nr.get(e))}saveBundleMetadata(t,e){return this.Nr.set(e.id,function(s){return{id:s.id,version:s.version,createTime:Lt(s.createTime)}}(e)),S.resolve()}getNamedQuery(t,e){return S.resolve(this.Br.get(e))}saveNamedQuery(t,e){return this.Br.set(e.name,function(s){return{name:s.name,query:mf(s.bundledQuery),readTime:Lt(s.readTime)}}(e)),S.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sf{constructor(){this.overlays=new J(O.comparator),this.Lr=new Map}getOverlay(t,e){return S.resolve(this.overlays.get(e))}getOverlays(t,e){const r=_e();return S.forEach(e,s=>this.getOverlay(t,s).next(o=>{o!==null&&r.set(s,o)})).next(()=>r)}saveOverlays(t,e,r){return r.forEach((s,o)=>{this.St(t,e,o)}),S.resolve()}removeOverlaysForBatchId(t,e,r){const s=this.Lr.get(r);return s!==void 0&&(s.forEach(o=>this.overlays=this.overlays.remove(o)),this.Lr.delete(r)),S.resolve()}getOverlaysForCollection(t,e,r){const s=_e(),o=e.length+1,a=new O(e.child("")),h=this.overlays.getIteratorFrom(a);for(;h.hasNext();){const l=h.getNext().value,f=l.getKey();if(!e.isPrefixOf(f.path))break;f.path.length===o&&l.largestBatchId>r&&s.set(l.getKey(),l)}return S.resolve(s)}getOverlaysForCollectionGroup(t,e,r,s){let o=new J((f,g)=>f-g);const a=this.overlays.getIterator();for(;a.hasNext();){const f=a.getNext().value;if(f.getKey().getCollectionGroup()===e&&f.largestBatchId>r){let g=o.get(f.largestBatchId);g===null&&(g=_e(),o=o.insert(f.largestBatchId,g)),g.set(f.getKey(),f)}}const h=_e(),l=o.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach((f,g)=>h.set(f,g)),!(h.size()>=s)););return S.resolve(h)}St(t,e,r){const s=this.overlays.get(r.key);if(s!==null){const a=this.Lr.get(s.largestBatchId).delete(r.key);this.Lr.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new $d(e,r));let o=this.Lr.get(e);o===void 0&&(o=j(),this.Lr.set(e,o)),this.Lr.set(e,o.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bf{constructor(){this.sessionToken=ft.EMPTY_BYTE_STRING}getSessionToken(t){return S.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,S.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ks{constructor(){this.kr=new at(ht.qr),this.Kr=new at(ht.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(t,e){const r=new ht(t,e);this.kr=this.kr.add(r),this.Kr=this.Kr.add(r)}$r(t,e){t.forEach(r=>this.addReference(r,e))}removeReference(t,e){this.Wr(new ht(t,e))}Qr(t,e){t.forEach(r=>this.removeReference(r,e))}Gr(t){const e=new O(new Y([])),r=new ht(e,t),s=new ht(e,t+1),o=[];return this.Kr.forEachInRange([r,s],a=>{this.Wr(a),o.push(a.key)}),o}zr(){this.kr.forEach(t=>this.Wr(t))}Wr(t){this.kr=this.kr.delete(t),this.Kr=this.Kr.delete(t)}jr(t){const e=new O(new Y([])),r=new ht(e,t),s=new ht(e,t+1);let o=j();return this.Kr.forEachInRange([r,s],a=>{o=o.add(a.key)}),o}containsKey(t){const e=new ht(t,0),r=this.kr.firstAfterOrEqual(e);return r!==null&&t.isEqual(r.key)}}class ht{constructor(t,e){this.key=t,this.Jr=e}static qr(t,e){return O.comparator(t.key,e.key)||B(t.Jr,e.Jr)}static Ur(t,e){return B(t.Jr,e.Jr)||O.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pf{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.Yn=1,this.Hr=new at(ht.qr)}checkEmpty(t){return S.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,r,s){const o=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new qd(o,e,r,s);this.mutationQueue.push(a);for(const h of s)this.Hr=this.Hr.add(new ht(h.key,o)),this.indexManager.addToCollectionParentIndex(t,h.key.path.popLast());return S.resolve(a)}lookupMutationBatch(t,e){return S.resolve(this.Zr(e))}getNextMutationBatchAfterBatchId(t,e){const r=e+1,s=this.Xr(r),o=s<0?0:s;return S.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return S.resolve(this.mutationQueue.length===0?Ss:this.Yn-1)}getAllMutationBatches(t){return S.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const r=new ht(e,0),s=new ht(e,Number.POSITIVE_INFINITY),o=[];return this.Hr.forEachInRange([r,s],a=>{const h=this.Zr(a.Jr);o.push(h)}),S.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let r=new at(B);return e.forEach(s=>{const o=new ht(s,0),a=new ht(s,Number.POSITIVE_INFINITY);this.Hr.forEachInRange([o,a],h=>{r=r.add(h.Jr)})}),S.resolve(this.Yr(r))}getAllMutationBatchesAffectingQuery(t,e){const r=e.path,s=r.length+1;let o=r;O.isDocumentKey(o)||(o=o.child(""));const a=new ht(new O(o),0);let h=new at(B);return this.Hr.forEachWhile(l=>{const f=l.key.path;return!!r.isPrefixOf(f)&&(f.length===s&&(h=h.add(l.Jr)),!0)},a),S.resolve(this.Yr(h))}Yr(t){const e=[];return t.forEach(r=>{const s=this.Zr(r);s!==null&&e.push(s)}),e}removeMutationBatch(t,e){G(this.ei(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Hr;return S.forEach(e.mutations,s=>{const o=new ht(s.key,e.batchId);return r=r.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)}).next(()=>{this.Hr=r})}nr(t){}containsKey(t,e){const r=new ht(e,0),s=this.Hr.firstAfterOrEqual(r);return S.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,S.resolve()}ei(t,e){return this.Xr(t)}Xr(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Zr(t){const e=this.Xr(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cf{constructor(t){this.ti=t,this.docs=function(){return new J(O.comparator)}(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const r=e.key,s=this.docs.get(r),o=s?s.size:0,a=this.ti(e);return this.docs=this.docs.insert(r,{document:e.mutableCopy(),size:a}),this.size+=a-o,this.indexManager.addToCollectionParentIndex(t,r.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const r=this.docs.get(e);return S.resolve(r?r.document.mutableCopy():gt.newInvalidDocument(e))}getEntries(t,e){let r=qt();return e.forEach(s=>{const o=this.docs.get(s);r=r.insert(s,o?o.document.mutableCopy():gt.newInvalidDocument(s))}),S.resolve(r)}getDocumentsMatchingQuery(t,e,r,s){let o=qt();const a=e.path,h=new O(a.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(h);for(;l.hasNext();){const{key:f,value:{document:g}}=l.getNext();if(!a.isPrefixOf(f.path))break;f.path.length>a.length+1||ed(td(g),r)<=0||(s.has(g.key)||pr(e,g))&&(o=o.insert(g.key,g.mutableCopy()))}return S.resolve(o)}getAllFromCollectionGroup(t,e,r,s){M(9500)}ni(t,e){return S.forEach(this.docs,r=>e(r))}newChangeBuffer(t){return new Vf(this)}getSize(t){return S.resolve(this.size)}}class Vf extends If{constructor(t){super(),this.Mr=t}applyChanges(t){const e=[];return this.changes.forEach((r,s)=>{s.isValidDocument()?e.push(this.Mr.addEntry(t,s)):this.Mr.removeEntry(r)}),S.waitFor(e)}getFromCache(t,e){return this.Mr.getEntry(t,e)}getAllFromCache(t,e){return this.Mr.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Df{constructor(t){this.persistence=t,this.ri=new ge(e=>Ns(e),ks),this.lastRemoteSnapshotVersion=L.min(),this.highestTargetId=0,this.ii=0,this.si=new Ks,this.targetCount=0,this.oi=Ue._r()}forEachTarget(t,e){return this.ri.forEach((r,s)=>e(s)),S.resolve()}getLastRemoteSnapshotVersion(t){return S.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return S.resolve(this.ii)}allocateTargetId(t){return this.highestTargetId=this.oi.next(),S.resolve(this.highestTargetId)}setTargetsMetadata(t,e,r){return r&&(this.lastRemoteSnapshotVersion=r),e>this.ii&&(this.ii=e),S.resolve()}lr(t){this.ri.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.oi=new Ue(e),this.highestTargetId=e),t.sequenceNumber>this.ii&&(this.ii=t.sequenceNumber)}addTargetData(t,e){return this.lr(e),this.targetCount+=1,S.resolve()}updateTargetData(t,e){return this.lr(e),S.resolve()}removeTargetData(t,e){return this.ri.delete(e.target),this.si.Gr(e.targetId),this.targetCount-=1,S.resolve()}removeTargets(t,e,r){let s=0;const o=[];return this.ri.forEach((a,h)=>{h.sequenceNumber<=e&&r.get(h.targetId)===null&&(this.ri.delete(a),o.push(this.removeMatchingKeysForTargetId(t,h.targetId)),s++)}),S.waitFor(o).next(()=>s)}getTargetCount(t){return S.resolve(this.targetCount)}getTargetData(t,e){const r=this.ri.get(e)||null;return S.resolve(r)}addMatchingKeys(t,e,r){return this.si.$r(e,r),S.resolve()}removeMatchingKeys(t,e,r){this.si.Qr(e,r);const s=this.persistence.referenceDelegate,o=[];return s&&e.forEach(a=>{o.push(s.markPotentiallyOrphaned(t,a))}),S.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this.si.Gr(e),S.resolve()}getMatchingKeysForTargetId(t,e){const r=this.si.jr(e);return S.resolve(r)}containsKey(t,e){return S.resolve(this.si.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ec{constructor(t,e){this._i={},this.overlays={},this.ai=new tr(0),this.ui=!1,this.ui=!0,this.ci=new bf,this.referenceDelegate=t(this),this.li=new Df(this),this.indexManager=new pf,this.remoteDocumentCache=function(s){return new Cf(s)}(r=>this.referenceDelegate.hi(r)),this.serializer=new ff(e),this.Pi=new Rf(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Sf,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let r=this._i[t.toKey()];return r||(r=new Pf(e,this.referenceDelegate),this._i[t.toKey()]=r),r}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(t,e,r){D("MemoryPersistence","Starting transaction:",t);const s=new Nf(this.ai.next());return this.referenceDelegate.Ti(),r(s).next(o=>this.referenceDelegate.Ei(s).next(()=>o)).toPromise().then(o=>(s.raiseOnCommittedEvent(),o))}Ii(t,e){return S.or(Object.values(this._i).map(r=>()=>r.containsKey(t,e)))}}class Nf extends rd{constructor(t){super(),this.currentSequenceNumber=t}}class Ws{constructor(t){this.persistence=t,this.Ri=new Ks,this.Ai=null}static Vi(t){return new Ws(t)}get di(){if(this.Ai)return this.Ai;throw M(60996)}addReference(t,e,r){return this.Ri.addReference(r,e),this.di.delete(r.toString()),S.resolve()}removeReference(t,e,r){return this.Ri.removeReference(r,e),this.di.add(r.toString()),S.resolve()}markPotentiallyOrphaned(t,e){return this.di.add(e.toString()),S.resolve()}removeTarget(t,e){this.Ri.Gr(e.targetId).forEach(s=>this.di.add(s.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(t,e.targetId).next(s=>{s.forEach(o=>this.di.add(o.toString()))}).next(()=>r.removeTargetData(t,e))}Ti(){this.Ai=new Set}Ei(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return S.forEach(this.di,r=>{const s=O.fromPath(r);return this.mi(t,s).next(o=>{o||e.removeEntry(s,L.min())})}).next(()=>(this.Ai=null,e.apply(t)))}updateLimboDocument(t,e){return this.mi(t,e).next(r=>{r?this.di.delete(e.toString()):this.di.add(e.toString())})}hi(t){return 0}mi(t,e){return S.or([()=>S.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ii(t,e)])}}class Rr{constructor(t,e){this.persistence=t,this.fi=new ge(r=>od(r.path),(r,s)=>r.isEqual(s)),this.garbageCollector=vf(this,e)}static Vi(t,e){return new Rr(t,e)}Ti(){}Ei(t){return S.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}dr(t){const e=this.pr(t);return this.persistence.getTargetCache().getTargetCount(t).next(r=>e.next(s=>r+s))}pr(t){let e=0;return this.mr(t,r=>{e++}).next(()=>e)}mr(t,e){return S.forEach(this.fi,(r,s)=>this.wr(t,r,s).next(o=>o?S.resolve():e(s)))}removeTargets(t,e,r){return this.persistence.getTargetCache().removeTargets(t,e,r)}removeOrphanedDocuments(t,e){let r=0;const s=this.persistence.getRemoteDocumentCache(),o=s.newChangeBuffer();return s.ni(t,a=>this.wr(t,a,e).next(h=>{h||(r++,o.removeEntry(a,L.min()))})).next(()=>o.apply(t)).next(()=>r)}markPotentiallyOrphaned(t,e){return this.fi.set(e,t.currentSequenceNumber),S.resolve()}removeTarget(t,e){const r=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,r)}addReference(t,e,r){return this.fi.set(r,t.currentSequenceNumber),S.resolve()}removeReference(t,e,r){return this.fi.set(r,t.currentSequenceNumber),S.resolve()}updateLimboDocument(t,e){return this.fi.set(e,t.currentSequenceNumber),S.resolve()}hi(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=cr(t.data.value)),e}wr(t,e,r){return S.or([()=>this.persistence.Ii(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const s=this.fi.get(e);return S.resolve(s!==void 0&&s>r)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qs{constructor(t,e,r,s){this.targetId=t,this.fromCache=e,this.Ts=r,this.Es=s}static Is(t,e){let r=j(),s=j();for(const o of e.docChanges)switch(o.type){case 0:r=r.add(o.doc.key);break;case 1:s=s.add(o.doc.key)}return new Qs(t,e.fromCache,r,s)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kf{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Of{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=function(){return Eh()?8:sd(cs())>0?6:4}()}initialize(t,e){this.fs=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,r,s){const o={result:null};return this.gs(t,e).next(a=>{o.result=a}).next(()=>{if(!o.result)return this.ps(t,e,s,r).next(a=>{o.result=a})}).next(()=>{if(o.result)return;const a=new kf;return this.ys(t,e,a).next(h=>{if(o.result=h,this.As)return this.ws(t,e,a,h.size)})}).next(()=>o.result)}ws(t,e,r,s){return r.documentReadCount<this.Vs?(Ve()<=q.DEBUG&&D("QueryEngine","SDK will not create cache indexes for query:",Me(e),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),S.resolve()):(Ve()<=q.DEBUG&&D("QueryEngine","Query:",Me(e),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.ds*s?(Ve()<=q.DEBUG&&D("QueryEngine","The SDK decides to create cache indexes for query:",Me(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,xt(e))):S.resolve())}gs(t,e){if(Ma(e))return S.resolve(null);let r=xt(e);return this.indexManager.getIndexType(t,r).next(s=>s===0?null:(e.limit!==null&&s===1&&(e=xs(e,null,"F"),r=xt(e)),this.indexManager.getDocumentsMatchingTarget(t,r).next(o=>{const a=j(...o);return this.fs.getDocuments(t,a).next(h=>this.indexManager.getMinOffset(t,r).next(l=>{const f=this.Ss(e,h);return this.bs(e,f,a,l.readTime)?this.gs(t,xs(e,null,"F")):this.Ds(t,f,e,l)}))})))}ps(t,e,r,s){return Ma(e)||s.isEqual(L.min())?S.resolve(null):this.fs.getDocuments(t,r).next(o=>{const a=this.Ss(e,o);return this.bs(e,a,r,s)?S.resolve(null):(Ve()<=q.DEBUG&&D("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Me(e)),this.Ds(t,a,e,Zl(s,fn)).next(h=>h))})}Ss(t,e){let r=new at(Fa(t));return e.forEach((s,o)=>{pr(t,o)&&(r=r.add(o))}),r}bs(t,e,r,s){if(t.limit===null)return!1;if(r.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(s)>0)}ys(t,e,r){return Ve()<=q.DEBUG&&D("QueryEngine","Using full collection scan to execute query:",Me(e)),this.fs.getDocumentsMatchingQuery(t,e,Zt.min(),r)}Ds(t,e,r,s){return this.fs.getDocumentsMatchingQuery(t,r,s).next(o=>(e.forEach(a=>{o=o.insert(a.key,a)}),o))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ys="LocalStore",xf=3e8;class Mf{constructor(t,e,r,s){this.persistence=t,this.Cs=e,this.serializer=s,this.vs=new J(B),this.Fs=new ge(o=>Ns(o),ks),this.Ms=new Map,this.xs=t.getRemoteDocumentCache(),this.li=t.getTargetCache(),this.Pi=t.getBundleCache(),this.Os(r)}Os(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new wf(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.vs))}}function Lf(n,t,e,r){return new Mf(n,t,e,r)}async function Tc(n,t){const e=F(n);return await e.persistence.runTransaction("Handle user change","readonly",r=>{let s;return e.mutationQueue.getAllMutationBatches(r).next(o=>(s=o,e.Os(t),e.mutationQueue.getAllMutationBatches(r))).next(o=>{const a=[],h=[];let l=j();for(const f of s){a.push(f.batchId);for(const g of f.mutations)l=l.add(g.key)}for(const f of o){h.push(f.batchId);for(const g of f.mutations)l=l.add(g.key)}return e.localDocuments.getDocuments(r,l).next(f=>({Ns:f,removedBatchIds:a,addedBatchIds:h}))})})}function Ff(n,t){const e=F(n);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const s=t.batch.keys(),o=e.xs.newChangeBuffer({trackRemovals:!0});return function(h,l,f,g){const v=f.batch,R=v.keys();let P=S.resolve();return R.forEach(k=>{P=P.next(()=>g.getEntry(l,k)).next(x=>{const V=f.docVersions.get(k);G(V!==null,48541),x.version.compareTo(V)<0&&(v.applyToRemoteDocument(x,f),x.isValidDocument()&&(x.setReadTime(f.commitVersion),g.addEntry(x)))})}),P.next(()=>h.mutationQueue.removeMutationBatch(l,v))}(e,r,t,o).next(()=>o.apply(r)).next(()=>e.mutationQueue.performConsistencyCheck(r)).next(()=>e.documentOverlayCache.removeOverlaysForBatchId(r,s,t.batch.batchId)).next(()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(h){let l=j();for(let f=0;f<h.mutationResults.length;++f)h.mutationResults[f].transformResults.length>0&&(l=l.add(h.batch.mutations[f].key));return l}(t))).next(()=>e.localDocuments.getDocuments(r,s))})}function vc(n){const t=F(n);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.li.getLastRemoteSnapshotVersion(e))}function Uf(n,t){const e=F(n),r=t.snapshotVersion;let s=e.vs;return e.persistence.runTransaction("Apply remote event","readwrite-primary",o=>{const a=e.xs.newChangeBuffer({trackRemovals:!0});s=e.vs;const h=[];t.targetChanges.forEach((g,v)=>{const R=s.get(v);if(!R)return;h.push(e.li.removeMatchingKeys(o,g.removedDocuments,v).next(()=>e.li.addMatchingKeys(o,g.addedDocuments,v)));let P=R.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(v)!==null?P=P.withResumeToken(ft.EMPTY_BYTE_STRING,L.min()).withLastLimboFreeSnapshotVersion(L.min()):g.resumeToken.approximateByteSize()>0&&(P=P.withResumeToken(g.resumeToken,r)),s=s.insert(v,P),function(x,V,H){return x.resumeToken.approximateByteSize()===0||V.snapshotVersion.toMicroseconds()-x.snapshotVersion.toMicroseconds()>=xf?!0:H.addedDocuments.size+H.modifiedDocuments.size+H.removedDocuments.size>0}(R,P,g)&&h.push(e.li.updateTargetData(o,P))});let l=qt(),f=j();if(t.documentUpdates.forEach(g=>{t.resolvedLimboDocuments.has(g)&&h.push(e.persistence.referenceDelegate.updateLimboDocument(o,g))}),h.push(Bf(o,a,t.documentUpdates).next(g=>{l=g.Bs,f=g.Ls})),!r.isEqual(L.min())){const g=e.li.getLastRemoteSnapshotVersion(o).next(v=>e.li.setTargetsMetadata(o,o.currentSequenceNumber,r));h.push(g)}return S.waitFor(h).next(()=>a.apply(o)).next(()=>e.localDocuments.getLocalViewOfDocuments(o,l,f)).next(()=>l)}).then(o=>(e.vs=s,o))}function Bf(n,t,e){let r=j(),s=j();return e.forEach(o=>r=r.add(o)),t.getEntries(n,r).next(o=>{let a=qt();return e.forEach((h,l)=>{const f=o.get(h);l.isFoundDocument()!==f.isFoundDocument()&&(s=s.add(h)),l.isNoDocument()&&l.version.isEqual(L.min())?(t.removeEntry(h,l.readTime),a=a.insert(h,l)):!f.isValidDocument()||l.version.compareTo(f.version)>0||l.version.compareTo(f.version)===0&&f.hasPendingWrites?(t.addEntry(l),a=a.insert(h,l)):D(Ys,"Ignoring outdated watch update for ",h,". Current version:",f.version," Watch version:",l.version)}),{Bs:a,Ls:s}})}function jf(n,t){const e=F(n);return e.persistence.runTransaction("Get next mutation batch","readonly",r=>(t===void 0&&(t=Ss),e.mutationQueue.getNextMutationBatchAfterBatchId(r,t)))}function qf(n,t){const e=F(n);return e.persistence.runTransaction("Allocate target","readwrite",r=>{let s;return e.li.getTargetData(r,t).next(o=>o?(s=o,S.resolve(s)):e.li.allocateTargetId(r).next(a=>(s=new re(t,a,"TargetPurposeListen",r.currentSequenceNumber),e.li.addTargetData(r,s).next(()=>s))))}).then(r=>{const s=e.vs.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.vs=e.vs.insert(r.targetId,r),e.Fs.set(t,r.targetId)),r})}async function Xs(n,t,e){const r=F(n),s=r.vs.get(t),o=e?"readwrite":"readwrite-primary";try{e||await r.persistence.runTransaction("Release target",o,a=>r.persistence.referenceDelegate.removeTarget(a,s))}catch(a){if(!ke(a))throw a;D(Ys,`Failed to update sequence numbers for target ${t}: ${a}`)}r.vs=r.vs.remove(t),r.Fs.delete(s.target)}function Ic(n,t,e){const r=F(n);let s=L.min(),o=j();return r.persistence.runTransaction("Execute query","readwrite",a=>function(l,f,g){const v=F(l),R=v.Fs.get(g);return R!==void 0?S.resolve(v.vs.get(R)):v.li.getTargetData(f,g)}(r,a,xt(t)).next(h=>{if(h)return s=h.lastLimboFreeSnapshotVersion,r.li.getMatchingKeysForTargetId(a,h.targetId).next(l=>{o=l})}).next(()=>r.Cs.getDocumentsMatchingQuery(a,t,e?s:L.min(),e?o:j())).next(h=>($f(r,bd(t),h),{documents:h,ks:o})))}function $f(n,t,e){let r=n.Ms.get(t)||L.min();e.forEach((s,o)=>{o.readTime.compareTo(r)>0&&(r=o.readTime)}),n.Ms.set(t,r)}class Ac{constructor(){this.activeTargetIds=kd()}Qs(t){this.activeTargetIds=this.activeTargetIds.add(t)}Gs(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Ws(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class zf{constructor(){this.vo=new Ac,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,r){}addLocalQueryTarget(t,e=!0){return e&&this.vo.Qs(t),this.Fo[t]||"not-current"}updateQueryState(t,e,r){this.Fo[t]=e}removeLocalQueryTarget(t){this.vo.Gs(t)}isLocalQueryTarget(t){return this.vo.activeTargetIds.has(t)}clearQueryState(t){delete this.Fo[t]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(t){return this.vo.activeTargetIds.has(t)}start(){return this.vo=new Ac,Promise.resolve()}handleUserChange(t,e,r){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gf{Mo(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wc="ConnectivityMonitor";class Rc{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(t){this.Lo.push(t)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){D(wc,"Network connectivity changed: AVAILABLE");for(const t of this.Lo)t(0)}Bo(){D(wc,"Network connectivity changed: UNAVAILABLE");for(const t of this.Lo)t(1)}static v(){return typeof window!="undefined"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Sr=null;function Js(){return Sr===null?Sr=function(){return 268435456+Math.round(2147483648*Math.random())}():Sr++,"0x"+Sr.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zs="RestConnection",Hf={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class Kf{get qo(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Ko=e+"://"+t.host,this.Uo=`projects/${r}/databases/${s}`,this.$o=this.databaseId.database===ir?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Wo(t,e,r,s,o){const a=Js(),h=this.Qo(t,e.toUriEncodedString());D(Zs,`Sending RPC '${t}' ${a}:`,h,r);const l={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(l,s,o);const{host:f}=new URL(h),g=No(f);return this.zo(t,h,l,r,g).then(v=>(D(Zs,`Received RPC '${t}' ${a}: `,v),v),v=>{throw me(Zs,`RPC '${t}' ${a} failed with error: `,v,"url: ",h,"request:",r),v})}jo(t,e,r,s,o,a){return this.Wo(t,e,r,s,o)}Go(t,e,r){t["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Ce}(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach((s,o)=>t[o]=s),r&&r.headers.forEach((s,o)=>t[o]=s)}Qo(t,e){const r=Hf[t];let s=`${this.Ko}/v1/${e}:${r}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wf{constructor(t){this.Jo=t.Jo,this.Ho=t.Ho}Zo(t){this.Xo=t}Yo(t){this.e_=t}t_(t){this.n_=t}onMessage(t){this.r_=t}close(){this.Ho()}send(t){this.Jo(t)}i_(){this.Xo()}s_(){this.e_()}o_(t){this.n_(t)}__(t){this.r_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _t="WebChannelConnection",bn=(n,t,e)=>{n.listen(t,r=>{try{e(r)}catch(s){setTimeout(()=>{throw s},0)}})};class Be extends Kf{constructor(t){super(t),this.a_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}static u_(){if(!Be.c_){const t=Xo();bn(t,Yo.STAT_EVENT,e=>{e.stat===Ts.PROXY?D(_t,"STAT_EVENT: detected buffering proxy"):e.stat===Ts.NOPROXY&&D(_t,"STAT_EVENT: detected no buffering proxy")}),Be.c_=!0}}zo(t,e,r,s,o){const a=Js();return new Promise((h,l)=>{const f=new Wo;f.setWithCredentials(!0),f.listenOnce(Qo.COMPLETE,()=>{try{switch(f.getLastErrorCode()){case Zn.NO_ERROR:const v=f.getResponseJson();D(_t,`XHR for RPC '${t}' ${a} received:`,JSON.stringify(v)),h(v);break;case Zn.TIMEOUT:D(_t,`RPC '${t}' ${a} timed out`),l(new N(b.DEADLINE_EXCEEDED,"Request time out"));break;case Zn.HTTP_ERROR:const R=f.getStatus();if(D(_t,`RPC '${t}' ${a} failed with status:`,R,"response text:",f.getResponseText()),R>0){let P=f.getResponseJson();Array.isArray(P)&&(P=P[0]);const k=P==null?void 0:P.error;if(k&&k.status&&k.message){const x=function(H){const z=H.toLowerCase().replace(/_/g,"-");return Object.values(b).indexOf(z)>=0?z:b.UNKNOWN}(k.status);l(new N(x,k.message))}else l(new N(b.UNKNOWN,"Server responded with status "+f.getStatus()))}else l(new N(b.UNAVAILABLE,"Connection failed."));break;default:M(9055,{l_:t,streamId:a,h_:f.getLastErrorCode(),P_:f.getLastError()})}}finally{D(_t,`RPC '${t}' ${a} completed.`)}});const g=JSON.stringify(s);D(_t,`RPC '${t}' ${a} sending request:`,s),f.send(e,"POST",g,r,15)})}T_(t,e,r){const s=Js(),o=[this.Ko,"/","google.firestore.v1.Firestore","/",t,"/channel"],a=this.createWebChannelTransport(),h={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},l=this.longPollingOptions.timeoutSeconds;l!==void 0&&(h.longPollingTimeout=Math.round(1e3*l)),this.useFetchStreams&&(h.useFetchStreams=!0),this.Go(h.initMessageHeaders,e,r),h.encodeInitMessageHeaders=!0;const f=o.join("");D(_t,`Creating RPC '${t}' stream ${s}: ${f}`,h);const g=a.createWebChannel(f,h);this.E_(g);let v=!1,R=!1;const P=new Wf({Jo:k=>{R?D(_t,`Not sending because RPC '${t}' stream ${s} is closed:`,k):(v||(D(_t,`Opening RPC '${t}' stream ${s} transport.`),g.open(),v=!0),D(_t,`RPC '${t}' stream ${s} sending:`,k),g.send(k))},Ho:()=>g.close()});return bn(g,ln.EventType.OPEN,()=>{R||(D(_t,`RPC '${t}' stream ${s} transport opened.`),P.i_())}),bn(g,ln.EventType.CLOSE,()=>{R||(R=!0,D(_t,`RPC '${t}' stream ${s} transport closed`),P.o_(),this.I_(g))}),bn(g,ln.EventType.ERROR,k=>{R||(R=!0,me(_t,`RPC '${t}' stream ${s} transport errored. Name:`,k.name,"Message:",k.message),P.o_(new N(b.UNAVAILABLE,"The operation could not be completed")))}),bn(g,ln.EventType.MESSAGE,k=>{var x;if(!R){const V=k.data[0];G(!!V,16349);const H=V,z=(H==null?void 0:H.error)||((x=H[0])==null?void 0:x.error);if(z){D(_t,`RPC '${t}' stream ${s} received error:`,z);const W=z.status;let yt=function(E){const m=nt[E];if(m!==void 0)return Za(m)}(W),st=z.message;W==="NOT_FOUND"&&st.includes("database")&&st.includes("does not exist")&&st.includes(this.databaseId.database)&&me(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),yt===void 0&&(yt=b.INTERNAL,st="Unknown error status: "+W+" with message "+z.message),R=!0,P.o_(new N(yt,st)),g.close()}else D(_t,`RPC '${t}' stream ${s} received:`,V),P.__(V)}}),Be.u_(),setTimeout(()=>{P.s_()},0),P}terminate(){this.a_.forEach(t=>t.close()),this.a_=[]}E_(t){this.a_.push(t)}I_(t){this.a_=this.a_.filter(e=>e===t)}Go(t,e,r){super.Go(t,e,r),this.databaseInfo.apiKey&&(t["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return Jo()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qf(n){return new Be(n)}function ti(){return typeof document!="undefined"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function br(n){return new Jd(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Be.c_=!1;class Sc{constructor(t,e,r=1e3,s=1.5,o=6e4){this.Ci=t,this.timerId=e,this.R_=r,this.A_=s,this.V_=o,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(t){this.cancel();const e=Math.floor(this.d_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,e-r);s>0&&D("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.d_} ms, delay with jitter: ${e} ms, last attempt: ${r} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,s,()=>(this.f_=Date.now(),t())),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bc="PersistentStream";class Pc{constructor(t,e,r,s,o,a,h,l){this.Ci=t,this.S_=r,this.b_=s,this.connection=o,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=h,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Sc(t,e)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Ci.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(t){this.K_(),this.stream.send(t)}async k_(){if(this.O_())return this.close(0)}K_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.K_(),this.U_(),this.M_.cancel(),this.D_++,t!==4?this.M_.reset():e&&e.code===b.RESOURCE_EXHAUSTED?(Bt(e.toString()),Bt("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===b.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.W_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.t_(e)}W_(){}auth(){this.state=1;const t=this.Q_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,s])=>{this.D_===e&&this.G_(r,s)},r=>{t(()=>{const s=new N(b.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(s)})})}G_(t,e){const r=this.Q_(this.D_);this.stream=this.j_(t,e),this.stream.Zo(()=>{r(()=>this.listener.Zo())}),this.stream.Yo(()=>{r(()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.Yo()))}),this.stream.t_(s=>{r(()=>this.z_(s))}),this.stream.onMessage(s=>{r(()=>++this.F_==1?this.J_(s):this.onNext(s))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(t){return D(bc,`close with error: ${t}`),this.stream=null,this.close(4,t)}Q_(t){return e=>{this.Ci.enqueueAndForget(()=>this.D_===t?e():(D(bc,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class Yf extends Pc{constructor(t,e,r,s,o,a){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=ef(this.serializer,t),r=function(o){if(!("targetChange"in o))return L.min();const a=o.targetChange;return a.targetIds&&a.targetIds.length?L.min():a.readTime?Lt(a.readTime):L.min()}(t);return this.listener.H_(e,r)}Z_(t){const e={};e.database=Hs(this.serializer),e.addTarget=function(o,a){let h;const l=a.target;if(h=Os(l)?{documents:sf(o,l)}:{query:of(o,l).ft},h.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){h.resumeToken=oc(o,a.resumeToken);const f=js(o,a.expectedCount);f!==null&&(h.expectedCount=f)}else if(a.snapshotVersion.compareTo(L.min())>0){h.readTime=wr(o,a.snapshotVersion.toTimestamp());const f=js(o,a.expectedCount);f!==null&&(h.expectedCount=f)}return h}(this.serializer,t);const r=cf(this.serializer,t);r&&(e.labels=r),this.q_(e)}X_(t){const e={};e.database=Hs(this.serializer),e.removeTarget=t,this.q_(e)}}class Xf extends Pc{constructor(t,e,r,s,o,a){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(t,e){return this.connection.T_("Write",t,e)}J_(t){return G(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,G(!t.writeResults||t.writeResults.length===0,55816),this.listener.ta()}onNext(t){G(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.M_.reset();const e=rf(t.writeResults,t.commitTime),r=Lt(t.commitTime);return this.listener.na(r,e)}ra(){const t={};t.database=Hs(this.serializer),this.q_(t)}ea(t){const e={streamToken:this.lastStreamToken,writes:t.map(r=>nf(this.serializer,r))};this.q_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jf{}class Zf extends Jf{constructor(t,e,r,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new N(b.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(t,e,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,a])=>this.connection.Wo(t,$s(e,r),s,o,a)).catch(o=>{throw o.name==="FirebaseError"?(o.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new N(b.UNKNOWN,o.toString())})}jo(t,e,r,s,o){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,h])=>this.connection.jo(t,$s(e,r),s,a,h,o)).catch(a=>{throw a.name==="FirebaseError"?(a.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new N(b.UNKNOWN,a.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}function tm(n,t,e,r){return new Zf(n,t,e,r)}class em{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(t){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,t==="Online"&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Bt(e),this.aa=!1):D("OnlineStateTracker",e)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ee="RemoteStore";class nm{constructor(t,e,r,s,o){this.localStore=t,this.datastore=e,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ea=new Map,this.Ia=new Set,this.Ra=[],this.Aa=o,this.Aa.Mo(a=>{r.enqueueAndForget(async()=>{Te(this)&&(D(Ee,"Restarting streams for network reachability change."),await async function(l){const f=F(l);f.Ia.add(4),await Pn(f),f.Va.set("Unknown"),f.Ia.delete(4),await Pr(f)}(this))})}),this.Va=new em(r,s)}}async function Pr(n){if(Te(n))for(const t of n.Ra)await t(!0)}async function Pn(n){for(const t of n.Ra)await t(!1)}function Cc(n,t){const e=F(n);e.Ea.has(t.targetId)||(e.Ea.set(t.targetId,t),si(e)?ri(e):je(e).O_()&&ni(e,t))}function ei(n,t){const e=F(n),r=je(e);e.Ea.delete(t),r.O_()&&Vc(e,t),e.Ea.size===0&&(r.O_()?r.L_():Te(e)&&e.Va.set("Unknown"))}function ni(n,t){if(n.da.$e(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(L.min())>0){const e=n.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}je(n).Z_(t)}function Vc(n,t){n.da.$e(t),je(n).X_(t)}function ri(n){n.da=new Wd({getRemoteKeysForTarget:t=>n.remoteSyncer.getRemoteKeysForTarget(t),At:t=>n.Ea.get(t)||null,ht:()=>n.datastore.serializer.databaseId}),je(n).start(),n.Va.ua()}function si(n){return Te(n)&&!je(n).x_()&&n.Ea.size>0}function Te(n){return F(n).Ia.size===0}function Dc(n){n.da=void 0}async function rm(n){n.Va.set("Online")}async function sm(n){n.Ea.forEach((t,e)=>{ni(n,t)})}async function im(n,t){Dc(n),si(n)?(n.Va.ha(t),ri(n)):n.Va.set("Unknown")}async function om(n,t,e){if(n.Va.set("Online"),t instanceof rc&&t.state===2&&t.cause)try{await async function(s,o){const a=o.cause;for(const h of o.targetIds)s.Ea.has(h)&&(await s.remoteSyncer.rejectListen(h,a),s.Ea.delete(h),s.da.removeTarget(h))}(n,t)}catch(r){D(Ee,"Failed to remove targets %s: %s ",t.targetIds.join(","),r),await Cr(n,r)}else if(t instanceof Ir?n.da.Xe(t):t instanceof nc?n.da.st(t):n.da.tt(t),!e.isEqual(L.min()))try{const r=await vc(n.localStore);e.compareTo(r)>=0&&await function(o,a){const h=o.da.Tt(a);return h.targetChanges.forEach((l,f)=>{if(l.resumeToken.approximateByteSize()>0){const g=o.Ea.get(f);g&&o.Ea.set(f,g.withResumeToken(l.resumeToken,a))}}),h.targetMismatches.forEach((l,f)=>{const g=o.Ea.get(l);if(!g)return;o.Ea.set(l,g.withResumeToken(ft.EMPTY_BYTE_STRING,g.snapshotVersion)),Vc(o,l);const v=new re(g.target,l,f,g.sequenceNumber);ni(o,v)}),o.remoteSyncer.applyRemoteEvent(h)}(n,e)}catch(r){D(Ee,"Failed to raise snapshot:",r),await Cr(n,r)}}async function Cr(n,t,e){if(!ke(t))throw t;n.Ia.add(1),await Pn(n),n.Va.set("Offline"),e||(e=()=>vc(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{D(Ee,"Retrying IndexedDB access"),await e(),n.Ia.delete(1),await Pr(n)})}function Nc(n,t){return t().catch(e=>Cr(n,e,t))}async function Vr(n){const t=F(n),e=se(t);let r=t.Ta.length>0?t.Ta[t.Ta.length-1].batchId:Ss;for(;am(t);)try{const s=await jf(t.localStore,r);if(s===null){t.Ta.length===0&&e.L_();break}r=s.batchId,cm(t,s)}catch(s){await Cr(t,s)}kc(t)&&Oc(t)}function am(n){return Te(n)&&n.Ta.length<10}function cm(n,t){n.Ta.push(t);const e=se(n);e.O_()&&e.Y_&&e.ea(t.mutations)}function kc(n){return Te(n)&&!se(n).x_()&&n.Ta.length>0}function Oc(n){se(n).start()}async function um(n){se(n).ra()}async function hm(n){const t=se(n);for(const e of n.Ta)t.ea(e.mutations)}async function lm(n,t,e){const r=n.Ta.shift(),s=Fs.from(r,t,e);await Nc(n,()=>n.remoteSyncer.applySuccessfulWrite(s)),await Vr(n)}async function dm(n,t){t&&se(n).Y_&&await async function(r,s){if(function(a){return Gd(a)&&a!==b.ABORTED}(s.code)){const o=r.Ta.shift();se(r).B_(),await Nc(r,()=>r.remoteSyncer.rejectFailedWrite(o.batchId,s)),await Vr(r)}}(n,t),kc(n)&&Oc(n)}async function xc(n,t){const e=F(n);e.asyncQueue.verifyOperationInProgress(),D(Ee,"RemoteStore received new credentials");const r=Te(e);e.Ia.add(3),await Pn(e),r&&e.Va.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ia.delete(3),await Pr(e)}async function fm(n,t){const e=F(n);t?(e.Ia.delete(2),await Pr(e)):t||(e.Ia.add(2),await Pn(e),e.Va.set("Unknown"))}function je(n){return n.ma||(n.ma=function(e,r,s){const o=F(e);return o.sa(),new Yf(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Zo:rm.bind(null,n),Yo:sm.bind(null,n),t_:im.bind(null,n),H_:om.bind(null,n)}),n.Ra.push(async t=>{t?(n.ma.B_(),si(n)?ri(n):n.Va.set("Unknown")):(await n.ma.stop(),Dc(n))})),n.ma}function se(n){return n.fa||(n.fa=function(e,r,s){const o=F(e);return o.sa(),new Xf(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Zo:()=>Promise.resolve(),Yo:um.bind(null,n),t_:dm.bind(null,n),ta:hm.bind(null,n),na:lm.bind(null,n)}),n.Ra.push(async t=>{t?(n.fa.B_(),await Vr(n)):(await n.fa.stop(),n.Ta.length>0&&(D(Ee,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))})),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ii{constructor(t,e,r,s,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=r,this.op=s,this.removalCallback=o,this.deferred=new jt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,r,s,o){const a=Date.now()+r,h=new ii(t,e,a,s,o);return h.start(r),h}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new N(b.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function oi(n,t){if(Bt("AsyncQueue",`${t}: ${n}`),ke(n))return new N(b.UNAVAILABLE,`${t}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qe{static emptySet(t){return new qe(t.comparator)}constructor(t){this.comparator=t?(e,r)=>t(e,r)||O.comparator(e.key,r.key):(e,r)=>O.comparator(e.key,r.key),this.keyedMap=En(),this.sortedSet=new J(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,r)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof qe)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),r=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(!s.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const r=new qe;return r.comparator=this.comparator,r.keyedMap=t,r.sortedSet=e,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mc{constructor(){this.ga=new J(O.comparator)}track(t){const e=t.doc.key,r=this.ga.get(e);r?t.type!==0&&r.type===3?this.ga=this.ga.insert(e,t):t.type===3&&r.type!==1?this.ga=this.ga.insert(e,{type:r.type,doc:t.doc}):t.type===2&&r.type===2?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):t.type===2&&r.type===0?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):t.type===1&&r.type===0?this.ga=this.ga.remove(e):t.type===1&&r.type===2?this.ga=this.ga.insert(e,{type:1,doc:r.doc}):t.type===0&&r.type===1?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):M(63341,{Vt:t,pa:r}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal((e,r)=>{t.push(r)}),t}}class $e{constructor(t,e,r,s,o,a,h,l,f){this.query=t,this.docs=e,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=o,this.fromCache=a,this.syncStateChanged=h,this.excludesMetadataChanges=l,this.hasCachedResults=f}static fromInitialDocuments(t,e,r,s,o){const a=[];return e.forEach(h=>{a.push({type:0,doc:h})}),new $e(t,e,qe.emptySet(e),a,r,s,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&mr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,r=t.docChanges;if(e.length!==r.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==r[s].type||!e[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mm{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(t=>t.Da())}}class pm{constructor(){this.queries=Lc(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(e,r){const s=F(e),o=s.queries;s.queries=Lc(),o.forEach((a,h)=>{for(const l of h.Sa)l.onError(r)})})(this,new N(b.ABORTED,"Firestore shutting down"))}}function Lc(){return new ge(n=>La(n),mr)}async function ai(n,t){const e=F(n);let r=3;const s=t.query;let o=e.queries.get(s);o?!o.ba()&&t.Da()&&(r=2):(o=new mm,r=t.Da()?0:1);try{switch(r){case 0:o.wa=await e.onListen(s,!0);break;case 1:o.wa=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(a){const h=oi(a,`Initialization of query '${Me(t.query)}' failed`);return void t.onError(h)}e.queries.set(s,o),o.Sa.push(t),t.va(e.onlineState),o.wa&&t.Fa(o.wa)&&ui(e)}async function ci(n,t){const e=F(n),r=t.query;let s=3;const o=e.queries.get(r);if(o){const a=o.Sa.indexOf(t);a>=0&&(o.Sa.splice(a,1),o.Sa.length===0?s=t.Da()?0:1:!o.ba()&&t.Da()&&(s=2))}switch(s){case 0:return e.queries.delete(r),e.onUnlisten(r,!0);case 1:return e.queries.delete(r),e.onUnlisten(r,!1);case 2:return e.onLastRemoteStoreUnlisten(r);default:return}}function gm(n,t){const e=F(n);let r=!1;for(const s of t){const o=s.query,a=e.queries.get(o);if(a){for(const h of a.Sa)h.Fa(s)&&(r=!0);a.wa=s}}r&&ui(e)}function _m(n,t,e){const r=F(n),s=r.queries.get(t);if(s)for(const o of s.Sa)o.onError(e);r.queries.delete(t)}function ui(n){n.Ca.forEach(t=>{t.next()})}var hi,Fc;(Fc=hi||(hi={})).Ma="default",Fc.Cache="cache";class li{constructor(t,e,r){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(t){if(!this.options.includeMetadataChanges){const r=[];for(const s of t.docChanges)s.type!==3&&r.push(s);t=new $e(t.query,t.docs,t.oldDocs,r,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache||!this.Da())return!0;const r=e!=="Offline";return(!this.options.qa||!r)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}ka(t){t=$e.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==hi.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uc{constructor(t){this.key=t}}class Bc{constructor(t){this.key=t}}class ym{constructor(t,e){this.query=t,this.Za=e,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=j(),this.mutatedKeys=j(),this.eu=Fa(t),this.tu=new qe(this.eu)}get nu(){return this.Za}ru(t,e){const r=e?e.iu:new Mc,s=e?e.tu:this.tu;let o=e?e.mutatedKeys:this.mutatedKeys,a=s,h=!1;const l=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,f=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal((g,v)=>{const R=s.get(g),P=pr(this.query,v)?v:null,k=!!R&&this.mutatedKeys.has(R.key),x=!!P&&(P.hasLocalMutations||this.mutatedKeys.has(P.key)&&P.hasCommittedMutations);let V=!1;R&&P?R.data.isEqual(P.data)?k!==x&&(r.track({type:3,doc:P}),V=!0):this.su(R,P)||(r.track({type:2,doc:P}),V=!0,(l&&this.eu(P,l)>0||f&&this.eu(P,f)<0)&&(h=!0)):!R&&P?(r.track({type:0,doc:P}),V=!0):R&&!P&&(r.track({type:1,doc:R}),V=!0,(l||f)&&(h=!0)),V&&(P?(a=a.add(P),o=x?o.add(g):o.delete(g)):(a=a.delete(g),o=o.delete(g)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const g=this.query.limitType==="F"?a.last():a.first();a=a.delete(g.key),o=o.delete(g.key),r.track({type:1,doc:g})}return{tu:a,iu:r,bs:h,mutatedKeys:o}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,r,s){const o=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const a=t.iu.ya();a.sort((g,v)=>function(P,k){const x=V=>{switch(V){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return M(20277,{Vt:V})}};return x(P)-x(k)}(g.type,v.type)||this.eu(g.doc,v.doc)),this.ou(r),s=s!=null?s:!1;const h=e&&!s?this._u():[],l=this.Ya.size===0&&this.current&&!s?1:0,f=l!==this.Xa;return this.Xa=l,a.length!==0||f?{snapshot:new $e(this.query,t.tu,o,a,t.mutatedKeys,l===0,f,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:h}:{au:h}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Mc,mutatedKeys:this.mutatedKeys,bs:!1},!1)):{au:[]}}uu(t){return!this.Za.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach(e=>this.Za=this.Za.add(e)),t.modifiedDocuments.forEach(e=>{}),t.removedDocuments.forEach(e=>this.Za=this.Za.delete(e)),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Ya;this.Ya=j(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Ya=this.Ya.add(r.key))});const e=[];return t.forEach(r=>{this.Ya.has(r)||e.push(new Bc(r))}),this.Ya.forEach(r=>{t.has(r)||e.push(new Uc(r))}),e}cu(t){this.Za=t.ks,this.Ya=j();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return $e.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Xa===0,this.hasCachedResults)}}const di="SyncEngine";class Em{constructor(t,e,r){this.query=t,this.targetId=e,this.view=r}}class Tm{constructor(t){this.key=t,this.hu=!1}}class vm{constructor(t,e,r,s,o,a){this.localStore=t,this.remoteStore=e,this.eventManager=r,this.sharedClientState=s,this.currentUser=o,this.maxConcurrentLimboResolutions=a,this.Pu={},this.Tu=new ge(h=>La(h),mr),this.Eu=new Map,this.Iu=new Set,this.Ru=new J(O.comparator),this.Au=new Map,this.Vu=new Ks,this.du={},this.mu=new Map,this.fu=Ue.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function Im(n,t,e=!0){const r=Wc(n);let s;const o=r.Tu.get(t);return o?(r.sharedClientState.addLocalQueryTarget(o.targetId),s=o.view.lu()):s=await jc(r,t,e,!0),s}async function Am(n,t){const e=Wc(n);await jc(e,t,!0,!1)}async function jc(n,t,e,r){const s=await qf(n.localStore,xt(t)),o=s.targetId,a=n.sharedClientState.addLocalQueryTarget(o,e);let h;return r&&(h=await wm(n,t,o,a==="current",s.resumeToken)),n.isPrimaryClient&&e&&Cc(n.remoteStore,s),h}async function wm(n,t,e,r,s){n.pu=(v,R,P)=>async function(x,V,H,z){let W=V.view.ru(H);W.bs&&(W=await Ic(x.localStore,V.query,!1).then(({documents:E})=>V.view.ru(E,W)));const yt=z&&z.targetChanges.get(V.targetId),st=z&&z.targetMismatches.get(V.targetId)!=null,it=V.view.applyChanges(W,x.isPrimaryClient,yt,st);return Kc(x,V.targetId,it.au),it.snapshot}(n,v,R,P);const o=await Ic(n.localStore,t,!0),a=new ym(t,o.ks),h=a.ru(o.documents),l=Sn.createSynthesizedTargetChangeForCurrentChange(e,r&&n.onlineState!=="Offline",s),f=a.applyChanges(h,n.isPrimaryClient,l);Kc(n,e,f.au);const g=new Em(t,e,a);return n.Tu.set(t,g),n.Eu.has(e)?n.Eu.get(e).push(t):n.Eu.set(e,[t]),f.snapshot}async function Rm(n,t,e){const r=F(n),s=r.Tu.get(t),o=r.Eu.get(s.targetId);if(o.length>1)return r.Eu.set(s.targetId,o.filter(a=>!mr(a,t))),void r.Tu.delete(t);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await Xs(r.localStore,s.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(s.targetId),e&&ei(r.remoteStore,s.targetId),fi(r,s.targetId)}).catch(Ne)):(fi(r,s.targetId),await Xs(r.localStore,s.targetId,!0))}async function Sm(n,t){const e=F(n),r=e.Tu.get(t),s=e.Eu.get(r.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(r.targetId),ei(e.remoteStore,r.targetId))}async function bm(n,t,e){const r=Om(n);try{const s=await function(a,h){const l=F(a),f=X.now(),g=h.reduce((P,k)=>P.add(k.key),j());let v,R;return l.persistence.runTransaction("Locally write mutations","readwrite",P=>{let k=qt(),x=j();return l.xs.getEntries(P,g).next(V=>{k=V,k.forEach((H,z)=>{z.isValidDocument()||(x=x.add(H))})}).next(()=>l.localDocuments.getOverlayedDocuments(P,k)).next(V=>{v=V;const H=[];for(const z of h){const W=Bd(z,v.get(z.key).overlayedDocument);W!=null&&H.push(new ye(z.key,W,Sa(W.value.mapValue),Mt.exists(!0)))}return l.mutationQueue.addMutationBatch(P,f,H,h)}).next(V=>{R=V;const H=V.applyToLocalDocumentSet(v,x);return l.documentOverlayCache.saveOverlays(P,V.batchId,H)})}).then(()=>({batchId:R.batchId,changes:Ba(v)}))}(r.localStore,t);r.sharedClientState.addPendingMutation(s.batchId),function(a,h,l){let f=a.du[a.currentUser.toKey()];f||(f=new J(B)),f=f.insert(h,l),a.du[a.currentUser.toKey()]=f}(r,s.batchId,e),await Cn(r,s.changes),await Vr(r.remoteStore)}catch(s){const o=oi(s,"Failed to persist write");e.reject(o)}}async function qc(n,t){const e=F(n);try{const r=await Uf(e.localStore,t);t.targetChanges.forEach((s,o)=>{const a=e.Au.get(o);a&&(G(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.hu=!0:s.modifiedDocuments.size>0?G(a.hu,14607):s.removedDocuments.size>0&&(G(a.hu,42227),a.hu=!1))}),await Cn(e,r,t)}catch(r){await Ne(r)}}function $c(n,t,e){const r=F(n);if(r.isPrimaryClient&&e===0||!r.isPrimaryClient&&e===1){const s=[];r.Tu.forEach((o,a)=>{const h=a.view.va(t);h.snapshot&&s.push(h.snapshot)}),function(a,h){const l=F(a);l.onlineState=h;let f=!1;l.queries.forEach((g,v)=>{for(const R of v.Sa)R.va(h)&&(f=!0)}),f&&ui(l)}(r.eventManager,t),s.length&&r.Pu.H_(s),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function Pm(n,t,e){const r=F(n);r.sharedClientState.updateQueryState(t,"rejected",e);const s=r.Au.get(t),o=s&&s.key;if(o){let a=new J(O.comparator);a=a.insert(o,gt.newNoDocument(o,L.min()));const h=j().add(o),l=new vr(L.min(),new Map,new J(B),a,h);await qc(r,l),r.Ru=r.Ru.remove(o),r.Au.delete(t),mi(r)}else await Xs(r.localStore,t,!1).then(()=>fi(r,t,e)).catch(Ne)}async function Cm(n,t){const e=F(n),r=t.batch.batchId;try{const s=await Ff(e.localStore,t);Gc(e,r,null),zc(e,r),e.sharedClientState.updateMutationState(r,"acknowledged"),await Cn(e,s)}catch(s){await Ne(s)}}async function Vm(n,t,e){const r=F(n);try{const s=await function(a,h){const l=F(a);return l.persistence.runTransaction("Reject batch","readwrite-primary",f=>{let g;return l.mutationQueue.lookupMutationBatch(f,h).next(v=>(G(v!==null,37113),g=v.keys(),l.mutationQueue.removeMutationBatch(f,v))).next(()=>l.mutationQueue.performConsistencyCheck(f)).next(()=>l.documentOverlayCache.removeOverlaysForBatchId(f,g,h)).next(()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(f,g)).next(()=>l.localDocuments.getDocuments(f,g))})}(r.localStore,t);Gc(r,t,e),zc(r,t),r.sharedClientState.updateMutationState(t,"rejected",e),await Cn(r,s)}catch(s){await Ne(s)}}function zc(n,t){(n.mu.get(t)||[]).forEach(e=>{e.resolve()}),n.mu.delete(t)}function Gc(n,t,e){const r=F(n);let s=r.du[r.currentUser.toKey()];if(s){const o=s.get(t);o&&(e?o.reject(e):o.resolve(),s=s.remove(t)),r.du[r.currentUser.toKey()]=s}}function fi(n,t,e=null){n.sharedClientState.removeLocalQueryTarget(t);for(const r of n.Eu.get(t))n.Tu.delete(r),e&&n.Pu.yu(r,e);n.Eu.delete(t),n.isPrimaryClient&&n.Vu.Gr(t).forEach(r=>{n.Vu.containsKey(r)||Hc(n,r)})}function Hc(n,t){n.Iu.delete(t.path.canonicalString());const e=n.Ru.get(t);e!==null&&(ei(n.remoteStore,e),n.Ru=n.Ru.remove(t),n.Au.delete(e),mi(n))}function Kc(n,t,e){for(const r of e)r instanceof Uc?(n.Vu.addReference(r.key,t),Dm(n,r)):r instanceof Bc?(D(di,"Document no longer in limbo: "+r.key),n.Vu.removeReference(r.key,t),n.Vu.containsKey(r.key)||Hc(n,r.key)):M(19791,{wu:r})}function Dm(n,t){const e=t.key,r=e.path.canonicalString();n.Ru.get(e)||n.Iu.has(r)||(D(di,"New document in limbo: "+e),n.Iu.add(r),mi(n))}function mi(n){for(;n.Iu.size>0&&n.Ru.size<n.maxConcurrentLimboResolutions;){const t=n.Iu.values().next().value;n.Iu.delete(t);const e=new O(Y.fromString(t)),r=n.fu.next();n.Au.set(r,new Tm(e)),n.Ru=n.Ru.insert(e,r),Cc(n.remoteStore,new re(xt(fr(e.path)),r,"TargetPurposeLimboResolution",tr.ce))}}async function Cn(n,t,e){const r=F(n),s=[],o=[],a=[];r.Tu.isEmpty()||(r.Tu.forEach((h,l)=>{a.push(r.pu(l,t,e).then(f=>{var g;if((f||e)&&r.isPrimaryClient){const v=f?!f.fromCache:(g=e==null?void 0:e.targetChanges.get(l.targetId))==null?void 0:g.current;r.sharedClientState.updateQueryState(l.targetId,v?"current":"not-current")}if(f){s.push(f);const v=Qs.Is(l.targetId,f);o.push(v)}}))}),await Promise.all(a),r.Pu.H_(s),await async function(l,f){const g=F(l);try{await g.persistence.runTransaction("notifyLocalViewChanges","readwrite",v=>S.forEach(f,R=>S.forEach(R.Ts,P=>g.persistence.referenceDelegate.addReference(v,R.targetId,P)).next(()=>S.forEach(R.Es,P=>g.persistence.referenceDelegate.removeReference(v,R.targetId,P)))))}catch(v){if(!ke(v))throw v;D(Ys,"Failed to update sequence numbers: "+v)}for(const v of f){const R=v.targetId;if(!v.fromCache){const P=g.vs.get(R),k=P.snapshotVersion,x=P.withLastLimboFreeSnapshotVersion(k);g.vs=g.vs.insert(R,x)}}}(r.localStore,o))}async function Nm(n,t){const e=F(n);if(!e.currentUser.isEqual(t)){D(di,"User change. New user:",t.toKey());const r=await Tc(e.localStore,t);e.currentUser=t,function(o,a){o.mu.forEach(h=>{h.forEach(l=>{l.reject(new N(b.CANCELLED,a))})}),o.mu.clear()}(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,r.removedBatchIds,r.addedBatchIds),await Cn(e,r.Ns)}}function km(n,t){const e=F(n),r=e.Au.get(t);if(r&&r.hu)return j().add(r.key);{let s=j();const o=e.Eu.get(t);if(!o)return s;for(const a of o){const h=e.Tu.get(a);s=s.unionWith(h.view.nu)}return s}}function Wc(n){const t=F(n);return t.remoteStore.remoteSyncer.applyRemoteEvent=qc.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=km.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Pm.bind(null,t),t.Pu.H_=gm.bind(null,t.eventManager),t.Pu.yu=_m.bind(null,t.eventManager),t}function Om(n){const t=F(n);return t.remoteStore.remoteSyncer.applySuccessfulWrite=Cm.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=Vm.bind(null,t),t}class Dr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=br(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)}Fu(t,e){return null}Mu(t,e){return null}vu(t){return Lf(this.persistence,new Of,t.initialUser,this.serializer)}Cu(t){return new Ec(Ws.Vi,this.serializer)}Du(t){return new zf}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Dr.provider={build:()=>new Dr};class xm extends Dr{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){G(this.persistence.referenceDelegate instanceof Rr,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new Ef(r,t.asyncQueue,e)}Cu(t){const e=this.cacheSizeBytes!==void 0?At.withCacheSize(this.cacheSizeBytes):At.DEFAULT;return new Ec(r=>Rr.Vi(r,e),this.serializer)}}class pi{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>$c(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=Nm.bind(null,this.syncEngine),await fm(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return function(){return new pm}()}createDatastore(t){const e=br(t.databaseInfo.databaseId),r=Qf(t.databaseInfo);return tm(t.authCredentials,t.appCheckCredentials,r,e)}createRemoteStore(t){return function(r,s,o,a,h){return new nm(r,s,o,a,h)}(this.localStore,this.datastore,t.asyncQueue,e=>$c(this.syncEngine,e,0),function(){return Rc.v()?new Rc:new Gf}())}createSyncEngine(t,e){return function(s,o,a,h,l,f,g){const v=new vm(s,o,a,h,l,f);return g&&(v.gu=!0),v}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await async function(s){const o=F(s);D(Ee,"RemoteStore shutting down."),o.Ia.add(5),await Pn(o),o.Aa.shutdown(),o.Va.set("Unknown")}(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}pi.provider={build:()=>new pi};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gi{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):Bt("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout(()=>{this.muted||t(e)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ie="FirestoreClient";class Mm{constructor(t,e,r,s,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=r,this._databaseInfo=s,this.user=pt.UNAUTHENTICATED,this.clientId=Is.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(r,async a=>{D(ie,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(D(ie,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new jt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const r=oi(e,"Failed to shutdown persistence");t.reject(r)}}),t.promise}}async function _i(n,t){n.asyncQueue.verifyOperationInProgress(),D(ie,"Initializing OfflineComponentProvider");const e=n.configuration;await t.initialize(e);let r=e.initialUser;n.setCredentialChangeListener(async s=>{r.isEqual(s)||(await Tc(t.localStore,s),r=s)}),t.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=t}async function Qc(n,t){n.asyncQueue.verifyOperationInProgress();const e=await Lm(n);D(ie,"Initializing OnlineComponentProvider"),await t.initialize(e,n.configuration),n.setCredentialChangeListener(r=>xc(t.remoteStore,r)),n.setAppCheckTokenChangeListener((r,s)=>xc(t.remoteStore,s)),n._onlineComponents=t}async function Lm(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){D(ie,"Using user provided OfflineComponentProvider");try{await _i(n,n._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!function(s){return s.name==="FirebaseError"?s.code===b.FAILED_PRECONDITION||s.code===b.UNIMPLEMENTED:!(typeof DOMException!="undefined"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(e))throw e;me("Error using user provided cache. Falling back to memory cache: "+e),await _i(n,new Dr)}}else D(ie,"Using default OfflineComponentProvider"),await _i(n,new xm(void 0));return n._offlineComponents}async function Yc(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(D(ie,"Using user provided OnlineComponentProvider"),await Qc(n,n._uninitializedComponentsProvider._online)):(D(ie,"Using default OnlineComponentProvider"),await Qc(n,new pi))),n._onlineComponents}function Fm(n){return Yc(n).then(t=>t.syncEngine)}async function Nr(n){const t=await Yc(n),e=t.eventManager;return e.onListen=Im.bind(null,t.syncEngine),e.onUnlisten=Rm.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=Am.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=Sm.bind(null,t.syncEngine),e}function Um(n,t,e,r){const s=new gi(r),o=new li(t,s,e);return n.asyncQueue.enqueueAndForget(async()=>ai(await Nr(n),o)),()=>{s.Nu(),n.asyncQueue.enqueueAndForget(async()=>ci(await Nr(n),o))}}function Bm(n,t,e={}){const r=new jt;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,h,l,f){const g=new gi({next:R=>{g.Nu(),a.enqueueAndForget(()=>ci(o,v));const P=R.docs.has(h);!P&&R.fromCache?f.reject(new N(b.UNAVAILABLE,"Failed to get document because the client is offline.")):P&&R.fromCache&&l&&l.source==="server"?f.reject(new N(b.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):f.resolve(R)},error:R=>f.reject(R)}),v=new li(fr(h.path),g,{includeMetadataChanges:!0,qa:!0});return ai(o,v)}(await Nr(n),n.asyncQueue,t,e,r)),r.promise}function jm(n,t,e={}){const r=new jt;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,h,l,f){const g=new gi({next:R=>{g.Nu(),a.enqueueAndForget(()=>ci(o,v)),R.fromCache&&l.source==="server"?f.reject(new N(b.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):f.resolve(R)},error:R=>f.reject(R)}),v=new li(h,g,{includeMetadataChanges:!0,qa:!0});return ai(o,v)}(await Nr(n),n.asyncQueue,t,e,r)),r.promise}function qm(n,t){const e=new jt;return n.asyncQueue.enqueueAndForget(async()=>bm(await Fm(n),t,e)),e.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xc(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $m="ComponentProvider",Jc=new Map;function zm(n,t,e,r,s){return new ud(n,t,e,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,Xc(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zc="firestore.googleapis.com",tu=!0;class eu{constructor(t){var e,r;if(t.host===void 0){if(t.ssl!==void 0)throw new N(b.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Zc,this.ssl=tu}else this.host=t.host,this.ssl=(e=t.ssl)!=null?e:tu;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=gc;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<_f)throw new N(b.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}Jl("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Xc((r=t.experimentalLongPollingOptions)!=null?r:{}),function(o){if(o.timeoutSeconds!==void 0){if(isNaN(o.timeoutSeconds))throw new N(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (must not be NaN)`);if(o.timeoutSeconds<5)throw new N(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (minimum allowed value is 5)`);if(o.timeoutSeconds>30)throw new N(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&function(r,s){return r.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class kr{constructor(t,e,r,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new eu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new N(b.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new N(b.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new eu(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new ql;switch(r.type){case"firstParty":return new Hl(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new N(b.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const r=Jc.get(e);r&&(D($m,"Removing Datastore"),Jc.delete(e),r.terminate())}(this),Promise.resolve()}}function Gm(n,t,e,r={}){var f;n=bt(n,kr);const s=No(t),o=n._getSettings(),a=Kn(It({},o),{emulatorOptions:n._getEmulatorOptions()}),h=`${t}:${e}`;s&&bh(`https://${h}`),o.host!==Zc&&o.host!==h&&me("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const l=Kn(It({},o),{host:h,ssl:s,emulatorOptions:r});if(!Yn(l,a)&&(n._setSettings(l),r.mockUserToken)){let g,v;if(typeof r.mockUserToken=="string")g=r.mockUserToken,v=pt.MOCK_USER;else{g=_h(r.mockUserToken,(f=n._app)==null?void 0:f.options.projectId);const R=r.mockUserToken.sub||r.mockUserToken.user_id;if(!R)throw new N(b.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");v=new pt(R)}n._authCredentials=new $l(new ta(g,v))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vn{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new Vn(this.firestore,t,this._query)}}class rt{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new oe(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new rt(this.firestore,t,this._key)}toJSON(){return{type:rt._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,r){if(dn(e,rt._jsonSchema))return new rt(t,r||null,new O(Y.fromString(e.referencePath)))}}rt._jsonSchemaVersion="firestore/documentReference/1.0",rt._jsonSchema={type:et("string",rt._jsonSchemaVersion),referencePath:et("string")};class oe extends Vn{constructor(t,e,r){super(t,e,fr(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new rt(this.firestore,null,new O(t))}withConverter(t){return new oe(this.firestore,t,this._path)}}function yp(n,t,...e){if(n=Pe(n),ra("collection","path",t),n instanceof kr){const r=Y.fromString(t,...e);return ia(r),new oe(n,null,r)}{if(!(n instanceof rt||n instanceof oe))throw new N(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Y.fromString(t,...e));return ia(r),new oe(n.firestore,null,r)}}function Ep(n,t,...e){if(n=Pe(n),arguments.length===1&&(t=Is.newId()),ra("doc","path",t),n instanceof kr){const r=Y.fromString(t,...e);return sa(r),new rt(n,null,new O(r))}{if(!(n instanceof rt||n instanceof oe))throw new N(b.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Y.fromString(t,...e));return sa(r),new rt(n.firestore,n instanceof oe?n.converter:null,new O(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nu="AsyncQueue";class ru{constructor(t=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Sc(this,"async_queue_retry"),this._c=()=>{const r=ti();r&&D(nu,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=t;const e=ti();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=ti();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise(()=>{});const e=new jt;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Yu.push(t),this.lc()))}async lc(){if(this.Yu.length!==0){try{await this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(t){if(!ke(t))throw t;D(nu,"Operation failed with retryable error: "+t)}this.Yu.length>0&&this.M_.p_(()=>this.lc())}}cc(t){const e=this.ac.then(()=>(this.rc=!0,t().catch(r=>{throw this.nc=r,this.rc=!1,Bt("INTERNAL UNHANDLED ERROR: ",su(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=e,e}enqueueAfterDelay(t,e,r){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const s=ii.createAndSchedule(this,t,e,r,o=>this.hc(o));return this.tc.push(s),s}uc(){this.nc&&M(47125,{Pc:su(this.nc)})}verifyOperationInProgress(){}async Tc(){let t;do t=this.ac,await t;while(t!==this.ac)}Ec(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ic(t){return this.Tc().then(()=>{this.tc.sort((e,r)=>e.targetTimeMs-r.targetTimeMs);for(const e of this.tc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Tc()})}Rc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function su(n){let t=n.message||"";return n.stack&&(t=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),t}class ve extends kr{constructor(t,e,r,s){super(t,e,r,s),this.type="firestore",this._queue=new ru,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new ru(t),this._firestoreClient=void 0,await t}}}function Tp(n,t){const e=typeof n=="object"?n:Vl(),r=typeof n=="string"?n:t||ir,s=wl(e,"firestore").getImmediate({identifier:r});if(!s._initialized){const o=ph("firestore");o&&Gm(s,...o)}return s}function Or(n){if(n._terminated)throw new N(b.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||Hm(n),n._firestoreClient}function Hm(n){var r,s,o,a;const t=n._freezeSettings(),e=zm(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,(s=n._app)==null?void 0:s.options.apiKey,t);n._componentsProvider||((o=t.localCache)==null?void 0:o._offlineComponentProvider)&&((a=t.localCache)==null?void 0:a._onlineComponentProvider)&&(n._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),n._firestoreClient=new Mm(n._authCredentials,n._appCheckCredentials,n._queue,e,n._componentsProvider&&function(l){const f=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(f),_online:f}}(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class St{constructor(t){this._byteString=t}static fromBase64String(t){try{return new St(ft.fromBase64String(t))}catch(e){throw new N(b.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new St(ft.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:St._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(dn(t,St._jsonSchema))return St.fromBase64String(t.bytes)}}St._jsonSchemaVersion="firestore/bytes/1.0",St._jsonSchema={type:et("string",St._jsonSchemaVersion),bytes:et("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iu{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new N(b.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new lt(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ou{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new N(b.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new N(b.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return B(this._lat,t._lat)||B(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ft._jsonSchemaVersion}}static fromJSON(t){if(dn(t,Ft._jsonSchema))return new Ft(t.latitude,t.longitude)}}Ft._jsonSchemaVersion="firestore/geoPoint/1.0",Ft._jsonSchema={type:et("string",Ft._jsonSchemaVersion),latitude:et("number"),longitude:et("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(t){this._values=(t||[]).map(e=>e)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(r,s){if(r.length!==s.length)return!1;for(let o=0;o<r.length;++o)if(r[o]!==s[o])return!1;return!0}(this._values,t._values)}toJSON(){return{type:Ct._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(dn(t,Ct._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every(e=>typeof e=="number"))return new Ct(t.vectorValues);throw new N(b.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ct._jsonSchemaVersion="firestore/vectorValue/1.0",Ct._jsonSchema={type:et("string",Ct._jsonSchemaVersion),vectorValues:et("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Km=/^__.*__$/;class Wm{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return this.fieldMask!==null?new ye(t,this.data,this.fieldMask,e,this.fieldTransforms):new wn(t,this.data,e,this.fieldTransforms)}}function au(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw M(40011,{dataSource:n})}}class yi{constructor(t,e,r,s,o,a){this.settings=t,this.databaseId=e,this.serializer=r,this.ignoreUndefinedProperties=s,o===void 0&&this.Ac(),this.fieldTransforms=o||[],this.fieldMask=a||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}i(t){return new yi(It(It({},this.settings),t),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}dc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.i({path:e,arrayElement:!1});return r.mc(t),r}fc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.i({path:e,arrayElement:!1});return r.Ac(),r}gc(t){return this.i({path:void 0,arrayElement:!0})}yc(t){return xr(t,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(t){return this.fieldMask.find(e=>t.isPrefixOf(e))!==void 0||this.fieldTransforms.find(e=>t.isPrefixOf(e.field))!==void 0}Ac(){if(this.path)for(let t=0;t<this.path.length;t++)this.mc(this.path.get(t))}mc(t){if(t.length===0)throw this.yc("Document fields must not be empty");if(au(this.dataSource)&&Km.test(t))throw this.yc('Document fields cannot begin and end with "__"')}}class Qm{constructor(t,e,r){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=r||br(t)}I(t,e,r,s=!1){return new yi({dataSource:t,methodName:e,targetDoc:r,path:lt.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Ym(n){const t=n._freezeSettings(),e=br(n._databaseId);return new Qm(n._databaseId,!!t.ignoreUndefinedProperties,e)}function Xm(n,t,e,r,s,o={}){const a=n.I(o.merge||o.mergeFields?2:0,t,e,s);lu("Data must be an object, but it was:",a,r);const h=uu(r,a);let l,f;if(o.merge)l=new Pt(a.fieldMask),f=a.fieldTransforms;else if(o.mergeFields){const g=[];for(const v of o.mergeFields){const R=Ei(t,v,e);if(!a.contains(R))throw new N(b.INVALID_ARGUMENT,`Field '${R}' is specified in your field mask but missing from your input data.`);tp(g,R)||g.push(R)}l=new Pt(g),f=a.fieldTransforms.filter(v=>l.covers(v.field))}else l=null,f=a.fieldTransforms;return new Wm(new Rt(h),l,f)}function cu(n,t){if(hu(n=Pe(n)))return lu("Unsupported field value:",t,n),uu(n,t);if(n instanceof ou)return function(r,s){if(!au(s.dataSource))throw s.yc(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.yc(`${r._methodName}() is not currently supported inside arrays`);const o=r._toFieldTransform(s);o&&s.fieldTransforms.push(o)}(n,t),null;if(n===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),n instanceof Array){if(t.settings.arrayElement&&t.dataSource!==4)throw t.yc("Nested arrays are not supported");return function(r,s){const o=[];let a=0;for(const h of r){let l=cu(h,s.gc(a));l==null&&(l={nullValue:"NULL_VALUE"}),o.push(l),a++}return{arrayValue:{values:o}}}(n,t)}return function(r,s){if((r=Pe(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return Od(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const o=X.fromDate(r);return{timestampValue:wr(s.serializer,o)}}if(r instanceof X){const o=new X(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:wr(s.serializer,o)}}if(r instanceof Ft)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof St)return{bytesValue:oc(s.serializer,r._byteString)};if(r instanceof rt){const o=s.databaseId,a=r.firestore._databaseId;if(!a.isEqual(o))throw s.yc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${o.projectId}/${o.database}`);return{referenceValue:qs(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof Ct)return function(a,h){const l=a instanceof Ct?a.toArray():a;return{mapValue:{fields:{[Ea]:{stringValue:va},[ar]:{arrayValue:{values:l.map(g=>{if(typeof g!="number")throw h.yc("VectorValues must only contain numeric values.");return Ms(h.serializer,g)})}}}}}}(r,s);if(mc(r))return r._toProto(s.serializer);throw s.yc(`Unsupported field value: ${Rs(r)}`)}(n,t)}function uu(n,t){const e={};return da(n)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):pe(n,(r,s)=>{const o=cu(s,t.dc(r));o!=null&&(e[r]=o)}),{mapValue:{fields:e}}}function hu(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof X||n instanceof Ft||n instanceof St||n instanceof rt||n instanceof ou||n instanceof Ct||mc(n))}function lu(n,t,e){if(!hu(e)||!oa(e)){const r=Rs(e);throw r==="an object"?t.yc(n+" a custom object"):t.yc(n+" "+r)}}function Ei(n,t,e){if((t=Pe(t))instanceof iu)return t._internalPath;if(typeof t=="string")return Zm(n,t);throw xr("Field path arguments must be of type string or ",n,!1,void 0,e)}const Jm=new RegExp("[~\\*/\\[\\]]");function Zm(n,t,e){if(t.search(Jm)>=0)throw xr(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,e);try{return new iu(...t.split("."))._internalPath}catch{throw xr(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,e)}}function xr(n,t,e,r,s){const o=r&&!r.isEmpty(),a=s!==void 0;let h=`Function ${t}() called with invalid data`;e&&(h+=" (via `toFirestore()`)"),h+=". ";let l="";return(o||a)&&(l+=" (found",o&&(l+=` in field ${r}`),a&&(l+=` in document ${s}`),l+=")"),new N(b.INVALID_ARGUMENT,h+n+l)}function tp(n,t){return n.some(e=>e.isEqual(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ep{convertValue(t,e="none"){switch(ne(t)){case 0:return null;case 1:return t.booleanValue;case 2:return tt(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(ee(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw M(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return pe(t,(s,o)=>{r[s]=this.convertValue(o,e)}),r}convertVectorValue(t){var r,s,o;const e=(o=(s=(r=t.fields)==null?void 0:r[ar].arrayValue)==null?void 0:s.values)==null?void 0:o.map(a=>tt(a.doubleValue));return new Ct(e)}convertGeoPoint(t){return new Ft(tt(t.latitude),tt(t.longitude))}convertArray(t,e){return(t.values||[]).map(r=>this.convertValue(r,e))}convertServerTimestamp(t,e){switch(e){case"previous":const r=sr(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(mn(t));default:return null}}convertTimestamp(t){const e=te(t);return new X(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=Y.fromString(t);G(fc(r),9688,{name:t});const s=new pn(r.get(1),r.get(3)),o=new O(r.popFirst(5));return s.isEqual(e)||Bt(`Document ${o} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ti extends ep{constructor(t){super(),this.firestore=t}convertBytes(t){return new St(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new rt(this.firestore,null,e)}}const du="@firebase/firestore",fu="4.14.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mu(n){return function(e,r){if(typeof e!="object"||e===null)return!1;const s=e;for(const o of r)if(o in s&&typeof s[o]=="function")return!0;return!1}(n,["next","error","complete"])}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pu{constructor(t,e,r,s,o){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=s,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new rt(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new np(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var t,e;return(e=(t=this._document)==null?void 0:t.data.clone().value.mapValue.fields)!=null?e:void 0}get(t){if(this._document){const e=this._document.data.field(Ei("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class np extends pu{data(){return super.data()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gu(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new N(b.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}function rp(n,t,e){let r;return r=n?e&&(e.merge||e.mergeFields)?n.toFirestore(t,e):n.toFirestore(t):t,r}class Dn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Ie extends pu{constructor(t,e,r,s,o,a){super(t,e,r,s,a),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Mr(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const r=this._document.data.field(Ei("DocumentSnapshot.get",t));if(r!==null)return this._userDataWriter.convertValue(r,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new N(b.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=Ie._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}Ie._jsonSchemaVersion="firestore/documentSnapshot/1.0",Ie._jsonSchema={type:et("string",Ie._jsonSchemaVersion),bundleSource:et("string","DocumentSnapshot"),bundleName:et("string"),bundle:et("string")};class Mr extends Ie{data(t={}){return super.data(t)}}class Ae{constructor(t,e,r,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new Dn(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach(r=>{t.call(e,new Mr(this._firestore,this._userDataWriter,r.key,r,new Dn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new N(b.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(s,o){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map(h=>{const l=new Mr(s._firestore,s._userDataWriter,h.doc.key,h.doc,new Dn(s._snapshot.mutatedKeys.has(h.doc.key),s._snapshot.fromCache),s.query.converter);return h.doc,{type:"added",doc:l,oldIndex:-1,newIndex:a++}})}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(h=>o||h.type!==3).map(h=>{const l=new Mr(s._firestore,s._userDataWriter,h.doc.key,h.doc,new Dn(s._snapshot.mutatedKeys.has(h.doc.key),s._snapshot.fromCache),s.query.converter);let f=-1,g=-1;return h.type!==0&&(f=a.indexOf(h.doc.key),a=a.delete(h.doc.key)),h.type!==1&&(a=a.add(h.doc),g=a.indexOf(h.doc.key)),{type:sp(h.type),doc:l,oldIndex:f,newIndex:g}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new N(b.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=Ae._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Is.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],r=[],s=[];return this.docs.forEach(o=>{o._document!==null&&(e.push(o._document),r.push(this._userDataWriter.convertObjectMap(o._document.data.value.mapValue.fields,"previous")),s.push(o.ref.path))}),t.bundle=(this._firestore,this.query._query,"NOT SUPPORTED"),t}}function sp(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return M(61501,{type:n})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ae._jsonSchemaVersion="firestore/querySnapshot/1.0",Ae._jsonSchema={type:et("string",Ae._jsonSchemaVersion),bundleSource:et("string","QuerySnapshot"),bundleName:et("string"),bundle:et("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vp(n){n=bt(n,rt);const t=bt(n.firestore,ve),e=Or(t);return Bm(e,n._key).then(r=>yu(t,n,r))}function Ip(n){n=bt(n,Vn);const t=bt(n.firestore,ve),e=Or(t),r=new Ti(t);return gu(n._query),jm(e,n._query).then(s=>new Ae(t,r,n,s))}function Ap(n,t,e){n=bt(n,rt);const r=bt(n.firestore,ve),s=rp(n.converter,t,e),o=Ym(r);return _u(r,[Xm(o,"setDoc",n._key,s,n.converter!==null,e).toMutation(n._key,Mt.none())])}function wp(n){return _u(bt(n.firestore,ve),[new Ls(n._key,Mt.none())])}function Rp(n,...t){var f,g,v;n=Pe(n);let e={includeMetadataChanges:!1,source:"default"},r=0;typeof t[r]!="object"||mu(t[r])||(e=t[r++]);const s={includeMetadataChanges:e.includeMetadataChanges,source:e.source};if(mu(t[r])){const R=t[r];t[r]=(f=R.next)==null?void 0:f.bind(R),t[r+1]=(g=R.error)==null?void 0:g.bind(R),t[r+2]=(v=R.complete)==null?void 0:v.bind(R)}let o,a,h;if(n instanceof rt)a=bt(n.firestore,ve),h=fr(n._key.path),o={next:R=>{t[r]&&t[r](yu(a,n,R))},error:t[r+1],complete:t[r+2]};else{const R=bt(n,Vn);a=bt(R.firestore,ve),h=R._query;const P=new Ti(a);o={next:k=>{t[r]&&t[r](new Ae(a,P,R,k))},error:t[r+1],complete:t[r+2]},gu(n._query)}const l=Or(a);return Um(l,h,s,o)}function _u(n,t){const e=Or(n);return qm(e,t)}function yu(n,t,e){const r=e.docs.get(t._key),s=new Ti(n);return new Ie(n,s,t._key,r,new Dn(e.hasPendingWrites,e.fromCache),t.converter)}(function(t,e=!0){jl(Pl),Xn(new an("firestore",(r,{instanceIdentifier:s,options:o})=>{const a=r.getProvider("app").getImmediate(),h=new ve(new zl(r.getProvider("auth-internal")),new Kl(a,r.getProvider("app-check-internal")),hd(a,s),a);return o=It({useFetchStreams:e},o),h._setSettings(o),h},"PUBLIC").setMultipleInstances(!0)),un(du,fu,t),un(du,fu,"esm2020")})();export{yp as A,vp as B,an as C,Ep as D,Vo as E,be as F,Ap as G,Rp as H,wp as I,ko as L,Pl as S,Rl as _,Pe as a,lp as b,Xn as c,Vl as d,wl as e,mh as f,ap as g,hp as h,cp as i,pp as j,Yn as k,No as l,dp as m,q as n,op as o,bh as p,cs as q,un as r,uh as s,mp as t,up as u,fp as v,gp as w,Cl as x,Tp as y,Ip as z};
