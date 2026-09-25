import { validateUsmlePackage } from './usmleModel.js';

const mimeFor = path => ({ jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', m4a:'audio/mp4' }[path.split('.').pop().toLowerCase()]);
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), b => b.toString(16).padStart(2,'0')).join('');
export const assetId = path => path.replace(/[^a-zA-Z0-9_-]/g,'_');

export async function readUsmleZip(file, step) {
  if (file.size > 90 * 1024 * 1024) throw new Error('O ZIP deve ter até 90 MB. Divida bancos maiores por matéria.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { unzip } = await import('fflate');
  let total = 0, rejected = false;
  const files = await new Promise((resolve,reject) => unzip(bytes, {
    filter:entry => {
      total += entry.originalSize;
      if (entry.originalSize > 40 * 1024 * 1024 || total > 180 * 1024 * 1024) { rejected = true; return false; }
      return entry.name === 'questions.json' || /^(images|audio)\/[a-zA-Z0-9_.-]+$/.test(entry.name);
    },
  }, (error,result) => error ? reject(new Error('Não foi possível abrir o ZIP. Verifique se o arquivo está íntegro.')) : resolve(result)));
  if (rejected) throw new Error('O conteúdo descompactado excede o limite seguro do importador.');
  if (!files['questions.json']) throw new Error('Não foi encontrado questions.json na raiz do ZIP.');
  const parsed = validateUsmlePackage(JSON.parse(new TextDecoder().decode(files['questions.json'])),step);
  const paths = [...new Set([
    ...parsed.questions.flatMap(q => [...q.images,...q.audio].map(a => a.file)),
    ...Object.keys(files).filter(path => /^(images|audio)\//.test(path) && mimeFor(path)),
  ])];
  if (new Set(paths.map(assetId)).size !== paths.length) throw new Error('Dois arquivos têm nomes que geram o mesmo identificador. Renomeie-os e atualize as referências.');
  const assets = paths.map(path => {
    const data = files[path];
    if (!data?.length) throw new Error(`Arquivo ausente no ZIP: ${path}`);
    if (data.length > 650000) throw new Error(`Arquivo acima de 650 KB: ${path}. Comprima-o antes de importar.`);
    const mime = mimeFor(path);
    if (mime.startsWith('image/') && !(
      (mime === 'image/jpeg' && data[0] === 255 && data[1] === 216) ||
      (mime === 'image/png' && data[0] === 137 && data[1] === 80) ||
      (mime === 'image/webp' && new TextDecoder().decode(data.slice(0,4)) === 'RIFF')
    )) throw new Error(`Imagem inválida: ${path}`);
    let binary = '';
    for (let i = 0; i < data.length; i += 8192) binary += String.fromCharCode(...data.subarray(i,i+8192));
    return { id:assetId(path), path, dataUrl:`data:${mime};base64,${btoa(binary)}` };
  });
  const slug = parsed.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
  const release = (await digest(bytes)).slice(0,24);
  return { ...parsed, id:`${step}-${slug}`, release, assets, fileName:file.name };
}

export function buildQuestionChunks(questions) {
  const chunks = [];
  let current = [], size = 0;
  for (const question of questions) {
    const bytes = new TextEncoder().encode(JSON.stringify(question)).length;
    if (bytes > 500000) throw new Error(`Questão ${question.id} excede o tamanho permitido.`);
    if (current.length && (size + bytes > 500000 || current.length >= 30)) { chunks.push(current); current = []; size = 0; }
    current.push(question); size += bytes;
  }
  if (current.length) chunks.push(current);
  return chunks.map((items,index) => ({ id:`chunk_${String(index).padStart(4,'0')}`, questions:items }));
}
