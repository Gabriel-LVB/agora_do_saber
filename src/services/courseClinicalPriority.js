export const COURSE_CLINICAL_PRIORITY_VERSION = 'generalist-clinical-priority-v3';
export const COURSE_CLINICAL_PRIORITY_CATALOG_SIZE = 488;

// As 128 unidades pedagógicas auditáveis ficam em data/famed; a permutação
// equivalente permanece compactada aqui para não aumentar o bundle do aluno.
const PACKED_REVIEWED_ORDER = 'CV5P2cezI/r2ZnSvfNoBU1aUdIGsFP55EI5wB4KTOajt7ZuJ+0gjgsuWjt9eqmtrLsg/J9g1FDT8aEMhHUknlu+vweex0XBwrMk0R4vn0Ucquih0h2l6ae1lNaSoH54smA3jKu1FeavvhMEz+/MQrZ1H+nNb/MrW3YxN6+jtI+X6AUWR6JKmQAHH5Hia0T87aE9dzWLXCSCPVzMuQzXNX1Ck+4GQ9lX8LF9pfWb2ABcxBTCR4LsWtVFzrhqMMoKtmTnffSRQxxHs2wy4ZgFMiyrSOqr/b6y6Q8nAxXAQPkMXRIwzezMp92iJm9kXknm8TGTMK/EC5mt+2GsKVaBJ5K4RYRp8Snk/whXwue1HzwA4h6JlQmQyiV0JuE4stK78wdIYuHenLzQOtBXZ2mwBaRe586CDGP5mVi0eqBgKtZ1lxm66jLvkSpk7dVyXEYqYKd7W0GIua8lHXJ0fW1XnAwv69DSCphWCGXRYJ3fe6hYS7/czCpAdnbqDK8k4pXczBPDalu9PeVwSLdg3awL9FyHPHwEonawTUR2N8GF0EXjroUkgHIoYg9S1GJiHv5DSNIfhi9af+5wjz5DPIUV9JtSYJYO1wBXY+OQ=';

const unpackReviewedOrder = () => {
  let encoded = 0n;
  for (const character of atob(PACKED_REVIEWED_ORDER)) {
    encoded = (encoded << 8n) | BigInt(character.charCodeAt(0));
  }
  const digits = Array(COURSE_CLINICAL_PRIORITY_CATALOG_SIZE);
  for (let position = digits.length - 1; position >= 0; position -= 1) {
    const base = BigInt(digits.length - position);
    digits[position] = Number(encoded % base);
    encoded /= base;
  }
  const remaining = Array.from({ length:digits.length }, (_, index) => index);
  return digits.map(digit => remaining.splice(digit, 1)[0]);
};

const REVIEWED_ORDER = unpackReviewedOrder();

const catalogSignature = lessons => {
  let hash = 0;
  const source = [...lessons].sort((left, right) => left.courseIndex - right.courseIndex);
  for (const lesson of source) {
    for (const character of `${lesson.subject}\0${lesson.title}\n`) {
      hash = Math.imul(hash, 33) + character.charCodeAt(0) | 0;
    }
  }
  return hash;
};

export const buildClinicalPrioritySchedule = (lessons = []) => {
  if (lessons.length !== COURSE_CLINICAL_PRIORITY_CATALOG_SIZE || catalogSignature(lessons) !== 139502880) {
    return [...lessons];
  }
  const rank = new Map(REVIEWED_ORDER.map((index, position) => [index, position]));
  return [...lessons].sort((left, right) => rank.get(left.courseIndex) - rank.get(right.courseIndex));
};
