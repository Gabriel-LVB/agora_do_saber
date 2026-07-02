import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function SubLibraryView() {
  const {
    AcademiaIcon,
    activeFolder,
    activeFolderId,
    AlertTriangle,
    ArrowLeft,
    BlockIcon,
    BookOpen,
    canUseAcademia,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    clearAcademiaFixationAnswersForTargets,
    copiedPrompt,
    Copy,
    darkMode,
    duplicateSubjectBlock,
    EditIcon,
    EmptyState,
    Eraser,
    Feather,
    FolderIcon,
    getAcademiaFolderFixationTargets,
    getAcademiaSubjectFixationTargets,
    getFolderErrorNotebookSources,
    getFolderPath,
    getLibraryItemParentId,
    getSubjectsInFolderTree,
    GripIcon,
    isAcademiaMirrorRootFolder,
    isAdmin,
    isErrorNotebookRootFolder,
    isFolderDescendant,
    isFolderItem,
    isProtectedMirrorRootFolder,
    libFilter,
    library,
    libraryActionMenu,
    libraryDrag,
    libraryDragCleanupRef,
    libraryDragRef,
    libraryFolders,
    libraryLoadError,
    libraryLoading,
    libraryOpenFolders,
    MoreIcon,
    openFolderErrorReview,
    openFolderReview,
    PlusIcon,
    reorderLibraryItem,
    RepeatIcon,
    setAcademiaCreatorStep,
    setAcademiaSetupStep,
    setActiveFolderId,
    setActiveSubjectId,
    setCreatorSetupStep,
    setCreatorStep,
    setDeleteId,
    setEditingSub,
    setEditingSubName,
    setExternalPromptModal,
    setLibraryActionMenu,
    setLibraryDrag,
    setLibraryOpenFolders,
    setNewFolderModal,
    setNewFolderName,
    setNewFolderParentId,
    setPasteSubName,
    setPasteTopic,
    setView,
    sortLibraryItems,
    sourceFolders,
    sourceSubjects,
    Sparkles,
    Spinner,
    subjectProgress,
    suppressLibraryClickUntil,
    Trash2,
    undefined,
  } = useFeatureContext();

            const sourceTitle = libFilter==='gemini'?'Acervo do Oráculo':libFilter==='academia'?'Academia do Saber':'Acervo Externo';
            const iconBox = darkMode?'bg-gray-800 text-yellow-500':'bg-yellow-50 text-yellow-700';
            const actionBtn = darkMode?'border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-700 hover:bg-gray-800':'border-gray-200 text-gray-500 hover:text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50';
            const primaryLabel = libFilter==='gemini'?'Gerar assunto':libFilter==='academia'?'Nova aula':'Importar';
            const primaryIcon = libFilter==='gemini'?<Sparkles className="w-4 h-4"/>:libFilter==='academia'?<AcademiaIcon className="w-4 h-4"/>:<Feather className="w-4 h-4"/>;
            const primaryAction = () => {
              if (libFilter==='gemini') { setCreatorStep(1); setCreatorSetupStep('content'); setView('creator'); }
              else if (libFilter==='academia') { setAcademiaCreatorStep(1); setAcademiaSetupStep('content'); setView('academia-creator'); }
              else { setPasteSubName(''); setPasteTopic('Bloco 1'); setView('paste'); }
            };
            const renderIconButton = (label, icon, fn, extra='') => (
              <button onClick={e=>{e.stopPropagation();fn();}} title={label} aria-label={label} className={`h-8 w-8 md:h-9 md:w-9 rounded-lg border flex items-center justify-center ${actionBtn} ${extra}`}>
                {icon}
              </button>
            );
            const renderActionButtons = (actions) => actions.map((a,i)=>
              <React.Fragment key={`${a.label}-${i}`}>{renderIconButton(a.label, a.icon, a.fn, a.extra || '')}</React.Fragment>
            );
            const mobileActionsMenu = (id, actions) => (
              <div className="relative flex-shrink-0">
                <button
                  onClick={e=>{e.stopPropagation();setLibraryActionMenu(p=>p===id?null:id);}}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center ${actionBtn}`}
                  aria-label="Ações"
                  title="Ações"
                >
                  <MoreIcon className="w-4 h-4"/>
                </button>
                {libraryActionMenu===id&&(
                  <div className={`mobile-safe-action-menu absolute right-0 top-9 z-40 min-w-40 rounded-xl border p-1 shadow-xl ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {actions.map((a,i)=>(
                      <button key={`${a.label}-${i}`} onClick={e=>{e.stopPropagation();setLibraryActionMenu(null);a.fn();}} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-bold ${a.danger?(darkMode?'text-red-300 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):(darkMode?'text-gray-200 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50')}`}>
                        {a.icon}
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
            const toggleLibraryFolder = (id) => setLibraryOpenFolders(p=>({...p,[id]:!(p[id] ?? false)}));
            const countSubjectQuestions = (subject) => subject.source==='academia'
              ? subject.topics.flatMap(t=>Object.values(t.fixationQuestions||{}).flat()).length
              : subject.topics.reduce((acc,t)=>acc+(t.origin?.source === 'customStudy' ? (t.questionRefs?.length || 0) : (t.questions?.length || 0)), 0);
            const countFolderQuestions = (folder) => getSubjectsInFolderTree(folder).reduce((acc,s)=>acc+countSubjectQuestions(s),0);
            const directFolders = (parentId) => sortLibraryItems(sourceFolders(libFilter).filter(f=>(f.parentFolderId||null)===(parentId||null)));
            const directSubjects = (folderId) => sortLibraryItems(sourceSubjects(libFilter).filter(s=>(s.folderId||null)===(folderId||null)));
            const directItems = (parentId) => sortLibraryItems([...directFolders(parentId), ...directSubjects(parentId)]);
            const treeRootId = activeFolderId || null;
            const treeItems = directItems(treeRootId);
            const treeItemCount = treeItems.length;
            const activeFolderLocked = isProtectedMirrorRootFolder(activeFolder);
            const activeFolderErrorCount = activeFolder
              ? getFolderErrorNotebookSources(activeFolder).reduce((acc, s) => acc + s.questions.length, 0)
              : 0;
            const collectTreeFolderIds = (parentId) => {
              const ids = [];
              const walk = (id) => directFolders(id).forEach(folder => {
                ids.push(folder.id);
                walk(folder.id);
              });
              walk(parentId || null);
              return ids;
            };
            const treeFolderIds = collectTreeFolderIds(treeRootId);
            const allTreeFoldersOpen = treeFolderIds.length > 0 && treeFolderIds.every(id => libraryOpenFolders[id] ?? false);
            const setAllTreeFoldersOpen = (open) => setLibraryOpenFolders(p => {
              const next = {...p};
              treeFolderIds.forEach(id => { next[id] = open; });
              return next;
            });
            const rowBorder = darkMode?'border-gray-800':'border-gray-100';
            const rowHover = darkMode?'hover:bg-gray-800/70':'hover:bg-gray-50';
            const dropSlot = (position) => (
              <div className={`absolute left-3 right-3 ${position==='before'?'top-0':'bottom-0'} z-20 pointer-events-none flex items-center gap-1`}>
                <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
                <span className="h-0.5 flex-1 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
                <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
              </div>
            );
            const getDropId = (el) => {
              const raw = el?.dataset?.dropId;
              if (!raw || raw === 'root') return null;
              return libraryFolders.find(f=>String(f.id)===raw)?.id ?? raw;
            };
            const sameId = (a,b) => (a || null) === null || (b || null) === null ? (a || null) === (b || null) : String(a) === String(b);
            const getLibraryItemById = (id) => library.find(item=>String(item.id)===String(id));
            const isValidDrop = (drag, targetId, mode = 'inside', targetItem = null) => {
              if (!drag) return false;
              if (isProtectedMirrorRootFolder(drag.item)) return false;
              if (mode === 'before' || mode === 'after') {
                if (!targetItem || sameId(drag.item.id, targetItem.id) || drag.item.source !== targetItem.source) return false;
                if (isProtectedMirrorRootFolder(targetItem)) return false;
                const parentId = getLibraryItemParentId(targetItem);
                if (isProtectedMirrorRootFolder(libraryFolders.find(f => sameId(f.id, parentId)))) return false;
                return !isFolderItem(drag.item) || (!sameId(drag.item.id, parentId) && !isFolderDescendant(parentId, drag.item.id));
              }
              if (isProtectedMirrorRootFolder(libraryFolders.find(f => sameId(f.id, targetId)))) return false;
              if (drag.type === 'subject') return !sameId(drag.item.folderId || null, targetId || null);
              return !sameId(drag.item.id, targetId) && !sameId(drag.item.parentFolderId || null, targetId || null) && !isFolderDescendant(targetId, drag.item.id);
            };
            const isDropActive = (targetId) => libraryDrag?.active && libraryDrag?.targetFound && libraryDrag.dropMode === 'inside' && isValidDrop(libraryDrag, targetId) && sameId(libraryDrag.targetId || null, targetId || null);
            const isSlotActive = (parentId, slotIndex) => libraryDrag?.active && libraryDrag?.targetFound && libraryDrag.dropMode !== 'inside' && sameId(libraryDrag.slotParentId || null, parentId || null) && libraryDrag.slotIndex === slotIndex;
            const getDragPoint = (e) => {
              const touch = e.touches?.[0] || e.changedTouches?.[0];
              if (touch) return { clientX:touch.clientX, clientY:touch.clientY };
              return { clientX:e.clientX, clientY:e.clientY };
            };
            const stopLibraryDragEvent = (e) => {
              e.stopPropagation();
              if (e.cancelable !== false) e.preventDefault();
            };
            const startLibraryDrag = (e, item, type) => {
              if (libraryDragRef.current) return;
              if (e.button !== undefined && e.button !== 0) return;
              stopLibraryDragEvent(e);
              const point = getDragPoint(e);
              suppressLibraryClickUntil.current = Date.now() + 450;
              if (e.pointerId !== undefined) e.currentTarget.setPointerCapture?.(e.pointerId);
              const nextDrag = { item, type, source:item.source, startX:point.clientX, startY:point.clientY, x:point.clientX, y:point.clientY, active:false, targetId:null, targetItem:null, dropMode:'inside', targetFound:false, slotParentId:null, slotIndex:null };
              libraryDragRef.current = nextDrag;
              setLibraryDrag(nextDrag);
              libraryDragCleanupRef.current?.();
              const doc = e.currentTarget?.ownerDocument || document;
              const move = ev => updateLibraryDrag(ev);
              const end = ev => finishLibraryDrag(ev);
              const cancel = ev => {
                stopLibraryDragEvent(ev);
                if (libraryDragRef.current) setLibraryDrag(p=>p||libraryDragRef.current);
              };
              doc.addEventListener('pointermove', move, { passive:false });
              doc.addEventListener('pointerup', end, { passive:false });
              doc.addEventListener('touchmove', move, { passive:false });
              doc.addEventListener('touchend', end, { passive:false });
              doc.addEventListener('touchcancel', cancel, { passive:false });
              libraryDragCleanupRef.current = () => {
                doc.removeEventListener('pointermove', move);
                doc.removeEventListener('pointerup', end);
                doc.removeEventListener('touchmove', move);
                doc.removeEventListener('touchend', end);
                doc.removeEventListener('touchcancel', cancel);
                libraryDragCleanupRef.current = null;
              };
            };
            const updateLibraryDrag = (e) => {
              const drag = libraryDragRef.current || libraryDrag;
              if (!drag) return;
              stopLibraryDragEvent(e);
              const point = getDragPoint(e);
              const active = drag.active || Math.hypot(point.clientX-drag.startX, point.clientY-drag.startY) > 5;
              let targetId = drag.targetId ?? null;
              let targetItem = null;
              let dropMode = 'inside';
              let targetFound = false;
              let slotParentId = null;
              let slotIndex = null;
              if (active) {
                const pointEl = document.elementFromPoint(point.clientX, point.clientY);
                const itemEl = pointEl?.closest?.('[data-library-item]');
                const dropEl = pointEl?.closest?.('[data-library-drop]');
                if (itemEl?.dataset?.itemId) {
                  const itemUnderPointer = getLibraryItemById(itemEl.dataset.itemId);
                  if (itemUnderPointer && itemUnderPointer.source === drag.item.source && !sameId(itemUnderPointer.id, drag.item.id)) {
                    const rect = itemEl.getBoundingClientRect();
                    const relativeY = (point.clientY - rect.top) / Math.max(rect.height, 1);
                    if (relativeY < 0.35) dropMode = 'before';
                    else if (relativeY > 0.65 || !isFolderItem(itemUnderPointer)) dropMode = 'after';
                    else dropMode = 'inside';
                    targetItem = itemUnderPointer;
                    targetId = dropMode === 'inside' ? itemUnderPointer.id : getLibraryItemParentId(itemUnderPointer);
                    targetFound = isValidDrop(drag, targetId, dropMode, targetItem);
                    if (targetFound && dropMode !== 'inside') {
                      slotParentId = targetId || null;
                      const slotSiblings = sortLibraryItems(library.filter(candidate =>
                        candidate.source === drag.item.source &&
                        candidate.id !== drag.item.id &&
                        getLibraryItemParentId(candidate) === (slotParentId || null)
                      ));
                      const targetIndex = slotSiblings.findIndex(candidate=>sameId(candidate.id, itemUnderPointer.id));
                      slotIndex = targetIndex < 0 ? null : (dropMode === 'before' ? targetIndex : targetIndex + 1);
                    }
                  }
                }
                if (dropEl) {
                  if (!targetFound) {
                    targetId = getDropId(dropEl);
                    targetItem = null;
                    dropMode = 'inside';
                    slotParentId = null;
                    slotIndex = null;
                    targetFound = isValidDrop(drag, targetId, dropMode, null);
                  }
                  if (!targetFound) targetId = null;
                }
                if (targetId) setLibraryOpenFolders(p=>p[targetId]?p:{...p,[targetId]:true});
              }
              const nextDrag = {...drag,x:point.clientX,y:point.clientY,active,targetId,targetItem,dropMode,targetFound,slotParentId,slotIndex};
              libraryDragRef.current = nextDrag;
              setLibraryDrag(nextDrag);
            };
            const finishLibraryDrag = async (e) => {
              const drag = libraryDragRef.current || libraryDrag;
              if (!drag) return;
              stopLibraryDragEvent(e);
              if (e.pointerId !== undefined) e.currentTarget.releasePointerCapture?.(e.pointerId);
              libraryDragCleanupRef.current?.();
              libraryDragRef.current = null;
              setLibraryDrag(null);
              suppressLibraryClickUntil.current = Date.now() + 650;
              if (!drag.active || !drag.targetFound || !isValidDrop(drag, drag.targetId, drag.dropMode, drag.targetItem)) return;
              await reorderLibraryItem(drag.item, drag.targetId || null, drag.targetItem, drag.dropMode);
            };
            const cancelLibraryDrag = () => {
              libraryDragCleanupRef.current?.();
              libraryDragRef.current = null;
              setLibraryDrag(null);
              suppressLibraryClickUntil.current = Date.now() + 650;
            };
            const dragHandle = (item, type) => (
              <button
                onPointerDown={e=>startLibraryDrag(e,item,type)}
                onPointerMove={updateLibraryDrag}
                onPointerUp={finishLibraryDrag}
                onPointerCancel={e=>updateLibraryDrag(e)}
                onTouchStart={e=>startLibraryDrag(e,item,type)}
                onTouchMove={updateLibraryDrag}
                onTouchEnd={finishLibraryDrag}
                onTouchCancel={cancelLibraryDrag}
                onClick={e=>{e.preventDefault();e.stopPropagation();suppressLibraryClickUntil.current=Date.now()+650;}}
                title="Arrastar para mover"
                aria-label="Arrastar para mover"
                className={`h-8 w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none ${darkMode?'text-gray-500 hover:text-yellow-400 hover:bg-gray-700':'text-gray-400 hover:text-yellow-700 hover:bg-gray-100'}`}
              >
                <GripIcon className="w-4 h-4"/>
              </button>
	            );
	            const renderTreeSubject = (s, depth=0, siblings=[], index=0) => {
	              const pct=subjectProgress(s);
	              const totalTopics = s.topics.length;
	              const totalSubtopics = (s.topics || []).reduce((acc, topic)=>acc + (topic.subtopics || []).length, 0);
	              const totalQs = countSubjectQuestions(s);
	              const contentSummary = [
	                `${totalTopics} tópico${totalTopics!==1?'s':''}`,
	                totalSubtopics > 0 ? `${totalSubtopics} subtópico${totalSubtopics!==1?'s':''}` : null,
	                totalQs > 0 ? `${totalQs} quest${totalQs!==1?'ões':'ão'}` : null,
	              ].filter(Boolean).join(' · ');
	              const dragging = libraryDrag?.item?.id === s.id;
              const parentId = getLibraryItemParentId(s);
              const beforeTarget = isSlotActive(parentId, index);
              const afterTarget = index === siblings.length - 1 && isSlotActive(parentId, siblings.length);
              const mobilePad = 4 + depth*8;
              const desktopPad = 12 + depth*18;
              const openSubject = () => {
                if (Date.now() <= suppressLibraryClickUntil.current) return;
                setActiveSubjectId(s.id);
                setView('subject');
              };
              const actions = s.id==='imported-folder' ? [] : [
                s.source==='academia' && countSubjectQuestions(s)>0 ? {
                  label:'Limpar respostas da fixação',
                  icon:<Eraser className="w-3.5 h-3.5"/>,
                  fn:()=>clearAcademiaFixationAnswersForTargets(getAcademiaSubjectFixationTargets(s)),
                  extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300',
                  danger:true,
	                } : null,
	                isAdmin && s.source !== 'academia' ? {
	                  label:'Copiar bloco',
	                  icon:<Copy className="w-3.5 h-3.5"/>,
	                  fn:()=>duplicateSubjectBlock(s),
	                } : null,
	                {label:'Renomear', icon:<EditIcon className="w-3.5 h-3.5"/>, fn:()=>{setEditingSub(s.id);setEditingSubName(s.title);}},
	                {label:'Excluir', icon:<Trash2 className="w-3.5 h-3.5"/>, fn:()=>setDeleteId({type:'subject',id:s.id}), extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300', danger:true},
	              ].filter(Boolean);
              return (
                <div key={s.id} data-library-item data-item-id={s.id} data-item-type="subject" data-library-drop data-drop-id={s.folderId || 'root'} className={`group border-b last:border-b-0 transition-colors relative ${rowBorder} ${rowHover} ${(beforeTarget||afterTarget)?(darkMode?'bg-yellow-900/5':'bg-yellow-50/30'):''} ${dragging?'opacity-40':''}`}>
                  {depth>0&&<span className={`absolute left-3 top-0 bottom-0 w-px ${darkMode?'bg-gray-800':'bg-gray-200'}`}/>}
                  {beforeTarget&&dropSlot('before')}
                  {afterTarget&&dropSlot('after')}
                  <div className="md:hidden px-2.5 py-2" style={{paddingLeft:mobilePad}}>
                    <div className="flex items-center gap-1.5">
                      {s.id!=='imported-folder'?dragHandle(s,'subject'):<span className="w-6 flex-shrink-0"/>}
                      <span className="w-3 flex-shrink-0"/>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>{s.source==='academia'?<AcademiaIcon className="w-3.5 h-3.5"/>:<BlockIcon className="w-3.5 h-3.5"/>}</div>
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
	                        <button onClick={openSubject} className="min-w-0 flex-1 text-left">
	                          <h3 className="font-bold text-sm leading-tight truncate">{s.title}</h3>
	                          <p className="text-xs opacity-50 mt-0.5 leading-snug truncate">{contentSummary} · {pct}%</p>
	                        </button>
                        {actions.length>0&&mobileActionsMenu(`subject-${s.id}`, actions)}
                      </div>
                    </div>
                  </div>
                  <div onClick={openSubject} className="hidden md:flex items-center gap-3 py-3 pr-4 cursor-pointer" style={{paddingLeft:desktopPad}}>
                    {s.id!=='imported-folder'?dragHandle(s,'subject'):<span className="w-8 flex-shrink-0"/>}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>{s.source==='academia'?<AcademiaIcon className="w-4 h-4"/>:<BlockIcon className="w-4 h-4"/>}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">{s.title}</h3>
                    </div>
	                    <div className="w-64 flex-shrink-0 text-sm opacity-60">{contentSummary}</div>
                    <div className="w-32 flex-shrink-0 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${pct}%`}}/></div>
                      <span className="text-xs font-bold text-yellow-600">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 flex-shrink-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                      {renderActionButtons(actions)}
                    </div>
                  </div>
                </div>
              );
            };
            const renderTreeFolder = (folder, depth=0, siblings=[], index=0) => {
              const open = libraryOpenFolders[folder.id] ?? false;
              const lockedMirrorRoot = isProtectedMirrorRootFolder(folder);
              const FolderGlyph = isAcademiaMirrorRootFolder(folder) ? AcademiaIcon : isErrorNotebookRootFolder(folder) ? BookOpen : FolderIcon;
              const totalQs = countFolderQuestions(folder);
              const totalSubjects = getSubjectsInFolderTree(folder).length;
              const dropActive = isDropActive(folder.id);
              const dragging = libraryDrag?.item?.id === folder.id;
              const parentId = getLibraryItemParentId(folder);
              const beforeTarget = isSlotActive(parentId, index);
              const afterTarget = index === siblings.length - 1 && isSlotActive(parentId, siblings.length);
              const mobilePad = 4 + depth*8;
              const desktopPad = 12 + depth*18;
              const openFolderView = () => {
                if (Date.now() <= suppressLibraryClickUntil.current) return;
                setActiveFolderId(folder.id);
              };
              const actions = lockedMirrorRoot ? [] : [
                libFilter==='academia' && totalQs>0 ? {
                  label:'Limpar respostas da fixação',
                  icon:<Eraser className="w-3.5 h-3.5"/>,
                  fn:()=>clearAcademiaFixationAnswersForTargets(getAcademiaFolderFixationTargets(folder)),
                  extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300',
                  danger:true,
                } : null,
                {label:'Nova filha', icon:<PlusIcon className="w-3.5 h-3.5"/>, fn:()=>{setLibraryOpenFolders(p=>({...p,[folder.id]:true}));setNewFolderParentId(folder.id);setNewFolderName('');setNewFolderModal(true);}},
                {label:'Renomear', icon:<EditIcon className="w-3.5 h-3.5"/>, fn:()=>{setEditingSub(folder.id);setEditingSubName(folder.title);}},
                {label:'Excluir', icon:<Trash2 className="w-3.5 h-3.5"/>, fn:()=>setDeleteId({type:'folder',id:folder.id}), extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300', danger:true},
              ].filter(Boolean);
              return (
                <React.Fragment key={folder.id}>
                  <div data-library-item data-item-id={folder.id} data-item-type="folder" data-library-drop data-drop-id={folder.id} className={`group border-b transition-colors relative ${rowBorder} ${rowHover} ${dropActive?(darkMode?'bg-yellow-900/25 ring-1 ring-inset ring-yellow-700':'bg-yellow-50 ring-1 ring-inset ring-yellow-300'):''} ${(beforeTarget||afterTarget)?(darkMode?'bg-yellow-900/5':'bg-yellow-50/30'):''} ${dragging?'opacity-40':''}`}>
                    {depth>0&&<span className={`absolute left-3 top-0 bottom-0 w-px ${darkMode?'bg-gray-800':'bg-gray-200'}`}/>}
                    {beforeTarget&&dropSlot('before')}
                    {afterTarget&&dropSlot('after')}
                    <div className="md:hidden px-2.5 py-2" style={{paddingLeft:mobilePad}}>
                      <div className="flex items-center gap-1.5">
                        {lockedMirrorRoot?<span className="w-6 flex-shrink-0"/>:dragHandle(folder,'folder')}
                        <button onClick={e=>{e.stopPropagation();toggleLibraryFolder(folder.id);}} title={open?'Recolher':'Expandir'} className={`h-8 w-4 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
                          {open?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}><FolderGlyph className="w-4 h-4"/></div>
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <button onClick={openFolderView} className="min-w-0 flex-1 text-left">
                            <h3 className="font-bold text-sm leading-tight truncate">{folder.title}</h3>
                            <p className="text-xs opacity-50 mt-0.5 leading-snug truncate">{totalSubjects} assunto{totalSubjects!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''}</p>
                          </button>
                          {actions.length>0&&<div className="flex-shrink-0">{mobileActionsMenu(`folder-${folder.id}`, actions)}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 py-3 pr-4" style={{paddingLeft:desktopPad}}>
                    {lockedMirrorRoot?<span className="w-8 flex-shrink-0"/>:dragHandle(folder,'folder')}
                      <button onClick={e=>{e.stopPropagation();toggleLibraryFolder(folder.id);}} title={open?'Recolher':'Expandir'} className={`h-8 w-5 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
                        {open?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                      </button>
                      <button onClick={openFolderView} className="min-w-0 flex-1 flex items-center gap-3 text-left">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}><FolderGlyph className="w-5 h-5"/></div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm truncate">{folder.title}</h3>
                        </div>
                      </button>
                      <div className="w-64 flex-shrink-0 text-sm opacity-60">{totalSubjects} assunto{totalSubjects!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''}</div>
                      <div className="w-32 flex-shrink-0 text-xs opacity-40">Pasta</div>
                      <div className="flex items-center justify-end gap-1.5 flex-shrink-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderActionButtons(actions)}
                      </div>
                    </div>
                  </div>
                  {open&&(
                    <>
                      {directItems(folder.id).map((item,index,items)=>renderTreeItem(item, depth+1, items, index))}
                    </>
                  )}
                </React.Fragment>
              );
            };
            const renderTreeItem = (item, depth=0, siblings=[], index=0) => isFolderItem(item) ? renderTreeFolder(item, depth, siblings, index) : renderTreeSubject(item, depth, siblings, index);
            return (
              <div>
                <div className="mb-6">
                  <button onClick={()=>activeFolderId?setActiveFolderId(activeFolder?.parentFolderId || null):setView('library')} className={`flex items-center gap-2 mb-4 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                    <ArrowLeft className="w-4 h-4"/>{activeFolderId?'Voltar':'Acervos'}
                  </button>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 mb-2 flex-wrap">
                        <button data-library-drop data-drop-id="root" onClick={()=>setActiveFolderId(null)} className="hover:text-yellow-600">{sourceTitle}</button>
                        <ChevronRight className="w-3 h-3"/>
                        <button data-library-drop data-drop-id="root" onClick={()=>setActiveFolderId(null)} className="hover:text-yellow-600">Raiz</button>
                        {getFolderPath(activeFolderId).map(folder => (
                          <React.Fragment key={folder.id}>
                            <ChevronRight className="w-3 h-3"/>
                            <button data-library-drop data-drop-id={folder.id} onClick={()=>setActiveFolderId(folder.id)} className="hover:text-yellow-600">{folder.title}</button>
                          </React.Fragment>
                        ))}
                      </div>
                      <h2 className="text-3xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight sm:truncate">{activeFolder?.title || sourceTitle}</h2>
                      <p className="text-sm opacity-50 mt-1">{treeItemCount} item{treeItemCount!==1?'s':''} nesta pasta</p>
	                    </div>
	                    <div className="flex flex-wrap gap-2">
                        {!activeFolderLocked&&<button onClick={()=>{setNewFolderParentId(activeFolderId || null);setNewFolderName('');setNewFolderModal(true);}} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}><PlusIcon className="w-4 h-4"/>Nova pasta</button>}
                        {(libFilter!=='academia'||canUseAcademia)&&<button onClick={primaryAction} className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2 text-sm">{primaryIcon}{primaryLabel}</button>}
                      </div>
                  </div>
                  {(libraryLoading || libraryLoadError) && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${libraryLoadError ? (darkMode?'border-red-900/60 bg-red-950/20 text-red-200':'border-red-200 bg-red-50 text-red-800') : (darkMode?'border-gray-700 bg-gray-900 text-gray-300':'border-gray-200 bg-gray-50 text-gray-700')}`}>
                      {libraryLoading ? <Spinner className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600"/> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0"/>}
                      <span className="min-w-0 flex-1">
                        {libraryLoading ? 'Sincronizando biblioteca...' : `Nao consegui sincronizar a biblioteca agora (${libraryLoadError}). Mostrei o cache/local quando disponivel.`}
                      </span>
                    </div>
                  )}
                  <div className={`mt-4 pt-4 border-t flex flex-wrap items-center gap-2 ${darkMode?'border-gray-800':'border-gray-100'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-35 mr-1">Estudar e organizar</span>
	                      {activeFolder&&libFilter==='academia'&&countFolderQuestions(activeFolder)>0&&(()=>{
	                        const id = `active-folder-actions-${activeFolder.id}`;
	                        return (
	                          <div className="relative">
	                            <button
	                              onClick={()=>setLibraryActionMenu(p=>p===id?null:id)}
			                        title="Ações do bloco"
			                        aria-label="Ações do bloco"
	                              className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-yellow-700'}`}>
	                              <MoreIcon className="w-5 h-5"/>
	                            </button>
	                            {libraryActionMenu===id&&(
	                              <div className={`mobile-safe-action-menu absolute right-0 top-12 z-50 w-64 rounded-xl border shadow-xl overflow-hidden ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
	                                <button
	                                  onClick={()=>{setLibraryActionMenu(null);clearAcademiaFixationAnswersForTargets(getAcademiaFolderFixationTargets(activeFolder));}}
	                                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-bold transition-colors ${darkMode?'text-red-300 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'}`}>
	                                  <Eraser className="w-4 h-4"/>
	                                  <span className="flex-1">Limpar respostas da fixação</span>
	                                </button>
	                              </div>
	                            )}
	                          </div>
	                        );
	                      })()}
			                      {isAdmin&&activeFolder&&<button onClick={()=>openFolderReview(activeFolder)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-green-700 text-green-400 hover:bg-green-900/20':'border-green-400 text-green-700 hover:bg-green-50'}`}><RepeatIcon className="w-4 h-4"/>Estudo personalizado</button>}
	                      {activeFolder&&activeFolderErrorCount>0&&<button onClick={()=>openFolderErrorReview(activeFolder)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}><BookOpen className="w-4 h-4"/>Caderno de erros ({activeFolderErrorCount})</button>}
	                      {libFilter==='external'&&<button onClick={()=>setExternalPromptModal(true)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'} ${copiedPrompt?'ring-2 ring-yellow-500 text-yellow-600':''}`}>{copiedPrompt?<CheckCircle2 className="w-4 h-4 text-yellow-500"/>:<Copy className="w-4 h-4"/>}{copiedPrompt?'Copiado':'Prompt'}</button>}
	                      {treeFolderIds.length>0&&<button onClick={()=>setAllTreeFoldersOpen(!allTreeFoldersOpen)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{allTreeFoldersOpen?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}{allTreeFoldersOpen?'Recolher tudo':'Expandir tudo'}</button>}
                  </div>
                </div>

                <div data-library-drop data-drop-id={treeRootId || 'root'} className={`rounded-xl border overflow-visible md:overflow-hidden ${isDropActive(treeRootId)?(darkMode?'ring-2 ring-yellow-700 bg-yellow-900/10':'ring-2 ring-yellow-300 bg-yellow-50/40'):''} ${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                  <div className={`hidden md:flex items-center gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b ${darkMode?'border-gray-800 text-gray-500 bg-gray-950/40':'border-gray-100 text-gray-400 bg-gray-50'}`}>
                    <span className="w-8 flex-shrink-0"/>
                    <span className="flex-1 min-w-0">Nome</span>
                    <span className="w-64 flex-shrink-0">Conteúdo</span>
                    <span className="w-32 flex-shrink-0">Progresso</span>
                    <span className="w-32 flex-shrink-0 text-right">Ações</span>
                  </div>
                  {treeItemCount===0&&(
                    <div className="p-4">
                      <EmptyState
                        darkMode={darkMode}
                        icon={<FolderIcon className="w-7 h-7"/>}
                        title="Nada aqui ainda"
                        message="Crie uma pasta ou adicione um assunto para começar a organizar este acervo."
                      />
                    </div>
                  )}
                  {treeItems.map((item,index,items)=>renderTreeItem(item,0,items,index))}
                </div>
                {libraryDrag?.active&&(
                  <div className={`fixed z-[80] pointer-events-none rounded-xl border px-3 py-2 text-sm font-bold shadow-2xl ${darkMode?'bg-gray-800 border-yellow-700 text-yellow-300':'bg-white border-yellow-300 text-yellow-800'}`} style={{left:libraryDrag.x+12,top:libraryDrag.y+12,maxWidth:280}}>
                    <div className="flex items-center gap-2 min-w-0">
                      {libraryDrag.type==='folder'?(isAcademiaMirrorRootFolder(libraryDrag.item)?<AcademiaIcon className="w-4 h-4 flex-shrink-0"/>:isErrorNotebookRootFolder(libraryDrag.item)?<BookOpen className="w-4 h-4 flex-shrink-0"/>:<FolderIcon className="w-4 h-4 flex-shrink-0"/>):<BlockIcon className="w-4 h-4 flex-shrink-0"/>}
                      <span className="truncate">{libraryDrag.item.title}</span>
                    </div>
                    <p className="text-[11px] opacity-60 mt-0.5">{libraryDrag.targetFound?(libraryDrag.dropMode==='inside'?'Solte dentro da pasta':'Solte para reordenar'):'Arraste até uma pasta ou linha'}</p>
                  </div>
                )}
              </div>
            );
}
