import { buildQuestionBankSizingReport } from '../services/questionBankSizing.js';

self.onmessage = event => {
  if (event.data?.type !== 'calculate') return;
  try {
    const report = buildQuestionBankSizingReport({
      sharedLibraryItems:event.data.sharedLibraryItems || [],
      disabledCourseQuestions:event.data.disabledCourseQuestions || [],
      onProgress:progress => self.postMessage({ type:'progress', progress }),
    });
    self.postMessage({ type:'complete', report });
  } catch(error) {
    self.postMessage({
      type:'error',
      error:error?.message || 'Não foi possível dimensionar o banco.',
    });
  }
};
