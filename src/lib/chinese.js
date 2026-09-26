// Display translation only: source documents, IDs and evidence URLs stay intact.
export function chinese(text) {
  if (!text) return text;
  const phrases = {
    'Java SDK that routes AI agent tool calls through policy, approval, idempotency and audit.':'通过策略、审批、幂等和审计约束 AI 工具调用的 Java SDK。',
    'Durable execution-continuity layer — local effect-journal sample.':'执行连续性层；当前展示本机 effect 账本样本。',
    'Java + Temporal durable agent execution prototype; status reported from the local P3 run API, not a production readiness signal.':'Java + Temporal 持久执行原型；状态来自本机运行 API，不代表生产就绪。',
    'All jobs of the current build workflow run succeeded. Scope: this workflow run only, not production readiness.':'本次构建工作流的任务全部通过。仅代表本次验证，不代表生产就绪。',
    'At least one job of the current build workflow run did not succeed. Scope: this workflow run only, not production readiness.':'本次构建工作流存在未通过任务。仅代表本次验证，不代表生产就绪。',
    'Automated SDK verification (Maven verify)':'SDK 自动化验证（Maven verify）',
    'Disposable Redis coordination verification':'一次性 Redis 协调验证',
    'Isolated candidate artifact consumption':'隔离候选制品消费验证',
    'Real independent developer adoption':'真实独立开发者采用',
    'Public release 0.5.0':'0.5.0 正式发布',
    'Independent developer adoption is unmeasured':'尚未测量独立开发者采用',
    'No external developer trial has been recorded.':'尚无外部开发者试用记录。',
    'Unmeasured and deferred; maintainer or CI automation is not counted as adoption.':'尚未测量，已延期；维护者自验和 CI 不计作真实采用。',
    'Runs inside the `verify` job against a disposable Redis service.':'在 verify 任务中使用一次性 Redis 服务进行验证。',
    'Result of the `adoption` job: candidate build plus standalone consumer online and offline.':'adoption 任务验证候选构建和独立消费者的在线、离线运行。',
    'Recorded as published to Maven Central and consumed from an empty repository on 2026-09-22; dated evidence, not re-verified by this run.':'2026-09-22 的记录证明已发布到 Maven Central，并从空仓库完成消费；本次未重新核验发布状态。',
    'Relay safety gate remains CLOSED':'Relay 安全门仍关闭（CLOSED）',
    'This document reports a local journal sample only. The overall Relay safety gate is closed until a concrete provider completion/reconcile contract and trusted workspace boundary are verified — see the gate review.':'仅报告本机账本样本。真实 provider 的完成与对账契约、可信工作区边界尚待核验，整体安全门保持关闭，详见审查证据。',
    'Local journal evidence only — not a production-readiness claim.':'仅为本机账本证据，不代表生产就绪。',
    'No runs are visible in the local run list.':'本机运行列表暂无可见记录。',
  };
  if (phrases[text]) return phrases[text];
  return text
    .replace(/(\d+) of (\d+) sampled runs need attention; local demo runs only\./g,'采样的 $2 次运行中，$1 次需要关注；仅为本机演示运行。')
    .replace(/Result of the `verify` job for commit (.+)\./g,'提交 $1 的 verify 任务结果。')
    .replace(/local journal sample: (\d+) effects? \(([^)]+)\); transition history observed for (\d+) of (\d+); latest journal write ([^.]+)(?:\.\d+Z)?\./g,'本机账本采样：$1 个 effect（$2）；$4 个记录中 $3 个有完整转移证据；最近账本写入：$5。')
    .replace(/(\d+) effect(s)? unresolved in UNKNOWN/g,'$1 个 effect 的结果尚不确定（UNKNOWN）')
    .replace(/(.+) was closed manually with an unknown result/g,'$1 已由人工关闭，结果仍未知')
    .replace(/(.+) did not succeed/g,'$1 未成功完成')
    .replace(/confirmed/g,'已确认').replace(/prepared/g,'已准备').replace(/unknown/g,'未知')
    .replace('Local journal evidence only — not a production-readiness claim.','仅为本机账本证据，不代表生产就绪。')
    .replace('Relay does not silently retry an effect whose remote outcome is unknowable; these require explicit reconciliation. Counts only — keys, ids and reasons stay in the journal.','远端结果未知时不会自动重试，需要明确对账。此处仅展示计数；标识和原因留在账本中。');
}
