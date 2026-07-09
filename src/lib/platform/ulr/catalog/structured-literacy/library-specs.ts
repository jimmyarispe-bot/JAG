import type { SlLibrarySpec } from "@/lib/platform/ulr/catalog/structured-literacy/library-framework/build";
import { stageGroup } from "@/lib/platform/ulr/catalog/structured-literacy/library-framework/build";

const SL = "domain.structured_literacy";

function sub(strand: string, name: string): string {
  return `${SL}.sub_strand.${strand}_${name}`;
}

function lastKey(prefix: string, count: number): string {
  return `AW-SL-${prefix}-${String(count).padStart(3, "0")}-v1.0.0`;
}

/** Instructional sequence — 15 competency libraries after Foundational PA (Doc 98). */
export const SL_LIBRARY_SPECS: SlLibrarySpec[] = [
  {
    libraryKey: "competency_library.phonemic_awareness",
    documentRef: "DOCUMENT-62",
    conceptKey: "SL-CONCEPT-PHONEMIC_AWARENESS",
    strandKey: `${SL}.strand.phonemic_awareness`,
    keyPrefix: "PM",
    playbookVersion: "playbook.sl.pm.v1.0.0",
    aiNamespace: "pm",
    entryPrerequisiteKeys: ["AW-SL-PA-024-v1.0.0"],
    handoffTargetStrandKey: `${SL}.strand.alphabetic_principle`,
    groups: [
      stageGroup("pm.competency.isolation_initial", sub("pm", "isolation"), "Initial Phoneme Isolation", [
        "Isolates initial phoneme in CVC words",
        "Isolates initial phoneme in words with consonant clusters",
        "Isolates initial phoneme in nonsense words",
      ]),
      stageGroup("pm.competency.isolation_final", sub("pm", "isolation"), "Final Phoneme Isolation", [
        "Isolates final phoneme in CVC words",
        "Isolates final phoneme in stop-sound words",
        "Isolates final phoneme in nonsense words",
      ]),
      stageGroup("pm.competency.isolation_medial", sub("pm", "isolation"), "Medial Phoneme Isolation", [
        "Isolates medial vowel phoneme in CVC words",
        "Isolates medial phoneme in multisyllabic words",
        "Isolates medial phoneme in nonsense words",
      ]),
      stageGroup("pm.competency.blend", sub("pm", "blend_segment"), "Phoneme Blending", [
        "Blends two phonemes into words",
        "Blends three phonemes into CVC words",
        "Blends phonemes in nonsense CVC words",
      ]),
      stageGroup("pm.competency.segment", sub("pm", "blend_segment"), "Phoneme Segmentation", [
        "Segments two-phoneme words",
        "Segments three-phoneme CVC words",
        "Segments nonsense CVC words into phonemes",
      ]),
      stageGroup("pm.competency.delete", sub("pm", "manipulation"), "Phoneme Deletion", [
        "Deletes initial phoneme from spoken words",
        "Deletes final phoneme from spoken words",
        "Deletes medial phoneme from spoken words",
      ]),
      stageGroup("pm.competency.substitute", sub("pm", "manipulation"), "Phoneme Substitution", [
        "Substitutes initial phoneme in CVC words",
        "Substitutes final phoneme in CVC words",
        "Substitutes medial phoneme in CVC words",
      ]),
      stageGroup("pm.competency.add", sub("pm", "manipulation"), "Phoneme Addition", [
        "Adds initial phoneme to spoken words",
        "Adds final phoneme to spoken words",
        "Adds medial phoneme to spoken words",
      ]),
      stageGroup("pm.competency.manipulate_complex", sub("pm", "manipulation"), "Complex Phoneme Manipulation", [
        "Blends four phonemes into words",
        "Segments four-phoneme words",
        "Deletes phonemes in four-phoneme words",
      ]),
      stageGroup("pm.competency.print_readiness", sub("pm", "handoff"), "Print Readiness Bridge", [
        "Performs integrated PM review across stages",
        "Demonstrates PM retention after spacing interval",
        "Validates PM mastery for Alphabetic Principle handoff",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.alphabetic_principle",
    documentRef: "DOCUMENT-84",
    conceptKey: "SL-CONCEPT-ALPHABETIC_PRINCIPLE",
    strandKey: `${SL}.strand.alphabetic_principle`,
    keyPrefix: "AP",
    playbookVersion: "playbook.sl.ap.v1.0.0",
    aiNamespace: "ap",
    entryPrerequisiteKeys: [lastKey("PM", 30)],
    handoffTargetStrandKey: `${SL}.strand.alphabetic_principle`,
    groups: [
      stageGroup("ap.competency.letter_id", sub("ap", "alphabet"), "Letter Identification", [
        "Identifies uppercase letters",
        "Identifies lowercase letters",
        "Matches uppercase and lowercase letter pairs",
      ]),
      stageGroup("ap.competency.letter_sound", sub("ap", "alphabet"), "Letter Naming and Sound Distinction", [
        "Names letters when shown in print",
        "Distinguishes letter names from letter sounds",
        "States selected consonant letter sounds",
      ]),
      stageGroup("ap.competency.conceptual", sub("ap", "conceptual"), "Conceptual Alphabetic Principle", [
        "Explains that letters represent speech sounds",
        "Identifies letters in spoken words when modeled",
        "Demonstrates understanding that print is a code for speech",
      ]),
      stageGroup("ap.competency.cvc_bridge", sub("ap", "mapping"), "CVC Oral-to-Print Bridge", [
        "Maps initial phoneme to letter in CVC words",
        "Maps medial and final phonemes to letters in CVC words",
        "Blends phonemes with letter support to read CVC words",
      ]),
      stageGroup("ap.competency.applied_cvc", sub("ap", "mapping"), "Applied Alphabetic Principle", [
        "Reads decodable CVC words with taught letter-sounds",
        "Spells decodable CVC words with taught letter-sounds",
        "Applies AP in controlled word lists with cumulative review",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.sound_symbol_correspondence",
    documentRef: "DOCUMENT-85",
    conceptKey: "SL-CONCEPT-SOUND_SYMBOL",
    strandKey: `${SL}.strand.alphabetic_principle`,
    keyPrefix: "SSC",
    playbookVersion: "playbook.sl.ssc.v1.0.0",
    aiNamespace: "ssc",
    entryPrerequisiteKeys: [lastKey("AP", 15)],
    handoffTargetStrandKey: `${SL}.strand.decoding`,
    groups: [
      stageGroup("ssc.competency.consonant", sub("ssc", "consonants"), "Consonant Correspondences", [
        "Reads and spells single consonant correspondences",
        "Applies consonant correspondences in CVC words",
        "Generalizes consonant correspondences in novel CVC words",
      ]),
      stageGroup("ssc.competency.vowel", sub("ssc", "vowels"), "Short Vowel Correspondences", [
        "Reads and spells short vowel correspondences",
        "Distinguishes short vowels in minimal pairs",
        "Applies short vowels in decodable word lists",
      ]),
      stageGroup("ssc.competency.cvc_decode", sub("ssc", "cvc"), "CVC Decoding", [
        "Decodes CVC words with continuous blending",
        "Decodes CVC words with successive blending",
        "Decodes nonsense CVC words accurately",
      ]),
      stageGroup("ssc.competency.cvc_encode", sub("ssc", "cvc"), "CVC Encoding", [
        "Encodes CVC words with phoneme-grapheme mapping",
        "Spells CVC words from dictation",
        "Self-corrects encoding errors using sound-symbol knowledge",
      ]),
      stageGroup("ssc.competency.digraph", sub("ssc", "patterns"), "Consonant Digraphs", [
        "Reads words with taught consonant digraphs",
        "Spells words with taught consonant digraphs",
        "Distinguishes digraphs from single-letter correspondences",
      ]),
      stageGroup("ssc.competency.blend", sub("ssc", "patterns"), "Consonant Blends", [
        "Reads words with initial consonant blends",
        "Reads words with final consonant blends",
        "Spells words with consonant blends accurately",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.decoding",
    documentRef: "DOCUMENT-86",
    conceptKey: "SL-CONCEPT-DECODING",
    strandKey: `${SL}.strand.decoding`,
    keyPrefix: "DEC",
    playbookVersion: "playbook.sl.dec.v1.0.0",
    aiNamespace: "dec",
    entryPrerequisiteKeys: [lastKey("SSC", 18)],
    handoffTargetStrandKey: `${SL}.strand.encoding`,
    groups: [
      stageGroup("dec.competency.closed_syllable", sub("dec", "closed"), "Closed Syllable Decoding", [
        "Decodes one-syllable closed syllable words",
        "Decodes words with consonant blends in closed syllables",
        "Decodes multisyllabic words with closed syllables",
      ]),
      stageGroup("dec.competency.vce", sub("dec", "vce"), "VCE Pattern Decoding", [
        "Decodes vowel-consonant-e pattern words",
        "Distinguishes VCE from closed syllable patterns",
        "Decodes VCE words in connected text",
      ]),
      stageGroup("dec.competency.vowel_team", sub("dec", "vowel_teams"), "Vowel Team Decoding", [
        "Decodes words with common vowel teams",
        "Decodes words with diphthong patterns",
        "Applies vowel team knowledge in multisyllabic words",
      ]),
      stageGroup("dec.competency.r_controlled", sub("dec", "r_controlled"), "R-Controlled Vowel Decoding", [
        "Decodes words with ar, or, er patterns",
        "Decodes words with ir, ur patterns",
        "Decodes multisyllabic words with r-controlled vowels",
      ]),
      stageGroup("dec.competency.multisyllabic", sub("dec", "multisyllabic"), "Multisyllabic Decoding", [
        "Applies syllable division strategies",
        "Decodes two-syllable words with taught patterns",
        "Decodes three- and four-syllable words with morphology support",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.encoding",
    documentRef: "DOCUMENT-87",
    conceptKey: "SL-CONCEPT-ENCODING",
    strandKey: `${SL}.strand.encoding`,
    keyPrefix: "ENC",
    playbookVersion: "playbook.sl.enc.v1.0.0",
    aiNamespace: "enc",
    entryPrerequisiteKeys: [lastKey("DEC", 15)],
    handoffTargetStrandKey: `${SL}.strand.writing_connections`,
    groups: [
      stageGroup("enc.competency.phonetic_cvc", sub("enc", "phonetic"), "Phonetic CVC Encoding", [
        "Spells CVC words from dictation",
        "Uses phoneme-grapheme mapping for encoding",
        "Self-corrects phonetic spelling errors",
      ]),
      stageGroup("enc.competency.digraph_spelling", sub("enc", "patterns"), "Pattern-Based Encoding", [
        "Spells words with digraph patterns",
        "Spells words with blend patterns",
        "Spells words with VCE patterns",
      ]),
      stageGroup("enc.competency.rule_spelling", sub("enc", "rules"), "Rule-Based Encoding", [
        "Applies spelling rules for taught patterns",
        "Spells multisyllabic words using syllable patterns",
        "Uses morphology to support spelling choices",
      ]),
      stageGroup("enc.competency.morphological_spelling", sub("enc", "morphology"), "Morphological Encoding", [
        "Spells words with prefixes and suffixes",
        "Spells words with Latin and Greek roots",
        "Edits spelling using morphological analysis",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.orthographic_mapping",
    documentRef: "DOCUMENT-88",
    conceptKey: "SL-CONCEPT-ORTHOGRAPHIC_MAPPING",
    strandKey: `${SL}.strand.orthographic_mapping`,
    keyPrefix: "OM",
    playbookVersion: "playbook.sl.om.v1.0.0",
    aiNamespace: "om",
    entryPrerequisiteKeys: [lastKey("DEC", 15)],
    handoffTargetStrandKey: `${SL}.strand.fluency`,
    groups: [
      stageGroup("om.competency.decodable_hf", sub("om", "mapping"), "Decodable High-Frequency Words", [
        "Maps decodable high-frequency words to orthographic memory",
        "Reads high-frequency words with automaticity",
        "Spells high-frequency words from memory",
      ]),
      stageGroup("om.competency.pattern_words", sub("om", "mapping"), "Pattern Word Mapping", [
        "Maps pattern words through orthographic mapping routines",
        "Retrieves pattern words in connected text",
        "Maintains pattern word accuracy across sessions",
      ]),
      stageGroup("om.competency.irregular_words", sub("om", "irregular"), "Irregular Word Mapping", [
        "Maps irregular words with explicit explanation",
        "Retrieves irregular words in reading tasks",
        "Spells irregular words with taught strategies",
      ]),
      stageGroup("om.competency.spaced_retrieval", sub("om", "retrieval"), "Spaced Orthographic Retrieval", [
        "Demonstrates spaced retrieval of mapped words",
        "Maintains mapped words after review intervals",
        "Generalizes mapped words to novel text contexts",
      ]),
      stageGroup("om.competency.handoff", sub("om", "handoff"), "Orthographic Mapping Handoff", [
        "Demonstrates stable orthographic mapping for fluency entry",
        "Completes OM retention probe",
        "Validates OM mastery for fluency strand handoff",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.morphology",
    documentRef: "DOCUMENT-89",
    conceptKey: "SL-CONCEPT-MORPHOLOGY",
    strandKey: `${SL}.strand.morphology`,
    keyPrefix: "MOR",
    playbookVersion: "playbook.sl.mor.v1.0.0",
    aiNamespace: "mor",
    entryPrerequisiteKeys: [lastKey("DEC", 15)],
    handoffTargetStrandKey: `${SL}.strand.vocabulary`,
    groups: [
      stageGroup("mor.competency.inflections", sub("mor", "inflections"), "Inflectional Morphology", [
        "Identifies and uses common inflectional endings",
        "Reads words with inflectional endings",
        "Spells words with inflectional endings",
      ]),
      stageGroup("mor.competency.prefixes", sub("mor", "affixes"), "Prefix Analysis", [
        "Identifies common prefixes in words",
        "Uses prefix meaning to decode unfamiliar words",
        "Spells words with common prefixes",
      ]),
      stageGroup("mor.competency.suffixes", sub("mor", "affixes"), "Suffix Analysis", [
        "Identifies common suffixes in words",
        "Uses suffix meaning to decode unfamiliar words",
        "Spells words with common suffixes",
      ]),
      stageGroup("mor.competency.latin_roots", sub("mor", "roots"), "Latin Roots", [
        "Identifies common Latin roots",
        "Combines roots with affixes to analyze words",
        "Uses Latin roots to support decoding and vocabulary",
      ]),
      stageGroup("mor.competency.greek_roots", sub("mor", "roots"), "Greek Roots", [
        "Identifies common Greek roots",
        "Analyzes multisyllabic words with Greek roots",
        "Uses Greek roots in academic vocabulary",
      ]),
      stageGroup("mor.competency.combined", sub("mor", "analysis"), "Combined Morphological Analysis", [
        "Analyzes words with multiple morphemes",
        "Uses morphological analysis in reading and spelling",
        "Demonstrates morphology mastery for vocabulary handoff",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.fluency",
    documentRef: "DOCUMENT-90",
    conceptKey: "SL-CONCEPT-FLUENCY",
    strandKey: `${SL}.strand.fluency`,
    keyPrefix: "FLU",
    playbookVersion: "playbook.sl.flu.v1.0.0",
    aiNamespace: "flu",
    entryPrerequisiteKeys: [lastKey("OM", 15)],
    handoffTargetStrandKey: `${SL}.strand.comprehension`,
    groups: [
      stageGroup("flu.competency.accuracy", sub("flu", "accuracy"), "Accurate Reading", [
        "Reads decodable text with high accuracy",
        "Self-corrects errors during oral reading",
        "Maintains accuracy on grade-appropriate text",
      ]),
      stageGroup("flu.competency.rate", sub("flu", "rate"), "Reading Rate", [
        "Reads connected text at appropriate rate",
        "Increases rate with maintained accuracy",
        "Meets grade-band rate targets on probes",
      ]),
      stageGroup("flu.competency.automatic_clusters", sub("flu", "automaticity"), "Automatic Word Clusters", [
        "Reads high-frequency word clusters automatically",
        "Reads phrase units with automaticity",
        "Maintains automaticity under timed conditions",
      ]),
      stageGroup("flu.competency.prosody", sub("flu", "prosody"), "Expressive Prosody", [
        "Reads with appropriate phrasing",
        "Uses punctuation to guide expression",
        "Demonstrates expressive oral reading",
      ]),
      stageGroup("flu.competency.grade_level", sub("flu", "grade_band"), "Grade-Level Fluency", [
        "Reads grade-level text with accuracy and rate",
        "Maintains fluency on varied text types",
        "Demonstrates fluency retention on probes",
      ]),
      stageGroup("flu.competency.handoff", sub("flu", "handoff"), "Fluency Handoff", [
        "Demonstrates integrated fluency for comprehension entry",
        "Completes ORF benchmark at target band",
        "Validates fluency mastery for comprehension strand",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.vocabulary",
    documentRef: "DOCUMENT-91",
    conceptKey: "SL-CONCEPT-VOCABULARY",
    strandKey: `${SL}.strand.vocabulary`,
    keyPrefix: "VOC",
    playbookVersion: "playbook.sl.voc.v1.0.0",
    aiNamespace: "voc",
    entryPrerequisiteKeys: [lastKey("MOR", 18)],
    handoffTargetStrandKey: `${SL}.strand.comprehension`,
    groups: [
      stageGroup("voc.competency.tier1", sub("voc", "tiers"), "Tier 1 Vocabulary", [
        "Uses Tier 1 words accurately in oral language",
        "Explains meanings of familiar words in context",
        "Applies Tier 1 vocabulary in discussion",
      ]),
      stageGroup("voc.competency.explicit", sub("voc", "instruction"), "Explicit Vocabulary Instruction", [
        "Learns taught vocabulary through explicit instruction",
        "Uses context and morphology to infer word meaning",
        "Retains explicitly taught vocabulary over time",
      ]),
      stageGroup("voc.competency.relationships", sub("voc", "relationships"), "Word Relationships", [
        "Identifies synonyms and antonyms",
        "Identifies word associations and categories",
        "Uses word relationship knowledge in reading",
      ]),
      stageGroup("voc.competency.morphological_families", sub("voc", "morphology"), "Morphological Word Families", [
        "Identifies words in morphological families",
        "Uses morphemes to derive word meanings",
        "Applies morphological families in spelling and reading",
      ]),
      stageGroup("voc.competency.tier2", sub("voc", "tiers"), "Tier 2 Academic Vocabulary", [
        "Learns Tier 2 academic words across texts",
        "Uses Tier 2 words in oral and written responses",
        "Retains Tier 2 vocabulary on cumulative review",
      ]),
      stageGroup("voc.competency.tier3", sub("voc", "tiers"), "Tier 3 Domain Vocabulary", [
        "Learns domain-specific vocabulary in context",
        "Uses Tier 3 vocabulary in content reading",
        "Demonstrates vocabulary mastery for comprehension integration",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.syntax",
    documentRef: "DOCUMENT-92",
    conceptKey: "SL-CONCEPT-SYNTAX",
    strandKey: `${SL}.strand.comprehension`,
    keyPrefix: "SYN",
    playbookVersion: "playbook.sl.syn.v1.0.0",
    aiNamespace: "syn",
    entryPrerequisiteKeys: [lastKey("VOC", 18)],
    handoffTargetStrandKey: `${SL}.strand.comprehension`,
    groups: [
      stageGroup("syn.competency.simple", sub("syn", "sentence"), "Simple Sentence Structure", [
        "Identifies subject and predicate in simple sentences",
        "Parses simple SVO sentences in oral and written text",
        "Uses syntax knowledge to support comprehension",
      ]),
      stageGroup("syn.competency.compound", sub("syn", "sentence"), "Compound Sentences", [
        "Identifies compound sentence structures",
        "Explains relationships between clauses in compound sentences",
        "Uses compound sentence knowledge in reading",
      ]),
      stageGroup("syn.competency.complex", sub("syn", "sentence"), "Complex Sentences", [
        "Identifies subordinate clauses in complex sentences",
        "Explains how clauses contribute to meaning",
        "Parses complex sentences in grade-level text",
      ]),
      stageGroup("syn.competency.phrase", sub("syn", "phrases"), "Phrase Analysis", [
        "Identifies prepositional and other phrases",
        "Uses phrase boundaries to support parsing",
        "Applies phrase analysis in comprehension tasks",
      ]),
      stageGroup("syn.competency.academic", sub("syn", "academic"), "Academic Syntax", [
        "Parses academic sentence structures in content text",
        "Uses syntax to resolve ambiguous sentences",
        "Demonstrates syntax mastery for comprehension integration",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.reading_comprehension",
    documentRef: "DOCUMENT-93",
    conceptKey: "SL-CONCEPT-READING_COMPREHENSION",
    strandKey: `${SL}.strand.comprehension`,
    keyPrefix: "RC",
    playbookVersion: "playbook.sl.rc.v1.0.0",
    aiNamespace: "rc",
    entryPrerequisiteKeys: [lastKey("FLU", 18)],
    handoffTargetStrandKey: `${SL}.strand.writing_connections`,
    groups: [
      stageGroup("rc.competency.literal", sub("rc", "comprehension"), "Literal Comprehension", [
        "Answers literal questions about text",
        "Retrieves key details with text evidence",
        "Summarizes literal content accurately",
      ]),
      stageGroup("rc.competency.inferential", sub("rc", "comprehension"), "Inferential Comprehension", [
        "Makes inferences supported by text evidence",
        "Predicts outcomes using textual clues",
        "Explains character motivations and causes",
      ]),
      stageGroup("rc.competency.text_structure", sub("rc", "structure"), "Text Structure", [
        "Identifies narrative and informational text structures",
        "Uses text structure to organize comprehension",
        "Compares information across text sections",
      ]),
      stageGroup("rc.competency.grade_level", sub("rc", "grade_band"), "Grade-Level Comprehension", [
        "Comprehends grade-level narrative text",
        "Comprehends grade-level informational text",
        "Maintains comprehension on cumulative review",
      ]),
      stageGroup("rc.competency.cross_text", sub("rc", "synthesis"), "Cross-Text Comprehension", [
        "Synthesizes information across multiple texts",
        "Compares author perspectives across texts",
        "Integrates vocabulary and syntax in cross-text tasks",
      ]),
      stageGroup("rc.competency.evaluative", sub("rc", "critical"), "Evaluative Comprehension", [
        "Evaluates author purpose and point of view",
        "Judges argument quality with evidence",
        "Demonstrates evaluative comprehension on performance tasks",
      ]),
      stageGroup("rc.competency.handoff", sub("rc", "handoff"), "Comprehension Handoff", [
        "Demonstrates integrated comprehension for generalization entry",
        "Completes comprehension benchmark bundle",
        "Validates comprehension mastery for generalization strand",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.written_expression",
    documentRef: "DOCUMENT-94",
    conceptKey: "SL-CONCEPT-WRITTEN_EXPRESSION",
    strandKey: `${SL}.strand.writing_connections`,
    keyPrefix: "WE",
    playbookVersion: "playbook.sl.we.v1.0.0",
    aiNamespace: "we",
    entryPrerequisiteKeys: [lastKey("ENC", 12)],
    handoffTargetStrandKey: "domain.litlab",
    groups: [
      stageGroup("we.competency.sentence", sub("we", "sentence"), "Sentence Writing", [
        "Writes complete sentences with correct syntax",
        "Varies sentence openings and structures",
        "Edits sentences for clarity and conventions",
      ]),
      stageGroup("we.competency.paragraph", sub("we", "paragraph"), "Paragraph Writing", [
        "Writes coherent paragraphs with topic sentences",
        "Uses supporting details in paragraph structure",
        "Uses transitions within paragraphs",
      ]),
      stageGroup("we.competency.composition", sub("we", "composition"), "Short Composition", [
        "Plans short written responses",
        "Drafts organized short compositions",
        "Uses encoding and vocabulary in composition",
      ]),
      stageGroup("we.competency.revision", sub("we", "revision"), "Revision and Editing", [
        "Revises writing for clarity and organization",
        "Edits for spelling and conventions",
        "Incorates feedback in revised drafts",
      ]),
      stageGroup("we.competency.litlab_bridge", sub("we", "handoff"), "Written Expression Handoff", [
        "Demonstrates integrated writing for LitLab entry",
        "Produces portfolio writing artifact",
        "Validates written expression for cross-domain transfer",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.automaticity",
    documentRef: "DOCUMENT-95",
    conceptKey: "SL-CONCEPT-AUTOMATICITY",
    strandKey: `${SL}.strand.fluency`,
    keyPrefix: "AUT",
    playbookVersion: "playbook.sl.aut.v1.0.0",
    aiNamespace: "aut",
    entryPrerequisiteKeys: [lastKey("OM", 15)],
    handoffTargetStrandKey: `${SL}.strand.fluency`,
    groups: [
      stageGroup("aut.competency.accurate_slow", sub("aut", "development"), "Accurate Automatic Reading", [
        "Reads taught patterns with reduced cognitive load",
        "Maintains accuracy under timed conditions",
        "Demonstrates procedural automaticity on word lists",
      ]),
      stageGroup("aut.competency.timed_practice", sub("aut", "development"), "Timed Automaticity Practice", [
        "Increases automatic word retrieval with timing",
        "Maintains accuracy as rate increases",
        "Completes timed automaticity probes",
      ]),
      stageGroup("aut.competency.spaced_retrieval", sub("aut", "retrieval"), "Spaced Automaticity Retrieval", [
        "Retrieves automatic skills after spacing intervals",
        "Maintains automaticity on cumulative review",
        "Generalizes automaticity to novel word sets",
      ]),
      stageGroup("aut.competency.word_clusters", sub("aut", "clusters"), "Automatic Word Clusters", [
        "Reads automatic word clusters in phrases",
        "Maintains cluster automaticity in sentences",
        "Transfers cluster automaticity to connected text",
      ]),
      stageGroup("aut.competency.connected_text", sub("aut", "text"), "Connected Text Automaticity", [
        "Reads connected text with automatic word recognition",
        "Maintains automaticity across text genres",
        "Demonstrates automaticity retention on probes",
      ]),
      stageGroup("aut.competency.maintenance", sub("aut", "maintenance"), "Automaticity Maintenance", [
        "Maintains automaticity over maintenance intervals",
        "Recovers automaticity after regression signals",
        "Validates automaticity for fluency integration",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.generalization",
    documentRef: "DOCUMENT-96",
    conceptKey: "SL-CONCEPT-GENERALIZATION",
    strandKey: `${SL}.strand.comprehension`,
    keyPrefix: "GEN",
    playbookVersion: "playbook.sl.gen.v1.0.0",
    aiNamespace: "gen",
    entryPrerequisiteKeys: [lastKey("RC", 21)],
    handoffTargetStrandKey: `${SL}.strand.writing_connections`,
    groups: [
      stageGroup("gen.competency.varied_text", sub("gen", "generalization"), "Varied Controlled Text", [
        "Applies SL skills in varied controlled text",
        "Maintains performance across text formats",
        "Generalizes decoding to novel controlled passages",
      ]),
      stageGroup("gen.competency.novel_words", sub("gen", "generalization"), "Novel Word Generalization", [
        "Applies patterns to novel real words",
        "Applies patterns to novel nonsense words",
        "Self-corrects when generalization fails",
      ]),
      stageGroup("gen.competency.new_setting", sub("gen", "generalization"), "New Setting Generalization", [
        "Demonstrates SL skills in new instructional settings",
        "Maintains skills with different instructors",
        "Generalizes skills in group and independent contexts",
      ]),
      stageGroup("gen.competency.cross_task", sub("gen", "generalization"), "Cross-Task Generalization", [
        "Transfers skills across reading and spelling tasks",
        "Transfers skills across oral and written tasks",
        "Integrates skills in mixed task batteries",
      ]),
      stageGroup("gen.competency.maintenance", sub("gen", "maintenance"), "Generalization Maintenance", [
        "Maintains generalized skills over time",
        "Demonstrates generalization on retention probes",
        "Validates generalization for transfer strand entry",
      ]),
    ],
  },
  {
    libraryKey: "competency_library.transfer",
    documentRef: "DOCUMENT-97",
    conceptKey: "SL-CONCEPT-TRANSFER",
    strandKey: `${SL}.strand.writing_connections`,
    keyPrefix: "TRF",
    playbookVersion: "playbook.sl.trf.v1.0.0",
    aiNamespace: "trf",
    entryPrerequisiteKeys: [lastKey("GEN", 15)],
    handoffTargetStrandKey: "domain.litlab",
    groups: [
      stageGroup("trf.competency.authentic_text", sub("trf", "transfer"), "Authentic Text Transfer", [
        "Applies SL skills in slightly varied authentic text",
        "Maintains literacy performance outside controlled materials",
        "Demonstrates transfer in performance observations",
      ]),
      stageGroup("trf.competency.content_area", sub("trf", "transfer"), "Content Area Transfer", [
        "Applies literacy skills in Earthology text",
        "Applies literacy skills in Real-Life Math word problems",
        "Integrates literacy in cross-curricular tasks",
      ]),
      stageGroup("trf.competency.litlab_reading", sub("trf", "litlab"), "LitLab Reading Transfer", [
        "Demonstrates independent reading entry criteria for LitLab",
        "Applies comprehension strategies in LitLab text",
        "Maintains fluency in LitLab reading tasks",
      ]),
      stageGroup("trf.competency.litlab_composition", sub("trf", "litlab"), "LitLab Composition Transfer", [
        "Applies written expression in LitLab composition",
        "Integrates vocabulary and syntax in LitLab writing",
        "Produces LitLab-ready writing artifacts",
      ]),
      stageGroup("trf.competency.portfolio", sub("trf", "portfolio"), "Cross-Domain Portfolio", [
        "Assembles cross-domain literacy portfolio evidence",
        "Demonstrates transfer across SL and content domains",
        "Presents portfolio performance for review",
      ]),
      stageGroup("trf.competency.opportunity", sub("trf", "capstone"), "Structured Literacy Transfer Capstone", [
        "Demonstrates SL transfer for Opportunity Engine evidence",
        "Completes cross-domain transfer validation bundle",
        "Validates Structured Literacy domain completion",
      ]),
    ],
  },
];
