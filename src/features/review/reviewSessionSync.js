import { isReviewQueueItemScheduled } from '../../services/reviewScheduler.js';

const sessionItemKey = item => item?.item?.cardKey
  || `${item?.aulaId}/${item?.blockId}/${item?.qId}`;

export const reconcileReviewSessionWithQueue = (session, queue, now = Date.now()) => {
  if (!session || !Array.isArray(session.items) || !session.items.length) return session;

  const currentKey = sessionItemKey(session.items[session.index]);
  let changed = false;
  const items = session.items.flatMap(row => {
    const key = sessionItemKey(row);
    const answeredInSession = Object.prototype.hasOwnProperty.call(session.sessionAnswers || {}, key);
    const latestItem = queue?.[row.aulaId]?.[row.blockId]?.[row.qId] || null;

    if (answeredInSession) return [row];
    if (!isReviewQueueItemScheduled(latestItem) || Number(latestItem.dueDate) > now) {
      changed = true;
      return [];
    }
    if (latestItem !== row.item) {
      changed = true;
      return [{ ...row, item:latestItem }];
    }
    return [row];
  });

  if (!changed) return session;
  if (!items.length) return null;
  const preservedIndex = items.findIndex(item => sessionItemKey(item) === currentKey);
  return {
    ...session,
    items,
    index:preservedIndex >= 0 ? preservedIndex : Math.min(session.index, items.length - 1),
  };
};
