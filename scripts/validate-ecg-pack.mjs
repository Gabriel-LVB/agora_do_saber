import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const inputRoot = process.argv[2];
if (!inputRoot) {
  console.error('Uso: npm run validate:ecg -- <diretorio-extraido-do-pacote>');
  process.exit(2);
}

const root = path.resolve(inputRoot);
const errors = [];
const warnings = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const warn = (condition, message) => {
  if (!condition) warnings.push(message);
};
const exists = async file => access(file).then(() => true).catch(() => false);
const isV3 = await exists(path.join(root, 'data', 'dataset_manifest_v3.json'));
const dataRoot = path.join(root, isV3 ? 'data' : 'dados_v2');
const readJson = async name => JSON.parse(await readFile(path.join(dataRoot, name), 'utf8'));
const readJsonl = async name => (await readFile(path.join(dataRoot, name), 'utf8'))
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch(error) {
      throw new Error(`${name}:${index + 1}: JSON inválido (${error.message})`);
    }
  });
const unique = (values, label) => {
  const seen = new Set();
  values.forEach(value => {
    check(value !== null && value !== undefined && value !== '', `${label}: valor vazio`);
    check(!seen.has(value), `${label}: duplicado ${value}`);
    seen.add(value);
  });
  return seen;
};
const expectedCaseIds = Array.from(
  { length:150 },
  (_, index) => `ECG${String(index + 1).padStart(3, '0')}`,
);
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const safeAssetPath = assetPath => {
  const normalized = String(assetPath || '').replaceAll('\\', '/');
  const resolved = path.resolve(root, ...normalized.split('/'));
  return normalized
    && !path.isAbsolute(normalized)
    && !normalized.split('/').includes('..')
    && (resolved === root || resolved.startsWith(`${root}${path.sep}`))
    ? resolved
    : null;
};
const jpegDimensions = buffer => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if ([0xd8, 0xd9].includes(marker)) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return {
        height:buffer.readUInt16BE(offset + 3),
        width:buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
};

