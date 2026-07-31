/**
 * DocumentModel — declarative document category + definitions + optional templates.
 */

import type {
  DocumentCategory,
  DocumentDefinition,
  DocumentTemplate,
} from "@/jag/documents";

export type DocumentCategoryModel = DocumentCategory;
export type DocumentDefinitionModel = DocumentDefinition;
export type DocumentTemplateModel = DocumentTemplate;

export type DocumentModelBundle = {
  readonly categories?: readonly DocumentCategoryModel[];
  readonly definitions: readonly DocumentDefinitionModel[];
  readonly templates?: readonly DocumentTemplateModel[];
};
