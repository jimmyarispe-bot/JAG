/**
 * CFO API helpers — Platform session gates (same org access model as finance).
 */

export {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg as requireCfoOrg,
  requireFinanceOrgBody as requireCfoOrgBody,
} from "../finance/_lib";
