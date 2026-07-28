/**
 * KnowledgeEngine — canonical owner of documents, evidence, graph, search.
 * Domains consume this engine; education interpretation is P-015.
 */

import { classifyDocument } from "./classification";
import {
  ensureSystemDocumentTypes,
  listDocumentTypes,
  registerDocumentType,
} from "./core";
import {
  archiveDocument,
  checkInDocument,
  checkOutDocument,
  createVersion,
  getDocument,
  getDocumentContent,
  listDocuments,
  listVersions,
  restoreDocument,
  setLegalHold,
  softDeleteDocument,
  tagDocument,
  uploadDocument,
} from "./documents";
import {
  getEvidenceFact,
  listEvidenceFacts,
  recordEvidenceFact,
  verifyEvidence,
} from "./evidence";
import { extractEntities, listEntities } from "./entity-extraction";
import {
  KNOWLEDGE_SINKS,
  listKnowledgeEvents,
  listKnowledgeEvidenceLedger,
  listKnowledgeMemory,
  listKnowledgeTwin,
} from "./events";
import { createFolder, listFolders } from "./folders";
import { generateInsights, listInsights } from "./insights";
import { indexDocument, listIndex } from "./indexing";
import { queryGraph, relate, upsertNode } from "./knowledge-graph";
import { getMetadata, setMetadata } from "./metadata";
import { listOcr, runOcr } from "./ocr";
import { parseDocument } from "./parsing";
import {
  grantPermission,
  hasPermission,
  listPermissions,
} from "./permissions";
import {
  generateRecommendations,
  listRecommendations,
} from "./recommendations";
import {
  applyRetention,
  createRetentionPolicy,
  listRetentionPolicies,
} from "./retention";
import {
  facetedSearch,
  keywordSearch,
  listSavedSearches,
  saveSearch,
  search,
} from "./search";
import { semanticSearch } from "./semantic-search";
import { listShares, shareDocument } from "./sharing";
import { listSummaries, summarizeDocument } from "./summaries";
import { buildTimeline } from "./timeline";
import { KNOWLEDGE_GUARDS } from "./types";
import {
  completeWorkflow,
  listWorkflows,
  startWorkflow,
} from "./workflows";

export class KnowledgeEngine {
  readonly guards = KNOWLEDGE_GUARDS;
  readonly sinks = KNOWLEDGE_SINKS;

  // Types / folders
  ensureSystemDocumentTypes = ensureSystemDocumentTypes;
  registerDocumentType = registerDocumentType;
  listDocumentTypes = listDocumentTypes;
  createFolder = createFolder;
  listFolders = listFolders;

  // Documents / versions / lifecycle
  uploadDocument = uploadDocument;
  createVersion = createVersion;
  listDocuments = listDocuments;
  getDocument = getDocument;
  listVersions = listVersions;
  getDocumentContent = getDocumentContent;
  checkOutDocument = checkOutDocument;
  checkInDocument = checkInDocument;
  archiveDocument = archiveDocument;
  restoreDocument = restoreDocument;
  softDeleteDocument = softDeleteDocument;
  setLegalHold = setLegalHold;
  tagDocument = tagDocument;
  setMetadata = setMetadata;
  getMetadata = getMetadata;

  // Intelligence
  runOcr = runOcr;
  listOcr = listOcr;
  parseDocument = parseDocument;
  classifyDocument = classifyDocument;
  extractEntities = extractEntities;
  listEntities = listEntities;

  // Evidence / citations / graph / timeline
  recordEvidenceFact = recordEvidenceFact;
  verifyEvidence = verifyEvidence;
  listEvidenceFacts = listEvidenceFacts;
  getEvidenceFact = getEvidenceFact;
  upsertNode = upsertNode;
  relate = relate;
  queryGraph = queryGraph;
  buildTimeline = buildTimeline;

  // Search / index
  indexDocument = indexDocument;
  listIndex = listIndex;
  search = search;
  keywordSearch = keywordSearch;
  semanticSearch = semanticSearch;
  facetedSearch = facetedSearch;
  saveSearch = saveSearch;
  listSavedSearches = listSavedSearches;

  // Summaries / insights / recommendations
  summarizeDocument = summarizeDocument;
  listSummaries = listSummaries;
  generateInsights = generateInsights;
  listInsights = listInsights;
  generateRecommendations = generateRecommendations;
  listRecommendations = listRecommendations;

  // Workflows / sharing / permissions / retention
  startWorkflow = startWorkflow;
  completeWorkflow = completeWorkflow;
  listWorkflows = listWorkflows;
  shareDocument = shareDocument;
  listShares = listShares;
  grantPermission = grantPermission;
  hasPermission = hasPermission;
  listPermissions = listPermissions;
  createRetentionPolicy = createRetentionPolicy;
  applyRetention = applyRetention;
  listRetentionPolicies = listRetentionPolicies;

  /**
   * Full ingest pipeline: upload → OCR/parse → classify → extract → index.
   */
  ingest(input: {
    organizationId: string;
    userId: string;
    title: string;
    content: string;
    mimeType?: string;
    typeKey?: string;
    folderId?: string | null;
    tags?: readonly string[];
  }) {
    const { document, version } = this.uploadDocument(input);
    this.parseDocument({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: document.id,
    });
    const classified = this.classifyDocument({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: document.id,
    });
    const entities = this.extractEntities({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: document.id,
    });
    const index = this.indexDocument({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: document.id,
    });
    return Object.freeze({
      document: classified,
      version,
      entities,
      index,
    });
  }

  // OIOS
  listEvents = listKnowledgeEvents;
  listTwinProjections = listKnowledgeTwin;
  listEvidenceLedger = listKnowledgeEvidenceLedger;
  listMemoryRecords = listKnowledgeMemory;
}

export function createKnowledgeEngine(): KnowledgeEngine {
  return new KnowledgeEngine();
}