if (isV3) {
  const requiredV3Files = [
    'activation_manifest.json',
    'content_rights.json',
    'dataset_manifest_v3.json',
    'ecg_asset_inventory_v3.json',
    'ecg_asset_issues_v3.json',
    'ecg_case_concept_matrix.json',
    'ecg_cases_v3.jsonl',
    'ecg_catalog_admin_staging.json',
    'ecg_catalog_pre_answer_safe.json',
    'ecg_clusters.json',
    'ecg_concepts.json',
    'ecg_learning_path.json',
    'ecg_microtask_candidates_v3.jsonl',
    'ecg_relations.json',
    'ecg_training_candidates_v3.jsonl',
    'ecg_visual_tags.json',
    'high_priority_review_cases.json',
    'medical_validation_queue.csv',
    'validation_v3.json',
  ];
  for (const name of requiredV3Files) {
    check(await exists(path.join(dataRoot, name)), `arquivo obrigatório ausente: data/${name}`);
  }
  for (const name of [
    'AUDIT_RESOLUTION.md',
    'IMPORT_AND_ACTIVATION_CONTRACT.md',
    'MEDICAL_VALIDATION.md',
    'RIGHTS_AND_AUTHORIZATION.md',
  ]) {
    check(await exists(path.join(root, 'docs', name)), `documentação obrigatória ausente: docs/${name}`);
  }
  if (errors.length) {
    console.error(JSON.stringify({ ok:false, schemaVersion:3, root, errors, warnings }, null, 2));
    process.exit(1);
  }

  const [
    activation,
    rights,
    manifest,
    assets,
    assetIssues,
    matrix,
    cases,
    adminCatalog,
    publicCatalog,
    clusters,
    concepts,
    learningPath,
    microtasks,
    relations,
    trainingCases,
    visualTags,
    highPriorityCases,
    declaredValidation,
  ] = await Promise.all([
    readJson('activation_manifest.json'),
    readJson('content_rights.json'),
    readJson('dataset_manifest_v3.json'),
    readJson('ecg_asset_inventory_v3.json'),
    readJson('ecg_asset_issues_v3.json'),
    readJson('ecg_case_concept_matrix.json'),
    readJsonl('ecg_cases_v3.jsonl'),
    readJson('ecg_catalog_admin_staging.json'),
    readJson('ecg_catalog_pre_answer_safe.json'),
    readJson('ecg_clusters.json'),
    readJson('ecg_concepts.json'),
    readJson('ecg_learning_path.json'),
    readJsonl('ecg_microtask_candidates_v3.jsonl'),
    readJson('ecg_relations.json'),
    readJsonl('ecg_training_candidates_v3.jsonl'),
    readJson('ecg_visual_tags.json'),
    readJson('high_priority_review_cases.json'),
    readJson('validation_v3.json'),
  ]);

  const validateCaseList = (items, idField, label) => {
    check(items.length === 150, `${label}: esperados 150 registros; encontrados ${items.length}`);
    const ids = unique(items.map(item => item[idField]), `${label}.${idField}`);
    check(expectedCaseIds.every(id => ids.has(id)), `${label}: sequência de casos incompleta`);
  };
  validateCaseList(cases, 'id', 'casos v3');
  validateCaseList(adminCatalog, 'id', 'catálogo admin');
  validateCaseList(publicCatalog, 'id', 'catálogo pré-resposta');
  validateCaseList(trainingCases, 'caseId', 'candidatos de treino');
  validateCaseList(microtasks, 'caseId', 'candidatos de microtarefas');
  const caseIds = new Set(cases.map(item => item.id));
  const conceptIds = unique(concepts.map(item => item.id), 'conceptId');
  const moduleIds = unique(learningPath.map(item => item.moduleId), 'moduleId');
  unique(visualTags.map(item => item.id), 'visualTag');
  unique(cases.map(item => item.stableAssetKey), 'stableAssetKey');

  concepts.forEach(item => {
    check(!item.parentId || conceptIds.has(item.parentId), `${item.id}: parentId inexistente`);
  });
  cases.forEach(item => {
    check(item.schemaVersion === 3, `${item.id}: schemaVersion diferente de 3`);
    check(item.contentOrigin?.rightsRecord === 'data/content_rights.json', `${item.id}: rightsRecord divergente`);
    check(item.medicalValidation?.status === 'pending_independent_review', `${item.id}: status médico não está pendente`);
    check(item.medicalValidation?.independentImageReviewCompleted === false, `${item.id}: revisão independente indevidamente marcada`);
    check(item.medicalValidation?.validatedDiagnosis === null, `${item.id}: diagnóstico validado sem revisão`);
    check(item.runtimeActivation?.metadataImportEligible === true, `${item.id}: metadado não elegível para staging`);
    for (const flag of [
      'diagnosisTrainingEnabled',
      'microtasksEnabled',
      'questionImageMatchingEnabled',
      'spacedReviewEnabled',
    ]) {
      check(item.runtimeActivation?.[flag] === false, `${item.id}: ${flag} deve iniciar falso`);
    }
    check(item.questionMatchingCandidate?.managementUse?.enabled === false, `${item.id}: conduta habilitada`);
    check(item.sourceAnnotation?.isIndependentImageValidation === false, `${item.id}: anotação-fonte tratada como validação`);
    check(item.sourceDerivedDiagnosis?.independentlyReinterpretedFromImage === false, `${item.id}: diagnóstico derivado tratado como laudo`);
    check(moduleIds.has(item.moduleId), `${item.id}: moduleId inexistente`);
    (item.conceptIds || []).forEach(id => check(conceptIds.has(id), `${item.id}: conceptId inexistente ${id}`));
    check(item.assets?.some(asset => asset.type === 'ecg' && asset.role === 'principal'), `${item.id}: ECG principal ausente`);
  });

  const forbiddenPublicKeys = new Set([
    'answer',
    'canonicalCaseId',
    'conceptIds',
    'diagnosis',
    'diagnosisText',
    'keyFindings',
    'primaryConceptId',
    'sourceDiagnosis',
    'variationCaseIds',
  ]);
  const findForbiddenKey = (value, trail = '') => {
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => {
      const location = trail ? `${trail}.${key}` : key;
      if (forbiddenPublicKeys.has(key)) errors.push(`catálogo pré-resposta revela campo ${location}`);
      findForbiddenKey(child, location);
    });
  };
  publicCatalog.forEach(item => {
    findForbiddenKey(item, item.id);
    check(item.runtimeStatus === 'pending_medical_validation', `${item.id}: status público inesperado`);
    check(typeof item.preAnswerAlt === 'string' && item.preAnswerAlt.trim(), `${item.id}: alt pré-resposta ausente`);
  });
  trainingCases.forEach(item => {
    check(item.enabled === false, `${item.caseId}: candidato de treino habilitado`);
    check(item.status === 'candidate_pending_independent_medical_validation', `${item.caseId}: status de treino inesperado`);
  });
  microtasks.forEach(item => {
    check(item.enabled === false, `${item.caseId}: microtarefa habilitada`);
    check(item.status === 'candidate_pending_independent_medical_validation', `${item.caseId}: status de microtarefa inesperado`);
  });

  learningPath.forEach(module => {
    (module.conceptIds || []).forEach(id => check(conceptIds.has(id), `${module.moduleId}: conceito inexistente ${id}`));
    (module.prerequisiteModuleIds || []).forEach(id => check(moduleIds.has(id), `${module.moduleId}: pré-requisito inexistente ${id}`));
    (module.caseIds || []).forEach(id => check(caseIds.has(id), `${module.moduleId}: caso inexistente ${id}`));
    (module.recommendedCaseOrder || []).forEach(id => check(caseIds.has(id), `${module.moduleId}: ordem contém caso inexistente ${id}`));
  });
  relations.forEach((relation, index) => {
    check(caseIds.has(relation.sourceId), `relação ${index}: sourceId inexistente`);
    check(caseIds.has(relation.targetId), `relação ${index}: targetId inexistente`);
    check(relation.sourceId !== relation.targetId, `relação ${index}: autorrelação`);
    (relation.conceptIds || []).forEach(id => check(conceptIds.has(id), `relação ${index}: conceito inexistente ${id}`));
  });
  clusters.forEach(cluster => {
    check(conceptIds.has(cluster.conceptId), `${cluster.clusterId}: conceito inexistente`);
    check((cluster.caseIds || []).includes(cluster.canonicalCaseId), `${cluster.clusterId}: canônico fora do cluster`);
    (cluster.caseIds || []).forEach(id => check(caseIds.has(id), `${cluster.clusterId}: caso inexistente ${id}`));
    (cluster.variationCaseIds || []).forEach(id => check((cluster.caseIds || []).includes(id), `${cluster.clusterId}: variação fora do cluster`));
  });
  matrix.forEach((entry, index) => {
    check(caseIds.has(entry.caseId), `matriz ${index}: caso inexistente`);
    check(conceptIds.has(entry.conceptId), `matriz ${index}: conceito inexistente`);
    check(Number(entry.weight) > 0 && Number(entry.weight) <= 1, `matriz ${index}: peso inválido`);
  });

  const assetIds = unique(assets.map(item => item.assetId), 'assetId');
  const assetPaths = unique(assets.map(item => item.runtimePath), 'asset.runtimePath');
  const hashGroups = new Map();
  for (const asset of assets) {
    check(caseIds.has(asset.caseId), `${asset.assetId}: caso inexistente`);
    check(asset.type === 'ecg', `${asset.assetId}: asset não ECG no runtime`);
    check(asset.runtimeEligible === true, `${asset.assetId}: asset não elegível`);
    check(asset.answerLeakRisk === 'none_detected_by_source_role_and_filename', `${asset.assetId}: risco de resposta`);
    check(typeof asset.preAnswerAlt === 'string' && asset.preAnswerAlt.trim(), `${asset.assetId}: alt pré-resposta ausente`);
    const file = safeAssetPath(asset.runtimePath);
    check(!!file, `${asset.assetId}: caminho inseguro`);
    if (!file || !(await exists(file))) {
      errors.push(`${asset.assetId}: arquivo ausente ${asset.runtimePath}`);
      continue;
    }
    const buffer = await readFile(file);
    const actualHash = sha256(buffer);
    check(actualHash === asset.sha256, `${asset.assetId}: SHA-256 divergente`);
    const dimensions = jpegDimensions(buffer);
    check(!!dimensions, `${asset.assetId}: JPEG inválido ou sem dimensões`);
    if (dimensions) {
      check(dimensions.width === asset.width && dimensions.height === asset.height, `${asset.assetId}: dimensões divergentes`);
    }
    if (!hashGroups.has(actualHash)) hashGroups.set(actualHash, []);
    hashGroups.get(actualHash).push(asset.caseId);
  }
  cases.forEach(item => {
    (item.assets || []).forEach(asset => {
      check(assetIds.has(asset.assetId), `${item.id}: asset não inventariado ${asset.assetId}`);
      check(assetPaths.has(asset.runtimePath), `${item.id}: path não inventariado ${asset.runtimePath}`);
    });
  });
  publicCatalog.forEach(item => check(assetPaths.has(item.assetPath), `${item.id}: assetPath público inexistente`));
  const duplicateGroups = [...hashGroups.values()].filter(group => group.length > 1);
  check(duplicateGroups.length === 0, `assets ECG exatamente duplicados: ${JSON.stringify(duplicateGroups)}`);
  const principalAssets = assets.filter(asset => asset.role === 'principal');
  check(principalAssets.length === 150, `esperados 150 ECGs principais; encontrados ${principalAssets.length}`);
  const asset047 = assets.find(asset => asset.caseId === 'ECG047' && asset.role === 'principal');
  const asset109 = assets.find(asset => asset.caseId === 'ECG109' && asset.role === 'principal');
  check(asset047?.sha256 && asset109?.sha256 && asset047.sha256 !== asset109.sha256, 'ECG047/ECG109 continuam com ECG principal duplicado');

  check(highPriorityCases.length === 25, `esperados 25 casos prioritários; encontrados ${highPriorityCases.length}`);
  highPriorityCases.forEach(item => check(caseIds.has(item.caseId), `prioridade alta contém caso inexistente ${item.caseId}`));
  check(activation.importMode === 'staging', 'activation_manifest não está em staging');
  check(activation.structuralImportAllowed === true, 'importação estrutural não permitida');
  check(activation.runtimeTrainingGloballyEnabled === false, 'treino global habilitado');
  check(activation.managementQuestionGenerationEnabled === false, 'conduta global habilitada');
  check(activation.questionImageMatchingGloballyEnabled === false, 'matching global habilitado');
  check(manifest.medicalValidationComplete === false, 'manifesto diz que validação médica terminou');
  check(manifest.runtimeTrainingEnabled === false, 'manifesto habilita treino');
  check(manifest.answerPageAssetsIncluded === false, 'manifesto inclui assets de resposta');
  check(manifest.radiographsIncluded === false, 'manifesto inclui radiografias');
  check(declaredValidation.caseCount === cases.length, 'validation_v3 diverge no total de casos');
  check(declaredValidation.runtimeAssetCount === assets.length, 'validation_v3 diverge no total de assets');
  check(declaredValidation.runtimeExactDuplicateEcgGroups === duplicateGroups.length, 'validation_v3 diverge nas duplicatas');

  warn(
    rights.authorizationBasis !== 'owner_declaration_provided_in_project_context',
    'registro de direitos é apenas uma declaração de titularidade e requer confirmação explícita do responsável',
  );
  warn(
    cases.every(item => item.contentOrigin?.externalBookSource !== false),
    'pacote marca externalBookSource=false; o validador não consegue comprovar essa afirmação',
  );
  warn(
    false,
    '150 diagnósticos continuam pendentes de releitura independente; somente staging administrativo é admissível',
  );
  const radiographFindings = cases.filter(item =>
    item.sourceDerivedKeyFindings?.some(entry => /radiograf|raio[\s-]?x/i.test(entry.finding))
  ).length;
  warn(
    radiographFindings === 0,
    `${radiographFindings} casos ainda contêm achados textuais de radiografia; filtrar antes de gerar treino apenas com ECG`,
  );
  check(
    assetIssues.every(issue => String(issue.severity).startsWith('resolved_')),
    'ecg_asset_issues_v3 contém problema não resolvido para runtime',
  );

  const report = {
    ok:errors.length === 0,
    schemaVersion:3,
    importMode:'staging',
    root,
    counts:{
      cases:cases.length,
      concepts:concepts.length,
      assets:assets.length,
      principalAssets:principalAssets.length,
      relations:relations.length,
      clusters:clusters.length,
      highPriorityCases:highPriorityCases.length,
      exactDuplicateGroups:duplicateGroups.length,
      radiographFindings,
    },
    errors,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(errors.length ? 1 : 0);
}

