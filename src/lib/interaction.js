export const deferInteractionWork = (task) => new Promise((resolve, reject) => {
  const run = () => Promise.resolve()
    .then(task)
    .then(resolve, reject);
  if (
    typeof window === 'undefined'
    || typeof window.requestAnimationFrame !== 'function'
    || (typeof document !== 'undefined' && document.visibilityState === 'hidden')
  ) {
    setTimeout(run, 0);
    return;
  }
  window.requestAnimationFrame(() => setTimeout(run, 0));
});
