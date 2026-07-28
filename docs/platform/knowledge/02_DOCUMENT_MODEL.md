# 02 — Document Model

## Configurable types

System presets cover general, education, finance, board, legal, and HR examples. Organizations register user-defined types via `registerDocumentType`. Healthcare/government presets are reserved for future expansion.

## Lifecycle

Upload → Version → Check-out / Check-in → Archive / Restore → Soft delete · Legal hold · Immutable archive · Retention policies

## Versioning

Documents are **immutable**. New content always creates a new `DocumentVersion` with content hash and storage key.

## Metadata & tags

Arbitrary metadata map + tags. Classification writes confidence into metadata.

## Ingest pipeline

`KnowledgeEngine.ingest` = upload → parse/OCR → classify → extract entities/evidence → semantic index.