const requiredFiles = [
  'ecg_asset_inventory.json',
  'ecg_asset_issues.json',
  'ecg_case_concept_matrix.json',
  'ecg_cases_v2.jsonl',
  'ecg_catalog_internal.json',
  'ecg_catalog_public_safe.json',
  'ecg_clusters.json',
  'ecg_concepts.json',
  'ecg_learning_path.json',
  'ecg_microtasks.jsonl',
  'ecg_relations.json',
  'ecg_training_cases.jsonl',
  'ecg_visual_tags.json',
  'validation.json',
];
for (const name of requiredFiles) {
  check(await exists(path.join(dataRoot, name)), `arquivo obrigatório ausente: dados_v2/${name}`);
}
if (errors.length) {
  console.error(JSON.stringify({ ok:false, root, errors, warnings }, null, 2));
  process.exit(1);
}

const [
  assets,
  assetIssues,
  matrix,
  cases,
  internalCatalog,
  publicCatalog,
  clusters,
  concepts,
  learningPath,
  microtasks,
  relations,
  trainingCases,
  visualTags,
  declaredValidation,
] = await Promise.all([
  readJson('ecg_asset_inventory.json'),
  readJson('ecg_asset_issues.json'),
  readJson('ecg_case_concept_matrix.json'),
  readJsonl('ecg_cases_v2.jsonl'),
  readJson('ecg_catalog_internal.json'),
  readJson('ecg_catalog_public_safe.json'),
  readJson('ecg_clusters.json'),
  readJson('ecg_concepts.json'),
  readJson('ecg_learning_path.json'),
  readJsonl('ecg_microtasks.jsonl'),
  readJson('ecg_relations.json'),
  readJsonl('ecg_training_cases.jsonl'),
  readJson('ecg_visual_tags.json'),
  readJson('validation.json'),
]);

