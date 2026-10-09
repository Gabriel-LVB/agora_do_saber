const EXPORT_QUESTION_TAG_RE = /\(\(\s*([^()\r\n]+?)\s*\)\)/g;

export const extractQuestionExportTags = (value = '') => {
  const tags = [];
  const text = String(value || '')
    .replace(EXPORT_QUESTION_TAG_RE, (_,label) => {
      const tag = String(label || '').trim();
      if (tag && !tags.includes(tag)) tags.push(tag);
      return '';
    })
    .replace(/[ \t]{2,}/g,' ')
    .replace(/[ \t]*\n[ \t]*/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .replace(/\s+([,.;:!?])/g,'$1')
    .trim();
  return { text,tags };
};
