import { strFromU8, unzipSync } from 'fflate';

export const FAMED_QUESTION_PACKAGE_SCHEMA = 'agora-famed-question-package-v1';

const QUESTIONS_FILE = 'questions.json';
const IMAGE_MIME_TYPES = {
  gif:'image/gif',
  jpeg:'image/jpeg',
  jpg:'image/jpeg',
  png:'image/png',
  webp:'image/webp',
};
const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;

const normalizePath = value => String(value || '').trim().replace(/\\/g,'/').replace(/^\.\//,'');
const isSafeRelativePath = value => {
  const path = normalizePath(value);
  return !!path && !path.startsWith('/') && !/^[a-z]:\//i.test(path) && !path.split('/').includes('..');
};
const extensionOf = value => normalizePath(value).split('.').pop()?.toLowerCase() || '';
const cleanText = value => String(value ?? '').trim();
const safeIdPart = value => cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'item';

const bytesToDataUrl = (bytes, mimeType) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index,index + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
};

const readBytes = async input => {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input?.arrayBuffer) return new Uint8Array(await input.arrayBuffer());
  throw new Error('Selecione um arquivo ZIP válido.');
};

const normalizeOption = (option, index) => {
  if (!option || typeof option !== 'object' || Array.isArray(option)) {
    throw new Error('Cada alternativa deve ser um objeto com letter, text e isCorrect.');
  }
  const letter = cleanText(option.letter || String.fromCharCode(65 + index)).toUpperCase();
  const text = cleanText(option.text);
  if (!text) throw new Error(`A alternativa ${letter} está sem texto.`);
  return {
    letter,
    text,
    isCorrect:option.isCorrect === true,
    explanation:cleanText(option.explanation),
  };
};

const normalizeQuestion = (question, index, namespace, files, assetsByPath) => {
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    throw new Error(`A questão ${index + 1} não é um objeto válido.`);
  }
  const statement = cleanText(question.statement);
  if (!statement) throw new Error(`A questão ${index + 1} está sem enunciado.`);
  const rawId = safeIdPart(question.id || `q-${index + 1}`);
  const options = Array.isArray(question.options) ? question.options.map(normalizeOption) : [];
  const isEssay = question.isEssay === true;
  const isOpen = isEssay || question.isOpen === true || options.length === 0;
  const expectedAnswer = cleanText(question.expectedAnswer);
  if (!isOpen && options.filter(option => option.isCorrect).length !== 1) throw new Error(`A questão ${index + 1} precisa ter exatamente uma alternativa correta.`);
  if (isOpen && options.length) throw new Error(`A questão aberta ${index + 1} deve usar options: [].`);
  if (isOpen && !expectedAnswer) throw new Error(`A questão aberta ${index + 1} está sem expectedAnswer.`);
  const images = (Array.isArray(question.images) ? question.images : []).map((image, imageIndex) => {
    const descriptor = typeof image === 'string' ? { file:image } : image;
    const file = normalizePath(descriptor?.file);
    if (!isSafeRelativePath(file) || !file.startsWith('images/')) {
      throw new Error(`A imagem ${imageIndex + 1} da questão ${index + 1} deve estar dentro da pasta images/.`);
    }
    const bytes = files[file];
    if (!bytes) throw new Error(`A imagem “${file}” citada na questão ${index + 1} não existe no ZIP.`);
    const extension = extensionOf(file);
    const mimeType = IMAGE_MIME_TYPES[extension];
    if (!mimeType) throw new Error(`A imagem “${file}” usa um formato não aceito.`);
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`A imagem “${file}” está grande demais para ser salva. Comprima-a e gere o pacote novamente.`);
    if (!assetsByPath.has(file)) {
      assetsByPath.set(file, {
        file,
        fileName:file.split('/').pop(),
        mimeType,
        byteLength:bytes.length,
        dataUrl:bytesToDataUrl(bytes,mimeType),
      });
    }
    return {
      file,
      altText:cleanText(descriptor?.altText) || 'Imagem necessária para responder à questão',
      credit:cleanText(descriptor?.credit),
    };
  });
  return {
    id:`${safeIdPart(namespace)}_${rawId}`,
    statement,
    caseContext:cleanText(question.caseContext),
    options,
    explanation:cleanText(question.explanation),
    expectedAnswer,
    isOpen,
    isEssay,
    libraryQuestionKind:'old_exam',
    images,
  };
};

export const parseFamedQuestionPackage = async (input, namespace='famed-past') => {
  const zipBytes = await readBytes(input);
  if (!zipBytes.length || zipBytes.length > MAX_PACKAGE_BYTES) throw new Error('O pacote ZIP está vazio ou grande demais para ser processado com segurança.');
  let rawFiles;
  let rejectedEntry = '';
  let uncompressedBytes = 0;
  try {
    rawFiles = unzipSync(zipBytes,{
      filter:entry => {
        const path = normalizePath(entry.name);
        if (!isSafeRelativePath(path)) {
          rejectedEntry = `O ZIP contém um caminho inseguro: “${entry.name}”.`;
          return false;
        }
        uncompressedBytes += Number(entry.originalSize) || 0;
        if (uncompressedBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
          rejectedEntry = 'O conteúdo descompactado é grande demais para ser processado com segurança.';
          return false;
        }
        if (path.startsWith('images/') && (Number(entry.originalSize) || 0) > MAX_IMAGE_BYTES) {
          rejectedEntry = `A imagem “${path}” está grande demais para ser salva. Comprima-a e gere o pacote novamente.`;
          return false;
        }
        return true;
      },
    });
  } catch(error) {
    throw new Error('Não foi possível abrir o ZIP. Gere o pacote novamente sem senha.');
  }
  if (rejectedEntry) throw new Error(rejectedEntry);
  const files = Object.create(null);
  Object.entries(rawFiles).forEach(([rawPath,bytes]) => {
    const path = normalizePath(rawPath);
    if (!isSafeRelativePath(path)) throw new Error(`O ZIP contém um caminho inseguro: “${rawPath}”.`);
    files[path] = bytes;
  });
  if (!files[QUESTIONS_FILE]) throw new Error(`O ZIP precisa conter ${QUESTIONS_FILE} na raiz.`);
  let payload;
  try {
    payload = JSON.parse(strFromU8(files[QUESTIONS_FILE]));
  } catch(error) {
    throw new Error('O arquivo questions.json não contém JSON válido.');
  }
  if (payload?.schema !== FAMED_QUESTION_PACKAGE_SCHEMA) {
    throw new Error(`O campo schema deve ser “${FAMED_QUESTION_PACKAGE_SCHEMA}”.`);
  }
  if (!Array.isArray(payload.questions) || !payload.questions.length) throw new Error('O pacote não contém questões.');
  const assetsByPath = new Map();
  const questions = payload.questions.map((question,index) => normalizeQuestion(question,index,namespace,files,assetsByPath));
  if (new Set(questions.map(question => question.id)).size !== questions.length) throw new Error('O pacote contém IDs de questões repetidos.');
  const assets = [...assetsByPath.values()];
  const totalImageBytes = assets.reduce((total,asset)=>total + asset.byteLength,0);
  if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) throw new Error('As imagens do pacote estão grandes demais em conjunto. Comprima-as e gere o ZIP novamente.');
  return {
    schema:FAMED_QUESTION_PACKAGE_SCHEMA,
    title:cleanText(payload.title),
    questions,
    assets,
  };
};