const caseIds = unique(cases.map(item => item.id), 'caseId');
const caseById = new Map(cases.map(item => [item.id, item]));
check(cases.length === 150, `esperados 150 casos; encontrados ${cases.length}`);
check(expectedCaseIds.every(id => caseIds.has(id)), 'sequência ECG001..ECG150 incompleta');
unique(cases.map(item => item.stableAssetKey), 'stableAssetKey');
const conceptIds = unique(concepts.map(item => item.id), 'conceptId');
const moduleIds = unique(learningPath.map(item => item.moduleId), 'moduleId');
unique(visualTags.map(item => item.id), 'visualTag');
concepts.forEach(item => {
  check(!item.parentId || conceptIds.has(item.parentId), `${item.id}: parentId inexistente`);
});

const validateCaseList = (items, idField, label) => {
  check(items.length === 150, `${label}: esperados 150 registros; encontrados ${items.length}`);
  const ids = unique(items.map(item => item[idField]), `${label}.${idField}`);
  check(expectedCaseIds.every(id => ids.has(id)), `${label}: sequência de casos incompleta`);
};
validateCaseList(publicCatalog, 'id', 'catálogo público');
validateCaseList(internalCatalog, 'id', 'catálogo interno');
validateCaseList(trainingCases, 'caseId', 'treino');
validateCaseList(microtasks, 'caseId', 'microtarefas');

