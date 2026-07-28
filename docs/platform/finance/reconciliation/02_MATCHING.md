# Matching Engine

## Supported account kinds

Bank, checking, savings, money market, credit cards, loans, investment, petty cash, escrow, trust, intercompany, restricted cash.

## Match cardinalities

`one_to_one` · `one_to_many` · `many_to_one` · `many_to_many` · `split` · `partial` · `manual`

## Scoring signals

| Signal | Role |
|--------|------|
| Exact / near amount | Primary weight |
| Date tolerance | Configurable days |
| Description similarity | Token Jaccard |
| Reference / check number | Extracted from text |
| Invoice / vendor / customer | Party links |
| Journal entry | Book side type |
| Transfer / duplicate / recurring | Detection helpers |

Confidence ≥ `autoAcceptThreshold` (default 0.92) → auto-accept.  
Confidence ≥ `suggestThreshold` (default 0.55) → suggestion queue.

## Workflow

1. Open period  
2. Attach / import statement activity (bank transactions)  
3. `runAutoMatch`  
4. Review suggestions & exceptions  
5. Manual match / split / partial  
6. Adjustments  
7. Approvals → finalize → close  
