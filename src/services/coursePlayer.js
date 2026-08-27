const PLAYER_JS_CONTEXT = 'player.js';
const PLAYER_JS_VERSION = '0.0.11';

const parseMessage = raw => {
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch(error) { return null; }
};

const objectValue = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const buildCoursePlayerSrc = ({ embedUrl, alternate = false, startAt = null } = {}) => {
  const rawUrl = String(embedUrl || '').trim();
  if (!rawUrl) return '';
  const selectedUrl = alternate
    ? rawUrl.replace('iframe.mediadelivery.net', 'player.mediadelivery.net')
    : rawUrl;
  try {
    const url = new URL(selectedUrl);
    // Estes parâmetros são deliberadamente estáveis durante toda a reprodução.
    // Alterá-los conforme o effectiveType oscila faz o navegador recarregar o iframe.
    url.searchParams.set('preload', 'false');
    url.searchParams.set('autoplay', 'false');
    const seconds = Number(startAt);
    if (Number.isFinite(seconds) && seconds > 0) url.searchParams.set('t', String(Math.floor(seconds)));
    else url.searchParams.delete('t');
    return url.toString();
  } catch(error) {
    const query = ['preload=false', 'autoplay=false'];
    const seconds = Number(startAt);
    if (Number.isFinite(seconds) && seconds > 0) query.push(`t=${Math.floor(seconds)}`);
    return `${selectedUrl}${selectedUrl.includes('?') ? '&' : '?'}${query.join('&')}`;
  }
};

export const readCoursePlayerEvent = raw => {
  const message = objectValue(parseMessage(raw));
  if (!Object.keys(message).length) return null;
  const data = objectValue(message.data);
  const value = objectValue(message.value);
  const nestedData = objectValue(data.data);
  const nestedValue = objectValue(data.value);
  const payload = { ...message, ...data, ...value, ...nestedData, ...nestedValue };
  const eventName = String(data.event || message.event || payload.type || payload.name || '').toLowerCase();
  const seconds = Number(payload.seconds ?? payload.currentTime ?? payload.time ?? payload.position);
  const duration = Number(payload.duration ?? payload.durationSeconds ?? payload.totalTime ?? payload.totalDuration);
  const ended = payload.ended === true || /\b(ended|finish|finished|complete|completed)\b/.test(eventName);
  return {
    eventName,
    seconds:Number.isFinite(seconds) ? seconds : null,
    duration:Number.isFinite(duration) ? duration : null,
    ended,
  };
};

export const coursePlayerSubscriptionMessages = eventName => [
  { event:'command', func:'addEventListener', args:[eventName] },
  {
    context:PLAYER_JS_CONTEXT,
    version:PLAYER_JS_VERSION,
    method:'addEventListener',
    value:eventName,
    listener:`agora-${eventName}`,
  },
];

export const coursePlayerSeekMessages = seconds => {
  const target = Number(seconds);
  if (!Number.isFinite(target) || target <= 0) return [];
  return [
    { event:'command', func:'setCurrentTime', args:[target] },
    {
      context:PLAYER_JS_CONTEXT,
      version:PLAYER_JS_VERSION,
      method:'setCurrentTime',
      value:target,
      listener:'agora-resume',
    },
  ];
};