const forbiddenPublicKeys = new Set([
  'answer',
  'canonicalCaseId',
  'conceptIds',
  'diagnosis',
  'keyFindings',
  'primaryConceptId',
  'sourceDiagnosis',
  'variationCaseIds',
]);
const findForbiddenKey = (value, trail = '') => {
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    const location = trail ? `${trail}.${key}` : key;
    if (forbiddenPublicKeys.has(key)) errors.push(`catálogo público revela campo ${location}`);
    findForbiddenKey(child, location);
  });
};
publicCatalog.forEach(item => findForbiddenKey(item, item.id));

cases.forEach(item => {
  check(item.schemaVersion === 2, `${item.id}: schemaVersion diferente de 2`);
  check(conceptIds.has(item.primaryConceptId), `${item.id}: primaryConceptId inexistente`);
  check((item.conceptIds || []).includes(item.primaryConceptId), `${item.id}: conceito primário fora de conceptIds`);
  (item.conceptIds || []).forEach(id => check(conceptIds.has(id), `${item.id}: conceptId inexistente ${id}`));
  check(moduleIds.has(item.moduleId), `${item.id}: moduleId inexistente`);
  check(item.diagnosis?.independentlyReinterpretedFromImage === false, `${item.id}: proveniência cardiológica inesperada`);
  check(item.assets?.some(asset => asset.type === 'ecg' && asset.role === 'principal'), `${item.id}: ECG principal ausente`);
});

