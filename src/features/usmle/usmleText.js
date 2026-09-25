// Presentation only: preserve source wording, punctuation and existing line breaks.
// Some source exports flatten whole vignettes, including sentence delimiters.
// Split only at explicit sentence/clinical-section openings, never at every capital
// letter (which would split drug names, abbreviations, units and laboratory values).
const paragraphOpening = /[\t ]+(?=(?:The symptoms? (?:occur|began|started|developed|are|is|were|was)|(?:He|She) (?:has|had|reports|denies|takes|underwent)|(?:His|Her) (?:medical history|past medical history|medications|temperature|blood pressure)|(?:Physical examination|On physical examination|On examination|Examination|Cardiac examination|Cardiovascular examination|Laboratory studies|Laboratory results|Laboratory testing|An electrocardiogram|Electrocardiography|Echocardiography|Radial pulses)\b|The patient (?:most likely|is most likely|is most appropriately)|(?:Which|What) (?:of the following|is the most|is the likely|is the best)))/g;

export function formatUsmleStatement(value = '') {
  const source = String(value);
  // Authored formatting has priority over inferred paragraph boundaries.
  if (/[\r\n]/.test(source)) return source;
  return source.replace(paragraphOpening,'\n\n');
}
