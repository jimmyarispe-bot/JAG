import { resetKnowledgeOpsStoreForTests } from "./events";
import type {
  Citation,
  DocumentRecord,
  DocumentTypeDefinition,
  DocumentVersion,
  EvidenceFact,
  ExtractedEntity,
  GraphEdge,
  GraphNode,
  KnowledgeFolder,
  KnowledgeInsight,
  KnowledgePermission,
  KnowledgeRecommendation,
  KnowledgeSummary,
  KnowledgeWorkflow,
  OcrResult,
  RetentionPolicy,
  SavedSearch,
  SemanticIndexEntry,
  ShareGrant,
  StorageObject,
  TimelineEntry,
} from "./types";

type KnowledgeStore = {
  types: Map<string, DocumentTypeDefinition>;
  folders: Map<string, KnowledgeFolder>;
  documents: Map<string, DocumentRecord>;
  versions: Map<string, DocumentVersion>;
  storage: Map<string, StorageObject>;
  retention: Map<string, RetentionPolicy>;
  permissions: Map<string, KnowledgePermission>;
  ocr: Map<string, OcrResult>;
  entities: Map<string, ExtractedEntity>;
  evidence: Map<string, EvidenceFact>;
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  timeline: Map<string, TimelineEntry>;
  index: Map<string, SemanticIndexEntry>;
  citations: Map<string, Citation>;
  summaries: Map<string, KnowledgeSummary>;
  insights: Map<string, KnowledgeInsight>;
  recommendations: Map<string, KnowledgeRecommendation>;
  workflows: Map<string, KnowledgeWorkflow>;
  shares: Map<string, ShareGrant>;
  savedSearches: Map<string, SavedSearch>;
};

const g = globalThis as typeof globalThis & {
  __jagKnowledgeStore?: KnowledgeStore;
};

function empty(): KnowledgeStore {
  return {
    types: new Map(),
    folders: new Map(),
    documents: new Map(),
    versions: new Map(),
    storage: new Map(),
    retention: new Map(),
    permissions: new Map(),
    ocr: new Map(),
    entities: new Map(),
    evidence: new Map(),
    nodes: new Map(),
    edges: new Map(),
    timeline: new Map(),
    index: new Map(),
    citations: new Map(),
    summaries: new Map(),
    insights: new Map(),
    recommendations: new Map(),
    workflows: new Map(),
    shares: new Map(),
    savedSearches: new Map(),
  };
}

function store(): KnowledgeStore {
  if (!g.__jagKnowledgeStore) g.__jagKnowledgeStore = empty();
  return g.__jagKnowledgeStore;
}

export function resetKnowledgeStoreForTests(): void {
  g.__jagKnowledgeStore = empty();
  resetKnowledgeOpsStoreForTests();
}

function byOrg<T extends { organizationId: string | null }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter(
    (x) => x.organizationId === organizationId || x.organizationId === null
  );
}

function byOrgStrict<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export const kstore = {
  upsertType: (t: DocumentTypeDefinition) => {
    store().types.set(t.id, t);
    return t;
  },
  listTypes: (organizationId: string) =>
    Object.freeze(byOrg(store().types, organizationId)),
  getType: (id: string) => store().types.get(id) ?? null,

  upsertFolder: (f: KnowledgeFolder) => {
    store().folders.set(f.id, f);
    return f;
  },
  listFolders: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().folders, organizationId)),
  getFolder: (id: string) => store().folders.get(id) ?? null,

  upsertDocument: (d: DocumentRecord) => {
    store().documents.set(d.id, d);
    return d;
  },
  listDocuments: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().documents, organizationId)),
  getDocument: (id: string) => store().documents.get(id) ?? null,

  upsertVersion: (v: DocumentVersion) => {
    store().versions.set(v.id, v);
    return v;
  },
  listVersions: (documentId: string) =>
    Object.freeze(
      [...store().versions.values()]
        .filter((v) => v.documentId === documentId)
        .sort((a, b) => a.versionNumber - b.versionNumber)
    ),
  getVersion: (id: string) => store().versions.get(id) ?? null,

  upsertStorage: (s: StorageObject) => {
    store().storage.set(s.key, s);
    return s;
  },
  getStorage: (key: string) => store().storage.get(key) ?? null,

  upsertRetention: (r: RetentionPolicy) => {
    store().retention.set(r.id, r);
    return r;
  },
  listRetention: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().retention, organizationId)),

  upsertPermission: (p: KnowledgePermission) => {
    store().permissions.set(p.id, p);
    return p;
  },
  listPermissions: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().permissions, organizationId)),

  upsertOcr: (o: OcrResult) => {
    store().ocr.set(o.id, o);
    return o;
  },
  listOcr: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().ocr, organizationId)),

  upsertEntity: (e: ExtractedEntity) => {
    store().entities.set(e.id, e);
    return e;
  },
  listEntities: (organizationId: string, documentId?: string) =>
    Object.freeze(
      byOrgStrict(store().entities, organizationId).filter((e) =>
        documentId ? e.documentId === documentId : true
      )
    ),

  upsertEvidence: (e: EvidenceFact) => {
    store().evidence.set(e.id, e);
    return e;
  },
  listEvidence: (organizationId: string, documentId?: string) =>
    Object.freeze(
      byOrgStrict(store().evidence, organizationId).filter((e) =>
        documentId ? e.documentId === documentId : true
      )
    ),
  getEvidence: (id: string) => store().evidence.get(id) ?? null,

  upsertNode: (n: GraphNode) => {
    store().nodes.set(n.id, n);
    return n;
  },
  listNodes: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().nodes, organizationId)),
  getNode: (id: string) => store().nodes.get(id) ?? null,

  upsertEdge: (e: GraphEdge) => {
    store().edges.set(e.id, e);
    return e;
  },
  listEdges: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().edges, organizationId)),

  upsertTimeline: (t: TimelineEntry) => {
    store().timeline.set(t.id, t);
    return t;
  },
  listTimeline: (organizationId: string) =>
    Object.freeze(
      byOrgStrict(store().timeline, organizationId).sort((a, b) =>
        a.occurredAt.localeCompare(b.occurredAt)
      )
    ),

  upsertIndex: (i: SemanticIndexEntry) => {
    store().index.set(i.id, i);
    return i;
  },
  listIndex: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().index, organizationId)),

  upsertCitation: (c: Citation) => {
    store().citations.set(c.id, c);
    return c;
  },
  listCitations: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().citations, organizationId)),
  getCitation: (id: string) => store().citations.get(id) ?? null,

  upsertSummary: (s: KnowledgeSummary) => {
    store().summaries.set(s.id, s);
    return s;
  },
  listSummaries: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().summaries, organizationId)),

  upsertInsight: (i: KnowledgeInsight) => {
    store().insights.set(i.id, i);
    return i;
  },
  listInsights: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().insights, organizationId)),

  upsertRecommendation: (r: KnowledgeRecommendation) => {
    store().recommendations.set(r.id, r);
    return r;
  },
  listRecommendations: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().recommendations, organizationId)),

  upsertWorkflow: (w: KnowledgeWorkflow) => {
    store().workflows.set(w.id, w);
    return w;
  },
  listWorkflows: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().workflows, organizationId)),

  upsertShare: (s: ShareGrant) => {
    store().shares.set(s.id, s);
    return s;
  },
  listShares: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().shares, organizationId)),

  upsertSavedSearch: (s: SavedSearch) => {
    store().savedSearches.set(s.id, s);
    return s;
  },
  listSavedSearches: (organizationId: string) =>
    Object.freeze(byOrgStrict(store().savedSearches, organizationId)),
};