learningPath.forEach(module => {
  (module.conceptIds || []).forEach(id => check(conceptIds.has(id), `${module.moduleId}: conceito inexistente ${id}`));
  (module.prerequisiteModuleIds || []).forEach(id => check(moduleIds.has(id), `${module.moduleId}: pré-requisito inexistente ${id}`));
  (module.caseIds || []).forEach(id => check(caseIds.has(id), `${module.moduleId}: caso inexistente ${id}`));
  (module.recommendedCaseOrder || []).forEach(id => check(caseIds.has(id), `${module.moduleId}: ordem contém caso inexistente ${id}`));
});
relations.forEach((relation, index) => {
  check(caseIds.has(relation.sourceId), `relação ${index}: sourceId inexistente`);
  check(caseIds.has(relation.targetId), `relação ${index}: targetId inexistente`);
  check(relation.sourceId !== relation.targetId, `relação ${index}: autorrelação`);
  (relation.conceptIds || []).forEach(id => check(conceptIds.has(id), `relação ${index}: conceito inexistente ${id}`));
});
clusters.forEach(cluster => {
  check(conceptIds.has(cluster.conceptId), `${cluster.clusterId}: conceito inexistente`);
  check((cluster.caseIds || []).includes(cluster.canonicalCaseId), `${cluster.clusterId}: canônico fora do cluster`);
  (cluster.caseIds || []).forEach(id => check(caseIds.has(id), `${cluster.clusterId}: caso inexistente ${id}`));
  (cluster.variationCaseIds || []).forEach(id => check((cluster.caseIds || []).includes(id), `${cluster.clusterId}: variação fora do cluster`));
});
matrix.forEach((entry, index) => {
  check(caseIds.has(entry.caseId), `matriz ${index}: caso inexistente`);
  check(conceptIds.has(entry.conceptId), `matriz ${index}: conceito inexistente`);
  check(Number(entry.weight) > 0 && Number(entry.weight) <= 1, `matriz ${index}: peso inválido`);
});

