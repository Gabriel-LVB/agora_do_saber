import React from 'react';

export default function BrandIdentity({ variant='compact', showMark=true, showTagline=true }) {
  const label = showTagline ? 'Ágora do Saber — Lux in tenebris' : 'Ágora do Saber';
  return (
    <span className={`agora-brand agora-brand--${variant}`} aria-label={label}>
      {showMark&&<span className="agora-brand__mark" aria-hidden="true">
        <img src="/brand/agora-brand-circle.png" alt=""/>
      </span>}
      <span className="agora-brand__copy">
        <strong className="agora-brand__name"><span>Ágora</span><span>do Saber</span></strong>
        {showTagline&&<span className="agora-brand__tagline"><i/><span>Lux in tenebris</span><i/></span>}
      </span>
    </span>
  );
}
