import React from 'react';

export default function QuickLessonContent({ lesson='', darkMode=false, renderText }) {
  const lines = String(lesson || '').replace(/\*/g, '').split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] || '';
    const line = raw.trim();
    const heading = line.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      elements.push(
        <h3 key={`qh-${i}`} className={`text-base font-bold mt-6 mb-2 ${darkMode?'text-yellow-300':'text-yellow-700'}`}>
          {renderText(heading[1].trim())}
        </h3>
      );
      i++;
      continue;
    }

    if (/^\s*[-•](?:\s+|$)/.test(raw)) {
      const items = [];
      const isListLine = (value = '') => /^\s*[-•](?:\s+|$)/.test(value);
      const isBoundary = (value = '') => {
        const trimmed = value.trim();
        return !trimmed || /^#{2,4}\s+/.test(trimmed);
      };
      while (i < lines.length && isListLine(lines[i] || '')) {
        const match = (lines[i] || '').match(/^\s*[-•](?:\s+(.*)|\s*)$/);
        const itemText = (match?.[1] || '').trim();
        const continuation = [];
        let j = i + 1;
        while (j < lines.length && !isListLine(lines[j] || '') && !isBoundary(lines[j] || '')) {
          continuation.push((lines[j] || '').trim());
          j++;
        }
        items.push([itemText, ...continuation].filter(Boolean).join(' '));
        i = j;
      }
      elements.push(
        <div key={`qul-${i}`} className={`space-y-1.5 my-3 text-base ${darkMode?'text-gray-200':'text-gray-800'}`}>
          {items.map((item, index)=>(
            <div key={index} className="flex items-start gap-3">
              <span className="flex flex-shrink-0 items-center justify-center" style={{width:'0.875rem', height:'1.625rem'}}>
                <span className="rounded-full bg-current" style={{width:'0.4375rem', height:'0.4375rem'}}/>
              </span>
              <span className="min-w-0 leading-relaxed">{renderText(item)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    if (!line) {
      elements.push(<div key={`qsp-${i}`} className="h-2"/>);
      i++;
      continue;
    }
    elements.push(
      <p key={`qp-${i}`} className={`text-base leading-relaxed ${darkMode?'text-gray-200':'text-gray-800'}`}>
        {renderText(line)}
      </p>
    );
    i++;
  }

  return elements;
}