const assetIds = unique(assets.map(item => item.assetId), 'assetId');
const assetPaths = unique(assets.map(item => item.path), 'asset.path');
const assetById = new Map();
const hashGroups = new Map();
for (const asset of assets) {
  assetById.set(asset.assetId, asset);
  check(caseIds.has(asset.caseId), `${asset.assetId}: caso inexistente`);
  const file = safeAssetPath(asset.path);
  check(!!file, `${asset.assetId}: caminho inseguro`);
  if (!file || !(await exists(file))) {
    errors.push(`${asset.assetId}: arquivo ausente ${asset.path}`);
    continue;
  }
  const buffer = await readFile(file);
  const actualHash = sha256(buffer);
  check(actualHash === asset.sha256, `${asset.assetId}: SHA-256 divergente`);
  const dimensions = jpegDimensions(buffer);
  check(!!dimensions, `${asset.assetId}: JPEG inválido ou sem dimensões`);
  if (dimensions) {
    check(dimensions.width === asset.width && dimensions.height === asset.height, `${asset.assetId}: dimensões divergentes`);
  }
  if (!hashGroups.has(actualHash)) hashGroups.set(actualHash, []);
  hashGroups.get(actualHash).push(asset.caseId);
}
cases.forEach(item => {
  (item.assets || []).forEach(asset => {
    check(assetIds.has(asset.assetId), `${item.id}: asset não inventariado ${asset.assetId}`);
    check(assetPaths.has(asset.path), `${item.id}: path não inventariado ${asset.path}`);
  });
});
publicCatalog.forEach(item => {
  check(assetPaths.has(item.assetRef), `${item.id}: assetRef público inexistente`);
});

const flaggedAnswerAssets = new Set(
  assetIssues.filter(issue => issue.issue === 'source_answer_asset').map(issue => issue.assetId),
);
assets
  .filter(asset => asset.answerLeakRisk === 'review_required')
  .forEach(asset => check(flaggedAnswerAssets.has(asset.assetId), `${asset.assetId}: risco de resposta sem issue`));
const duplicateGroups = [...hashGroups.values()].filter(group => group.length > 1);
duplicateGroups.forEach(group => {
  const primaryConcepts = new Set(group.map(id => caseById.get(id)?.primaryConceptId).filter(Boolean));
  check(
    primaryConcepts.size <= 1,
    `imagem exatamente duplicada foi associada a diagnósticos incompatíveis: ${group.join(', ')}`,
  );
});
warn(
  duplicateGroups.length === assetIssues.filter(issue => issue.issue === 'exact_duplicate_asset').length,
  'grupos duplicados não coincidem com ecg_asset_issues.json',
);

const rightsFiles = ['LICENSE', 'LICENSE.md', 'RIGHTS.md', 'COPYING'];
const hasRightsFile = (await Promise.all(rightsFiles.map(name => exists(path.join(root, name))))).some(Boolean);
warn(hasRightsFile, 'pacote não contém licença nem autorização de reprodução');
warn(
  false,
  'diagnósticos e achados são source_annotated; não houve releitura independente das 150 imagens',
);
warn(
  assets.every(asset => typeof asset.altText === 'string' && asset.altText.trim()),
  'assets não possuem texto alternativo seguro para acessibilidade',
);
const managementEligible = cases.filter(item =>
  item.questionMatching?.suitableQuestionRoles?.includes('management')
).length;
warn(
  managementEligible === 0,
  `${managementEligible} casos foram marcados genericamente para questões de conduta; não publicar essa modalidade sem revisão clínica atualizada`,
);
const reviewRequired = cases.filter(item => item.quality?.requiresHumanReview).length;
check(declaredValidation.caseCount === cases.length, 'validation.json diverge no total de casos');
check(declaredValidation.conceptCount === concepts.length, 'validation.json diverge no total de conceitos');
check(declaredValidation.assetCount === assets.length, 'validation.json diverge no total de assets');

const report = {
  ok:errors.length === 0,
  root,
  counts:{
    cases:cases.length,
    concepts:concepts.length,
    assets:assets.length,
    relations:relations.length,
    clusters:clusters.length,
    reviewRequired,
    exactDuplicateGroups:duplicateGroups.length,
    answerSideAssets:flaggedAnswerAssets.size,
    managementEligible,
  },
  errors,
  warnings,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
