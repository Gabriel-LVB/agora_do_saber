const MAX_IMAGE_DIMENSION = 2400;
const MIN_IMAGE_DIMENSION = 900;

const canvasToBlob = (canvas, type, quality) => new Promise((resolve,reject) => {
  canvas.toBlob(blob => blob
    ? resolve(blob)
    : reject(new Error('O navegador não conseguiu compactar a imagem.')),type,quality);
});

const loadImage = async (bytes, mimeType) => {
  const blob = new Blob([bytes],{ type:mimeType });
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    return { drawable:bitmap, width:bitmap.width, height:bitmap.height, release:() => bitmap.close?.() };
  }
  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Este ambiente não consegue compactar imagens automaticamente.');
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve,reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('A imagem não pôde ser aberta para compactação.'));
      image.src = objectUrl;
    });
    return {
      drawable:image,
      width:image.naturalWidth,
      height:image.naturalHeight,
      release:() => URL.revokeObjectURL(objectUrl),
    };
  } catch(error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
};

export async function optimizeQuestionImage({ bytes, mimeType, file, maxBytes }) {
  let source;
  try {
    source = await loadImage(bytes,mimeType);
    if (!source.width || !source.height) throw new Error('A imagem não possui dimensões válidas.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d',{ alpha:true });
    if (!context) throw new Error('O navegador não disponibilizou o compactador de imagens.');
    let scale = Math.min(1,MAX_IMAGE_DIMENSION / Math.max(source.width,source.height));
    const qualities = [0.92,0.84,0.76,0.68];
    while (true) {
      canvas.width = Math.max(1,Math.round(source.width * scale));
      canvas.height = Math.max(1,Math.round(source.height * scale));
      context.clearRect(0,0,canvas.width,canvas.height);
      context.drawImage(source.drawable,0,0,canvas.width,canvas.height);
      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas,'image/webp',quality);
        if (blob.size <= maxBytes) {
          const optimizedMimeType = blob.type || 'image/webp';
          const optimizedExtension = optimizedMimeType === 'image/png'
            ? '.png'
            : optimizedMimeType === 'image/jpeg' ? '.jpg' : '.webp';
          return {
            bytes:new Uint8Array(await blob.arrayBuffer()),
            mimeType:optimizedMimeType,
            fileName:file.split('/').pop().replace(/\.[^.]+$/,optimizedExtension),
          };
        }
      }
      const currentMaxDimension = Math.max(source.width * scale,source.height * scale);
      if (currentMaxDimension <= MIN_IMAGE_DIMENSION) break;
      scale *= Math.max(MIN_IMAGE_DIMENSION,currentMaxDimension * 0.82) / currentMaxDimension;
    }
  } catch(error) {
    throw new Error(`A imagem “${file}” não pôde ser compactada automaticamente. ${error?.message || ''}`.trim());
  } finally {
    source?.release?.();
  }
  throw new Error(`A imagem “${file}” continuou grande demais após a compactação automática. Reduza suas dimensões e tente novamente.`);
}
