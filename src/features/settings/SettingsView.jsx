import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function SettingsView() {
  const {
    accessAdminError,
    accessAdminLastRefresh,
    accessLogs,
    accessLogsLoading,
    addToast,
    addToSiteOnlyWhitelist,
    addToWhitelist,
    ADMIN_EMAIL,
    applyCourseOrgProposalToPlan,
    ArrowLeft,
    BookOpen,
    CalendarCheck,
    canSeeVideoaulas,
    canUseAdvancedFeatures,
    clearCourseCatalogKeyStats,
    COURSE_CATALOG_ADMIN_ENABLED,
    courseAllowedEmails,
    courseCatalogLogRef,
    courseCatalogRun,
    courseCatalogStats,
    courseOrgProposalUsesOriginalSubjects,
    courseOrgRun,
    courseOrgSelectedSubject,
    darkMode,
    DEFAULT_COURSE_CATALOG_DELAY_SECONDS,
    displayCourseOrgProposal,
    FileText,
    FONT_SCALE_OPTIONS,
    fontScale,
    GeminiThinkingSelector,
    getActiveGeminiKeyId,
    getGeminiKeyRows,
    globalAllowedEmails,
    handleLogout,
    HomeMottoEditor,
    isAdmin,
    Key,
    Landmark,
    listCourseOriginalSubjects,
    LogOut,
    makeGeminiKeyId,
    MessageCircle,
    moveCourseToSiteOnly,
    moveSiteOnlyToCourse,
    newSiteWhitelistEmail,
    newWhitelistEmail,
    normalizeGeminiKeys,
    ORACLE_LENGTH,
    originalSubjectOptions,
    pauseCourseCatalogAnalysis,
    PlusIcon,
    refreshAdminAccessData,
    refreshCourseCatalogStats,
    removeFromSiteOnlyWhitelist,
    removeFromWhitelist,
    restoreReturnTarget,
    resumeCourseCatalogAnalysis,
    RotateCcw,
    saveSettings,
    saveSiteConfig,
    setCourseOrgSelectedSubject,
    setNewSiteWhitelistEmail,
    setNewWhitelistEmail,
    setResetCourseInput,
    setResetCourseModal,
    setSettings,
    settings,
    SettingsIcon,
    settingsRef,
    SettingsSection,
    setView,
    siteConfig,
    siteOnlyAccessEmails,
    ShieldAlert,
    Sparkles,
    Spinner,
    startCourseCatalogAnalysis,
    startCourseOrganizationProposal,
    stopCourseCatalogAnalysis,
    Trash2,
    user,
    userDevices,
    UserIcon,
    username,
    withGeminiKeys,
  } = useFeatureContext();
  return (
          <div className="max-w-3xl mx-auto space-y-6" style={{overflowAnchor:'none'}}>
            <div className="app-hero rounded-2xl p-5 md:p-6 flex items-center gap-4 mb-8">
              <button onClick={()=>restoreReturnTarget('library')} className={`h-11 w-11 rounded-xl border flex items-center justify-center ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-white'}`}><ArrowLeft className="w-5 h-5"/></button>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Preferências</p>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">Configurações</h2>
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>
                {isAdmin ? 'Configurações da sua conta' : 'Configurações da conta'}
              </p>
              <h3 className="text-xl font-serif font-bold mt-1">Preferências pessoais</h3>
            </div>
            {/* API Keys */}
            <SettingsSection id="api" title="Chaves API (Gemini)" icon={<Key className="w-4 h-4"/>} collapsible>
              <div className={`p-3 rounded-xl mb-3 text-xs leading-relaxed ${darkMode?'bg-blue-900/20 border border-blue-800/40 text-blue-300':'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                <p className="font-bold mb-1">ℹ️ Sobre as chaves</p>
                <p>Os limites variam por modelo, projeto e plano. Você pode cadastrar mais de uma chave autorizada para o site alternar automaticamente.</p>
                <p className="mt-1 opacity-80">Chaves padrão antigas (`AIza...`) e novas chaves de autorização são aceitas.</p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold block mt-1">Criar nova chave gratuita →</a>
              </div>
              {(() => {
                const rows = getGeminiKeyRows(settings);
                const activeId = getActiveGeminiKeyId(settings);
                const updateRow = (idx, field, value) => {
                  const baseRows = getGeminiKeyRows(settingsRef.current);
                  const updated = baseRows.map((row, i) => i === idx
                    ? { ...row, id:row.isNew ? makeGeminiKeyId() : row.id, isNew:false, name:`Chave ${idx + 1}`, [field]:value }
                    : row
                  ).filter(row => !row.isNew);
                  setSettings(withGeminiKeys(settingsRef.current, updated));
                };
                const removeRow = (idx) => {
                  const baseRows = getGeminiKeyRows(settingsRef.current);
                  const updated = baseRows.filter((row, i) => i !== idx && !row.isNew);
                  saveSettings(withGeminiKeys(settingsRef.current, updated));
                };
                return rows.map((row, idx) => {
                  const disabled = !row.value.trim();
                  const canRemove = rows.filter(r => !r.isNew).length > 1 && !row.isNew;
                  return (
                    <div key={row.id} className={`mb-3 rounded-xl border p-3 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="ak" checked={!disabled && activeId===row.id} onChange={()=>saveSettings(withGeminiKeys(settingsRef.current, normalizeGeminiKeys(settingsRef.current), row.id))} disabled={disabled} className="w-5 h-5 accent-yellow-600 disabled:opacity-30 flex-shrink-0"/>
                        <input type="text" value={row.value||''} onChange={e=>updateRow(idx,'value',e.target.value)} onBlur={()=>saveSettings(settingsRef.current)} placeholder={`Chave Gemini ${idx + 1}...`} className={`flex-1 min-w-0 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}/>
                        {canRemove&&(
                          <button type="button" onClick={()=>removeRow(idx)} title="Remover chave" aria-label={`Remover chave Gemini ${idx + 1}`} className={`p-2 rounded-lg ${darkMode?'text-gray-500 hover:text-red-400 hover:bg-gray-700':'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}>
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </SettingsSection>
            <SettingsSection id="gemini-thinking" title="Modo Gemini" icon={<Sparkles className="w-4 h-4"/>}>
              <GeminiThinkingSelector
                value={!!settings.geminiThinkingEnabled}
                onChange={enabled=>saveSettings({...settingsRef.current, geminiThinkingEnabled:enabled})}
                darkMode={darkMode}
              />
              <p className={`text-xs mt-3 leading-relaxed ${darkMode?'text-gray-500':'text-gray-400'}`}>
                Rápido usa `thinkingBudget: 0`. Thinking usa `thinkingBudget: -1`, deixando o Gemini decidir quando raciocinar mais.
              </p>
            </SettingsSection>
            {/* Oracle Length */}
            <SettingsSection id="chat" title="Resposta do Chat" icon={<MessageCircle className="w-4 h-4"/>}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(ORACLE_LENGTH).map(([k,c])=>(
                  <button key={k} onClick={()=>{const ns={...settings,oracleLength:k};setSettings(ns);saveSettings(ns);}}
                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${settings.oracleLength===k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                    {c.label}
                  </button>
                ))}
	              </div>
            </SettingsSection>
            <SettingsSection id="font" title="Tamanho da fonte" icon={<SettingsIcon className="w-4 h-4"/>}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {FONT_SCALE_OPTIONS.map(opt=>(
                  <button
                    key={opt.value}
                    onClick={()=>saveSettings({...settingsRef.current,fontScale:opt.value})}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${fontScale===opt.value?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className="block text-xs opacity-50 mt-0.5">{opt.value}%</span>
                  </button>
                ))}
              </div>
              <div className={`rounded-xl border p-4 ${darkMode?'bg-gray-900 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-bold">Ajuste fino</span>
                  <span className="text-sm font-serif font-bold text-yellow-600 tabular-nums">{fontScale}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="130"
                  step="1"
                  value={fontScale}
                  onChange={e=>setSettings({...settingsRef.current,fontScale:Number(e.target.value)})}
                  onMouseUp={()=>saveSettings(settingsRef.current)}
                  onTouchEnd={()=>saveSettings(settingsRef.current)}
                  onBlur={()=>saveSettings(settingsRef.current)}
                  className="w-full accent-yellow-600"
                />
                <p className={`text-xs mt-3 ${darkMode?'text-gray-500':'text-gray-500'}`}>A mudança afeta textos, questões, menus e formulários do site inteiro.</p>
              </div>
            </SettingsSection>
	            {canUseAdvancedFeatures&&(
	              <SettingsSection id="goals" title="Metas diárias" icon={<CalendarCheck className="w-4 h-4"/>}>
	                <div className={`rounded-2xl border p-4 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
	                  <p className={`text-xs mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>{canSeeVideoaulas ? 'Sugestão inicial: 120 questões e 90 minutos úteis de aula por dia.' : 'Sugestão inicial: 120 questões por dia.'}</p>
	                  <div className={`grid grid-cols-1 ${canSeeVideoaulas ? 'sm:grid-cols-2' : ''} gap-3`}>
	                    <div>
	                      <label className="block text-xs font-bold uppercase mb-2 opacity-50 leading-snug">Questões/dia</label>
	                      <input
	                        type="number"
	                        min="1"
	                        value={settings.dailyQuestionGoal || 120}
	                        onChange={e=>setSettings({...settings,dailyQuestionGoal:parseInt(e.target.value,10)||1})}
	                        onBlur={()=>saveSettings(settingsRef.current)}
	                        className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}
	                      />
	                    </div>
	                    {canSeeVideoaulas&&<div>
	                      <label className="block text-xs font-bold uppercase mb-2 opacity-50 leading-snug">Minutos de aula/dia</label>
	                      <input
	                        type="number"
	                        min="1"
	                        value={settings.dailyLectureMinutesGoal || 90}
	                        onChange={e=>setSettings({...settings,dailyLectureMinutesGoal:parseInt(e.target.value,10)||1})}
	                        onBlur={()=>saveSettings(settingsRef.current)}
	                        className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}
	                      />
	                    </div>}
	                  </div>
	                </div>
	              </SettingsSection>
	            )}
            <SettingsSection id="account" title="Conta" icon={<UserIcon className="w-4 h-4"/>}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold truncate">{username}</p>
                  <p className={`text-xs mt-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>{user?.email || (isAdmin?'Administrador':'Estudante')}</p>
                </div>
                <button type="button" onClick={handleLogout}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${darkMode?'border-red-900/70 text-red-400 hover:bg-red-950/40':'border-red-200 text-red-600 hover:bg-red-50'}`}>
                  <LogOut className="w-4 h-4"/>Sair da conta
                </button>
              </div>
            </SettingsSection>

            {isAdmin&&(
              <div className="pt-2">
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Configurações do site</p>
                <h3 className="text-xl font-serif font-bold mt-1">Gestão global e administração</h3>
              </div>
            )}
            {isAdmin&&(
              <SettingsSection id="home-preview" title="Visualização do painel" icon={<UserIcon className="w-4 h-4"/>}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {k:'admin', label:'Admin', desc:'Bancada, curso e acervos'},
                    {k:'course', label:'Aluno com curso', desc:'Curso e funções comuns'},
                    {k:'site', label:'Aluno sem curso', desc:'Sem mostrar o curso'},
                  ].map(opt=>(
                    <button key={opt.k} type="button" onClick={()=>saveSettings({...settingsRef.current, adminHomeMode:opt.k})}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${(settings.adminHomeMode||'admin')===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                      <span className="block text-sm font-bold">{opt.label}</span>
                      <span className="block text-xs opacity-50 mt-0.5 leading-snug">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${darkMode?'text-gray-500':'text-gray-400'}`}>
                  Isso muda só o que aparece no seu painel inicial e menus rápidos. Suas permissões de admin continuam ativas.
                </p>
              </SettingsSection>
            )}
            {isAdmin&&(
              <SettingsSection id="home-motto" title="Frase do pórtico" icon={<Landmark className="w-4 h-4"/>}>
                <p className={`text-xs mb-3 leading-relaxed ${darkMode?'text-gray-500':'text-gray-500'}`}>
                  Esta frase aparece na tela inicial de todos os usuários.
                </p>
                <HomeMottoEditor
                  initialValue={siteConfig.homeMotto}
                  darkMode={darkMode}
                  onSave={homeMotto=>saveSiteConfig({homeMotto})}
                />
              </SettingsSection>
            )}

            {/* ── ADMIN: Whitelist de acesso ── */}
            {isAdmin&&(
              <SettingsSection
                id="whitelist"
                title="Controle de acesso"
                icon={<Sparkles className="w-4 h-4"/>}
                className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800/50 border-yellow-900/40':'bg-yellow-50 border-yellow-200'}`}
                titleClassName="text-yellow-600"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-4 ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-yellow-200'}`}>
                    <div className="mb-3">
                      <p className="text-sm font-bold">Alunos com curso</p>
                      <p className={`text-xs mt-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>Acesso ao Portal do Curso e às funções não administrativas.</p>
                    </div>
                    <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                      {courseAllowedEmails.map(email=>(
                        <div key={email} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${darkMode?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                          <span className="text-sm font-medium truncate">{email}</span>
                          {email.toLowerCase()===ADMIN_EMAIL.toLowerCase()
                            ? <span className="text-xs font-bold text-yellow-600 flex-shrink-0">admin</span>
                            : <div className="flex items-center gap-1 flex-shrink-0">
                                <button type="button" aria-label={`Mover ${email} para acesso sem curso`} title="Mover para sem curso" onClick={()=>moveCourseToSiteOnly(email)} className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-white'}`}>sem curso</button>
                                <button type="button" aria-label={`Remover ${email}`} onClick={()=>removeFromWhitelist(email)} className="text-red-400 hover:text-red-600 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          }
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email" value={newWhitelistEmail}
                        onChange={e=>setNewWhitelistEmail(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addToWhitelist()}
                        placeholder="aluno@comcurso.com"
                        className={`min-w-0 flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}
                      />
                      <button type="button" aria-label="Adicionar aluno com curso" onClick={addToWhitelist} disabled={!newWhitelistEmail.trim()}
                        className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold disabled:opacity-40">
                        <PlusIcon className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-yellow-200'}`}>
                    <div className="mb-3">
                      <p className="text-sm font-bold">Alunos sem curso</p>
                      <p className={`text-xs mt-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>Acesso ao site, sem Portal do Curso, videoaulas, cronograma ou metas de aula.</p>
                    </div>
                    <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                      {siteOnlyAccessEmails.map(email=>(
                        <div key={email} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${darkMode?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                          <span className="text-sm font-medium truncate">{email}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" aria-label={`Mover ${email} para curso`} title="Mover para com curso" onClick={()=>moveSiteOnlyToCourse(email)} className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-white'}`}>com curso</button>
                            <button type="button" aria-label={`Remover ${email}`} onClick={()=>removeFromSiteOnlyWhitelist(email)} className="text-red-400 hover:text-red-600 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))}
                      {siteOnlyAccessEmails.length===0&&<p className="text-sm opacity-40 text-center py-2">Nenhum email sem curso.</p>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email" value={newSiteWhitelistEmail}
                        onChange={e=>setNewSiteWhitelistEmail(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addToSiteOnlyWhitelist()}
                        placeholder="aluno@semcurso.com"
                        className={`min-w-0 flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}
                      />
                      <button type="button" aria-label="Adicionar aluno sem curso" onClick={addToSiteOnlyWhitelist} disabled={!newSiteWhitelistEmail.trim()}
                        className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold disabled:opacity-40">
                        <PlusIcon className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            )}
            {isAdmin&&(()=>{
              const now = Date.now();
              const last24h = accessLogs.filter(log => now - Number(log.createdAt || 0) <= 24 * 60 * 60 * 1000);
              const allowedCount = last24h.filter(log => log.allowed).length;
              const blockedCount = last24h.filter(log => !log.allowed).length;
              const uniqueEmails = new Set(accessLogs.map(log => String(log.email || log.uid || '').toLowerCase()).filter(Boolean)).size;
              const fmtLogTime = (ts) => ts ? new Date(Number(ts)).toLocaleString('pt-BR', {
                day:'2-digit',
                month:'2-digit',
                year:'2-digit',
                hour:'2-digit',
                minute:'2-digit',
                second:'2-digit',
              }) : 'sem data';
              const shortAgent = (ua = '') => String(ua || '')
                .replace(/\s+/g, ' ')
                .replace(/^Mozilla\/5\.0\s*/i, '')
                .slice(0, 150);
              const compactPath = (path = '') => {
                if (!path) return 'rota não registrada';
                try {
                  const url = new URL(path);
                  return `${url.pathname || '/'}${url.search || ''}`;
                } catch(e) {
                  return String(path).replace(/^https?:\/\/[^/]+/i, '') || String(path);
                }
              };
              const parseAccessDevice = (log) => {
                const ua = String(log.userAgent || '');
                const platform = String(log.platform || '').trim();
                const screen = String(log.screen || '').trim();
                const language = String(log.language || '').trim();
                const timezone = String(log.timezone || '').trim();
                const pick = (...matches) => matches.find(Boolean)?.[1]?.replace(/_/g, '.') || '';
                let os = 'SO ?';
                if (/Android/i.test(ua)) os = `Android ${pick(ua.match(/Android\s+([\d.]+)/i))}`.trim();
                else if (/(iPhone|iPad|iPod)/i.test(ua)) os = `iOS ${pick(ua.match(/OS\s+([\d_]+)/i))}`.trim();
                else if (/Windows NT/i.test(ua)) os = 'Windows';
                else if (/Mac OS X/i.test(ua)) os = `macOS ${pick(ua.match(/Mac OS X\s+([\d_]+)/i))}`.trim();
                else if (/Linux/i.test(ua) || /Linux/i.test(platform)) os = 'Linux';

                let browser = 'browser ?';
                if (/SamsungBrowser\/([\d.]+)/i.test(ua)) browser = `Samsung Internet ${pick(ua.match(/SamsungBrowser\/([\d.]+)/i))}`;
                else if (/EdgA?\/([\d.]+)/i.test(ua)) browser = `Edge ${pick(ua.match(/EdgA?\/([\d.]+)/i))}`;
                else if (/CriOS\/([\d.]+)/i.test(ua)) browser = `Chrome iOS ${pick(ua.match(/CriOS\/([\d.]+)/i))}`;
                else if (/Chrome\/([\d.]+)/i.test(ua)) browser = `Chrome ${pick(ua.match(/Chrome\/([\d.]+)/i))}`;
                else if (/Firefox\/([\d.]+)/i.test(ua)) browser = `Firefox ${pick(ua.match(/Firefox\/([\d.]+)/i))}`;
                else if (/Version\/([\d.]+).*Safari/i.test(ua)) browser = `Safari ${pick(ua.match(/Version\/([\d.]+)/i))}`;

                const type = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
                  ? 'tablet'
                  : (/Mobile|Android|iPhone|iPod/i.test(ua) ? 'celular' : 'desktop');
                const androidModel = /Android/i.test(ua)
                  ? (ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build|\)|;)/i)?.[1] || '').trim()
                  : '';
                const model = androidModel && !/wv|Mobile|Chrome|Safari/i.test(androidModel) ? androidModel : '';
                const short = [os, browser, type].filter(Boolean).join(' · ');
                const full = [os, browser, type, model, platform && `platform ${platform}`, screen && `tela ${screen}`, language, timezone].filter(Boolean).join(' · ');
                return { short, full };
              };
              const logScope = (log) => {
                if (log.isAdmin) return 'admin';
                if (log.status === 'curso' || log.canSeeCourse) return 'curso';
                if (log.status === 'sem_curso' || log.siteOnly) return 'site';
                if (!log.allowed) return 'bloq';
                return log.status || 'ok';
              };
              const logResultClass = (log) => log.allowed
                ? (darkMode ? 'text-green-300' : 'text-green-700')
                : (darkMode ? 'text-red-300' : 'text-red-700');
              const logTitle = (log) => [
                `uid: ${log.uid || '—'}`,
                `nome: ${log.displayName || '—'}`,
                `email: ${log.email || '—'}`,
                `status: ${log.status || '—'}`,
                `hora: ${fmtLogTime(log.createdAt)}`,
                `permitido: ${log.allowed ? 'sim' : 'não'}`,
                `curso: ${log.canSeeCourse ? 'sim' : 'não'}`,
                `siteOnly: ${log.siteOnly ? 'sim' : 'não'}`,
                `admin: ${log.isAdmin ? 'sim' : 'não'}`,
                `página: ${compactPath(log.path)}`,
                `dispositivo: ${parseAccessDevice(log).full}`,
                `fuso: ${log.timezone || '—'}`,
                `user agent: ${shortAgent(log.userAgent) || '—'}`,
              ].join('\n');
              return (
                <SettingsSection
                  id="access-logs"
                  title="Logs de acesso"
                  icon={<ShieldAlert className="w-4 h-4"/>}
                  className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800/50 border-gray-700':'bg-white border-gray-200'}`}
                  titleClassName="text-yellow-600"
                  collapsible
                >
                  <div className={`mb-3 rounded-xl border px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">Painel manual</p>
                      <p className="text-[11px] opacity-50 mt-0.5">
                        {accessAdminLastRefresh
                          ? `Última atualização: ${new Date(accessAdminLastRefresh).toLocaleString('pt-BR')}`
                          : 'Clique em atualizar para buscar os dados no Firestore.'}
                      </p>
                      {accessAdminError && <p className="text-[11px] text-red-500 mt-1">Erro: {accessAdminError}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={()=>refreshAdminAccessData()}
                      disabled={accessLogsLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {accessLogsLoading ? <Spinner className="w-4 h-4"/> : <RotateCcw className="w-4 h-4"/>}
                      Atualizar
                    </button>
                  </div>
                  <div className={`rounded-xl border overflow-hidden ${darkMode?'border-gray-700 bg-gray-950/30':'border-gray-200 bg-white'}`}>
                    <div className={`px-2.5 py-1.5 flex items-center justify-between gap-3 border-b ${darkMode?'border-gray-800 bg-gray-900/50':'border-gray-100 bg-gray-50'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">access.log · 40 recentes</p>
                      <p className={`text-[9px] ${accessLogsLoading?'text-yellow-600':'opacity-50'}`}>
                        {accessLogsLoading ? 'carregando...' : `${allowedCount} ok · ${blockedCount} negados · ${uniqueEmails} ids`}
                      </p>
                    </div>
                    <div className="max-h-[28rem] overflow-y-auto p-1.5 space-y-1" style={{overflowAnchor:'none'}}>
                      {!accessLogsLoading && accessLogs.length===0 && (
                        <p className="text-[10px] opacity-50 italic p-3">{accessAdminLastRefresh ? 'Nenhum log encontrado ainda.' : 'Dados ainda não carregados nesta sessão.'}</p>
                      )}
                      {accessLogs.map(log => {
                        const identity = log.email || log.uid || 'sem identificação';
                        const device = parseAccessDevice(log);
                        const page = compactPath(log.path);
                        return (
                          <div
                            key={log.id}
                            title={logTitle(log)}
                            className={`rounded-lg border px-2.5 py-2 ${darkMode?'bg-gray-900 border-gray-800 hover:border-gray-700':'bg-white border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${log.allowed?'bg-green-500':'bg-red-500'}`}/>
                              <span className={`text-[10px] font-bold uppercase flex-shrink-0 ${logResultClass(log)}`}>{log.allowed ? 'OK' : 'DENY'}</span>
                              <span className={`text-[10px] uppercase flex-shrink-0 ${darkMode?'text-gray-500':'text-gray-500'}`}>{logScope(log)}</span>
                              <span className={`text-[11px] font-bold truncate ${darkMode?'text-gray-200':'text-gray-800'}`}>{identity}</span>
                              <span className={`text-[10px] tabular-nums flex-shrink-0 ml-auto ${darkMode?'text-gray-500':'text-gray-500'}`}>{fmtLogTime(log.createdAt)}</span>
                            </div>
                            <div className={`mt-1 flex items-center gap-2 text-[10px] leading-tight ${darkMode?'text-gray-500':'text-gray-500'}`}>
                              <span className="truncate">{device.short}</span>
                              <span className="opacity-40 flex-shrink-0">·</span>
                              <span className="truncate">{page}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SettingsSection>
              );
            })()}
            {isAdmin&&(()=>{
              const now = Date.now();
              const activeWindow = 12 * 60 * 1000;
              const recentWindow = 30 * 24 * 60 * 60 * 1000;
              const whitelist = globalAllowedEmails.map(e => e.toLowerCase());
              const devicesByEmail = new Map();
              userDevices
                .filter(device => whitelist.includes(String(device.email || '').toLowerCase()))
                .forEach(device => {
                  const email = String(device.email || '').toLowerCase();
                  devicesByEmail.set(email, [...(devicesByEmail.get(email) || []), device]);
                });
              const rows = whitelist.map(email => {
                const devices = [...(devicesByEmail.get(email) || [])].sort((a,b)=>(b.lastSeenAt||0)-(a.lastSeenAt||0));
                const active = devices.filter(d => now - Number(d.lastSeenAt || 0) <= activeWindow);
                const recent = devices.filter(d => now - Number(d.lastSeenAt || 0) <= recentWindow);
                return { email, devices, active, recent };
              });
              const fmtSeen = (ts) => {
                if (!ts) return 'nunca';
                const diff = now - Number(ts);
                if (diff < 90000) return 'agora';
                if (diff < 3600000) return `${Math.round(diff/60000)} min`;
                if (diff < 86400000) return `${Math.round(diff/3600000)} h`;
                return `${Math.round(diff/86400000)} d`;
              };
              const totalActive = rows.reduce((acc,row)=>acc+row.active.length,0);
              const totalRecent = rows.reduce((acc,row)=>acc+row.recent.length,0);
              return (
                <SettingsSection
                  id="devices"
                  title="Dispositivos conectados"
                  icon={<UserIcon className="w-4 h-4"/>}
                  className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800/50 border-gray-700':'bg-white border-gray-200'}`}
                  titleClassName="text-yellow-600"
                  collapsible
                >
                  <div className={`mb-3 rounded-xl border px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">Presença por dispositivo</p>
                      <p className="text-[11px] opacity-50 mt-0.5">
                        Atualização manual · {accessAdminLastRefresh ? new Date(accessAdminLastRefresh).toLocaleString('pt-BR') : 'aguardando primeira leitura'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={()=>refreshAdminAccessData()}
                      disabled={accessLogsLoading}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${darkMode?'border-gray-700 text-gray-200 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-white'}`}
                    >
                      {accessLogsLoading ? <Spinner className="w-4 h-4"/> : <RotateCcw className="w-4 h-4"/>}
                      Atualizar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`rounded-xl border p-3 ${darkMode?'bg-gray-900 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                      <p className="text-2xl font-serif font-bold text-green-500">{totalActive}</p>
                      <p className="text-xs font-bold uppercase opacity-50">ativos ≤12min</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${darkMode?'bg-gray-900 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                      <p className="text-2xl font-serif font-bold text-yellow-600">{totalRecent}</p>
                      <p className="text-xs font-bold uppercase opacity-50">últimos 30 dias</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {rows.map(row=>(
                      <div key={row.email} className={`rounded-xl border p-3 ${darkMode?'bg-gray-900 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold truncate">{row.email}</p>
                          <p className="text-xs font-bold text-yellow-600 flex-shrink-0">{row.active.length} ativo{row.active.length!==1?'s':''} · {row.recent.length} disp.</p>
                        </div>
                        {row.devices.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {row.devices.slice(0, 4).map(device=>(
                              <div key={device.id} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs ${darkMode?'bg-gray-800 text-gray-300':'bg-white text-gray-600'}`}>
                                <span className="truncate">{device.platform || 'Dispositivo'} · {device.screen || 'tela ?'} · {device.timezone || 'fuso ?'}</span>
                                <span className={now - Number(device.lastSeenAt || 0) <= activeWindow ? 'font-bold text-green-500' : 'opacity-60'}>{fmtSeen(device.lastSeenAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs opacity-40">Nenhum dispositivo registrado.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </SettingsSection>
              );
            })()}
            {isAdmin&&COURSE_CATALOG_ADMIN_ENABLED&&(
              <SettingsSection
                id="course-catalog"
                title="Catálogo das aulas"
                icon={<BookOpen className="w-4 h-4"/>}
                className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800/50 border-gray-700':'bg-white border-gray-200'}`}
                titleClassName="text-yellow-600"
                collapsible
              >
                <p className={`text-sm leading-relaxed mb-4 ${darkMode?'text-gray-400':'text-gray-600'}`}>
                  Gera uma ficha curta por aula usando título, duração e transcrição. Agora o Gerar pendentes varre todas as matérias do curso. Nada é renomeado automaticamente.
                </p>
                <div className={`rounded-xl border p-4 mb-4 ${darkMode?'bg-gray-900/30 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Aulas catalogadas</p>
                      <p className="text-sm font-bold mt-1">
                        {courseCatalogStats.loading ? 'Atualizando...' : `${Math.max(0, (courseCatalogStats.total || 0) - (courseCatalogStats.pending || 0))}/${courseCatalogStats.total || 0} prontas`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshCourseCatalogStats}
                      disabled={courseCatalogStats.loading || courseCatalogRun.running}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold disabled:opacity-40 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-white'}`}>
                      Atualizar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className={`rounded-xl border p-3 ${darkMode?'bg-gray-950/60 border-gray-800':'bg-white border-gray-200'}`}>
                      <p className="text-2xl font-serif font-bold text-yellow-600">{courseCatalogStats.total || 0}</p>
                      <p className="text-xs font-bold uppercase opacity-50">aulas totais</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${darkMode?'bg-gray-950/60 border-gray-800':'bg-white border-gray-200'}`}>
                      <p className={`text-2xl font-serif font-bold ${(courseCatalogStats.pending || 0) ? 'text-red-500' : 'text-green-500'}`}>{courseCatalogStats.pending || 0}</p>
                      <p className="text-xs font-bold uppercase opacity-50">faltando</p>
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1" style={{overflowAnchor:'none'}}>
                    {(courseCatalogStats.rows || []).length === 0 && (
                      <p className={`text-sm italic ${darkMode?'text-gray-500':'text-gray-500'}`}>Os contadores aparecem aqui quando as aulas carregarem.</p>
                    )}
                    {(courseCatalogStats.rows || []).map(row => (
                      <div key={row.subject} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${darkMode?'bg-gray-950/60':'bg-white'}`}>
                        <span className="font-bold truncate">{row.subject}</span>
                        <span className={`font-bold flex-shrink-0 ${row.pending ? 'text-yellow-600' : 'text-green-500'}`}>
                          {row.pending} faltando · {row.total} total
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-xl border p-4 mb-4 ${darkMode?'bg-gray-900/30 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Intervalo entre aulas</p>
                      <p className={`text-xs mt-1 ${darkMode?'text-gray-400':'text-gray-500'}`}>Use para testar o menor tempo sem cair em bloqueio global.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        step="0.5"
                        value={settings.courseCatalogDelaySeconds ?? DEFAULT_COURSE_CATALOG_DELAY_SECONDS}
                        onChange={e=>{
                          const value = Math.max(0, Math.min(120, Number(e.target.value) || 0));
                          setSettings({...settingsRef.current, courseCatalogDelaySeconds:value});
                        }}
                        onBlur={()=>saveSettings(settingsRef.current)}
                        className={`w-24 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-center ${darkMode?'bg-gray-950 border-gray-700 text-white':'bg-white border-gray-200'}`}
                      />
                      <span className={`text-sm font-bold ${darkMode?'text-gray-400':'text-gray-500'}`}>s</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[0, 0.5, 1, 2, 3, 5].map(sec=>(
                      <button
                        key={sec}
                        type="button"
                        onClick={()=>saveSettings({...settingsRef.current, courseCatalogDelaySeconds:sec})}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${(Number(settings.courseCatalogDelaySeconds ?? DEFAULT_COURSE_CATALOG_DELAY_SECONDS) === sec)
                          ? (darkMode?'border-yellow-600 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700')
                          : (darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-white')}`}>
                        {sec}s
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearCourseCatalogKeyStats}
                      disabled={courseCatalogRun.running}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-40 ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-white'}`}>
                      Zerar memória das chaves
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    disabled={courseCatalogRun.running}
                    onClick={()=>startCourseCatalogAnalysis({ force:false })}
                    className="px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {courseCatalogRun.running ? <Spinner className="w-4 h-4 text-white"/> : <Sparkles className="w-4 h-4"/>}
                    Gerar pendentes
                  </button>
                  <button
                    disabled={courseCatalogRun.running}
                    onClick={()=>startCourseCatalogAnalysis({ force:true })}
                    className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 ${darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    Refazer todas
                  </button>
                  {courseCatalogRun.running&&(
                    <>
                      <button
                        onClick={courseCatalogRun.paused ? resumeCourseCatalogAnalysis : pauseCourseCatalogAnalysis}
                        disabled={courseCatalogRun.stopping}
                        className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 ${darkMode?'border-yellow-700 text-yellow-300 hover:bg-yellow-900/20':'border-yellow-300 text-yellow-700 hover:bg-yellow-50'}`}>
                        {courseCatalogRun.paused ? 'Continuar' : 'Pausar'}
                      </button>
                      <button
                        onClick={stopCourseCatalogAnalysis}
                        disabled={courseCatalogRun.stopping}
                        className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 ${darkMode?'border-red-800 text-red-400 hover:bg-red-900/20':'border-red-300 text-red-600 hover:bg-red-50'}`}>
                        {courseCatalogRun.stopping ? 'Parando...' : 'Parar'}
                      </button>
                    </>
                  )}
                </div>
                <div className={`rounded-xl border overflow-hidden ${darkMode?'border-gray-700':'border-gray-200'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-100 bg-gray-50'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Progresso</span>
                    <span className="text-xs font-bold text-yellow-600">
                      {courseCatalogRun.paused ? 'pausado · ' : courseCatalogRun.stopping ? 'parando · ' : ''}
                      {courseCatalogRun.total ? `${courseCatalogRun.current}/${courseCatalogRun.total}` : 'parado'}
                    </span>
                  </div>
                  <div ref={courseCatalogLogRef} className="max-h-56 overflow-y-auto p-3 space-y-2">
                    {courseCatalogRun.logs.length===0&&<p className="text-sm opacity-50 italic p-2">Os logs aparecem aqui durante a análise.</p>}
                    {courseCatalogRun.logs.map(log=>{
                      const cls = log.type==='success'
                        ? (darkMode?'text-green-400':'text-green-700')
                        : log.type==='error'
                          ? (darkMode?'text-red-400':'text-red-700')
                          : (darkMode?'text-gray-300':'text-gray-700');
                      return (
                        <div key={log.id} className={`text-xs rounded-lg px-3 py-2 ${darkMode?'bg-gray-900/40':'bg-gray-50'}`}>
                          <span className="opacity-40 font-mono mr-2">{log.time}</span>
                          <span className={cls}>{log.msg}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={`mt-5 rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}>
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                      <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Prévia</p>
                      <h4 className="text-lg font-serif font-bold text-yellow-600">Proposta de organização</h4>
                        <p className={`text-xs mt-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>Fluxo recomendado: gere todas em fila. O site processa uma matéria por vez, usando o Firebase com correções manuais.</p>
                      </div>
                      <button
                        disabled={courseOrgRun.running || courseCatalogRun.running || !displayCourseOrgProposal?.subjects?.length}
                        onClick={()=>applyCourseOrgProposalToPlan()}
                        className={`px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${darkMode?'bg-gray-800 text-yellow-300 hover:bg-gray-700':'bg-gray-900 text-yellow-100 hover:bg-gray-800'}`}>
                        <CalendarCheck className="w-4 h-4"/>
                        Aplicar à Jornada do Herói
                      </button>
                    </div>

                    <div className={`rounded-xl border p-3 ${darkMode?'border-gray-700 bg-gray-950/40':'border-gray-200 bg-white'}`}>
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Matéria corrigida</label>
                      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_auto_auto] gap-2">
                        <select
                          value={courseOrgSelectedSubject}
                          onChange={e=>setCourseOrgSelectedSubject(e.target.value)}
                          disabled={courseOrgRun.running || courseCatalogRun.running}
                          style={darkMode ? { backgroundColor:'#030712', color:'#e5e7eb' } : { backgroundColor:'#ffffff', color:'#374151' }}
                          className={`w-full min-w-0 px-3 py-3 rounded-xl border text-sm font-bold disabled:opacity-50 outline-none ${darkMode?'border-gray-700':'border-gray-200'}`}>
                          <option value="">Escolha uma matéria...</option>
                          {originalSubjectOptions.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running}
                          onClick={listCourseOriginalSubjects}
                          className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                          <FileText className="w-4 h-4"/>
                          Listar subjects
                        </button>
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running || !courseOrgSelectedSubject}
                          onClick={()=>startCourseOrganizationProposal({ integrateBonus:true, targetSubject:courseOrgSelectedSubject })}
                          className="px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                          {courseOrgRun.running ? <Spinner className="w-4 h-4 text-white"/> : <Sparkles className="w-4 h-4"/>}
                          Gerar esta matéria
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Fila automática</p>
                      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1.3fr)_1fr_1fr_1fr] gap-2">
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running}
                          onClick={()=>startCourseOrganizationProposal({ integrateBonus:true })}
                          className="px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                          {courseOrgRun.running ? <Spinner className="w-4 h-4 text-white"/> : <Sparkles className="w-4 h-4"/>}
                          Gerar todas em fila
                        </button>
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running || !displayCourseOrgProposal?.subjects?.length}
                          onClick={()=>startCourseOrganizationProposal({ integrateBonus:displayCourseOrgProposal?.mode === 'integrated', onlyMissing:true })}
                          className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                          {courseOrgRun.running ? <Spinner className="w-4 h-4"/> : <RotateCcw className="w-4 h-4"/>}
                          Gerar faltantes
                        </button>
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running || !displayCourseOrgProposal?.subjects?.length || !courseOrgProposalUsesOriginalSubjects}
                          onClick={()=>startCourseOrganizationProposal({ integrateBonus:displayCourseOrgProposal?.mode === 'integrated', onlyProblematic:true })}
                          className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${darkMode?'border-red-900/70 text-red-300 hover:bg-red-950/40':'border-red-200 text-red-700 hover:bg-red-50'}`}>
                          {courseOrgRun.running ? <Spinner className="w-4 h-4"/> : <ShieldAlert className="w-4 h-4"/>}
                          Regerar erros
                        </button>
                        <button
                          disabled={courseOrgRun.running || courseCatalogRun.running}
                          onClick={()=>startCourseOrganizationProposal({ integrateBonus:false })}
                          className={`px-4 py-3 rounded-xl border font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                          Bônus separado
                        </button>
                      </div>
                    </div>
                  </div>
                  {courseOrgRun.logs.length>0&&(
                    <div className={`rounded-xl border overflow-hidden mb-4 ${darkMode?'border-gray-700':'border-gray-200'}`}>
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${darkMode?'border-gray-700 bg-gray-950/40':'border-gray-100 bg-white'}`}>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Log da proposta</span>
                        <span className="text-xs font-bold text-yellow-600">{courseOrgRun.total ? `${courseOrgRun.current}/${courseOrgRun.total}` : 'parado'}</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                        {courseOrgRun.logs.map(log=>{
                          const cls = log.type==='success'
                            ? (darkMode?'text-green-400':'text-green-700')
                            : log.type==='error'
                              ? (darkMode?'text-red-400':'text-red-700')
                              : (darkMode?'text-gray-300':'text-gray-700');
                          return (
                            <div key={log.id} className={`text-xs rounded-lg px-2 py-1.5 ${darkMode?'bg-gray-950/50':'bg-white'}`}>
                              <span className="opacity-40 font-mono mr-2">{log.time}</span>
                              <span className={cls}>{log.msg}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!displayCourseOrgProposal?.subjects?.length ? (
                    <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-500'}`}>Gere a proposta depois que as fichas do catálogo estiverem prontas.</p>
                  ) : (
                    <div className="space-y-4">
                      {!courseOrgProposalUsesOriginalSubjects&&(
                        <p className={`text-xs rounded-xl border px-3 py-2 ${darkMode?'border-red-900/70 bg-red-950/30 text-red-300':'border-red-200 bg-red-50 text-red-700'}`}>
                          Esta prévia foi gerada pela lógica antiga e não será usada para reorganizar o portal. Gere novamente com as correções manuais.
                        </p>
                      )}
                      <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-500'}`}>
                        Prévia {displayCourseOrgProposal.mode === 'integrated' ? 'sem separar bônus' : 'com bônus separado'} gerada em {new Date(displayCourseOrgProposal.generatedAt || Date.now()).toLocaleString('pt-BR')}. Ainda não aplica nada no curso.
                      </p>
                      {displayCourseOrgProposal.subjects.map(subjectProposal=>(
                        <div key={subjectProposal.subject} className={`rounded-xl border overflow-hidden ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-white'}`}>
                          <div className={`px-4 py-3 border-b ${darkMode?'border-gray-700':'border-gray-100'}`}>
                            <p className="font-serif font-bold text-yellow-600">{subjectProposal.subject}</p>
                            {subjectProposal.notes&&<p className={`text-xs mt-1 ${darkMode?'text-gray-500':'text-gray-500'}`}>{subjectProposal.notes}</p>}
                          </div>
                          <div className="p-3 space-y-3">
                            {(subjectProposal.modules || []).map((module, mi)=>(
                              <div key={`${subjectProposal.subject}-${module.title}-${mi}`}>
                                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>{String(mi + 1).padStart(2,'0')}. {module.title}</p>
                                <div className="space-y-1">
                                  {(module.lessons || []).map((lesson, li)=>(
                                    <div key={lesson.lessonId} className={`rounded-lg px-3 py-2 ${darkMode?'bg-gray-950/60':'bg-gray-50'}`}>
                                      <p className="text-sm font-bold">{String(li + 1).padStart(2,'0')}. {lesson.title}</p>
                                      {lesson.reason&&<p className={`text-[11px] mt-0.5 ${darkMode?'text-gray-500':'text-gray-500'}`}>{lesson.reason}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {!!subjectProposal.bonus?.length&&(
                              <div>
                                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode?'text-yellow-500':'text-yellow-700'}`}>Bônus</p>
                                <div className="space-y-1">
                                  {subjectProposal.bonus.map((lesson, li)=>(
                                    <div key={lesson.lessonId} className={`rounded-lg px-3 py-2 ${darkMode?'bg-yellow-900/10':'bg-yellow-50'}`}>
                                      <p className="text-sm font-bold">B{String(li + 1).padStart(2,'0')}. {lesson.title}</p>
                                      {lesson.reason&&<p className={`text-[11px] mt-0.5 ${darkMode?'text-yellow-200/60':'text-yellow-800/60'}`}>{lesson.reason}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingsSection>
            )}

            {/* Zona de perigo */}
            {canSeeVideoaulas&&(
              <SettingsSection
                id="danger"
                title="Zona de perigo"
                icon={<Trash2 className="w-4 h-4"/>}
                className={`border-2 border-dashed rounded-2xl p-6 ${darkMode?'border-red-800/50':'border-red-200'}`}
                titleClassName={darkMode?'text-red-400':'text-red-600'}
              >
                <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-600'}`}>Apaga todo o progresso do Portal do Curso: aulas assistidas, questões geradas e fila de revisão espaçada. A biblioteca do Oráculo não é afetada.</p>
                <button onClick={()=>{setResetCourseModal(true);setResetCourseInput('');}}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${darkMode?'border-red-700 text-red-400 hover:bg-red-900/20':'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  <Trash2 className="w-4 h-4"/>Apagar progresso do curso
                </button>
              </SettingsSection>
            )}

            <button onClick={()=>{saveSettings(settings);addToast('Configurações salvas.', 'success', 2500);setView('library');}} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-4 rounded-xl font-bold">Salvar</button>
          </div>
  );
}
