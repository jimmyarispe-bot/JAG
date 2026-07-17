# Decision Matrix — Go / No-Go

Generated at runtime by `buildGoNoGoDecisionMatrix()`. Manual mirror:

| Criterion | Required | Pass rule |
|-----------|----------|-----------|
| RC1 signed | Approved | Approval form `rc1_sign_off` = approved |
| RC2 signed | Approved | `rc2_sign_off` |
| RC3 signed | Approved | `rc3_sign_off` |
| RC3.5 dress rehearsal | Approved | `dress_rehearsal_approval` |
| Critical defects | Zero | defectCounts.critical === 0 |
| Production readiness % | ≥ 85 | Score from readiness assessment |
| Checklist completion | ≥ 95% | Required items complete/waived/na |

**All rows must Pass for GO.** Any Fail ⇒ NO-GO.
