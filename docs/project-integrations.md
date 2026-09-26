# 三个项目的本机接入

当前接入的是各项目的只读状态导出；一个页面读取一个项目，没有聚合管理、写入操作或自动刷新。

| 项目 | 数据来源 | 刷新方式 | 边界 |
|---|---|---|---|
| Agent Platform | 经过认证的本机 Run API | 重新运行 `scripts/export-status.py` | 本地运行样本，不代表生产就绪 |
| Relay | 现有 SQLite effect 账本 | 重新运行 `relay status` | effect 计数和历史覆盖，不是 Pi Run；安全门仍 CLOSED |
| AgentPermit4j | GitHub build 的实际任务结果 | 下载新的 `mat-console-status` artifact | CI 和隔离消费者通过不等于真实开发者采用 |

## 启动

在 mat-console 根目录打开两个终端：

```powershell
corepack pnpm dev --host 127.0.0.1
python scripts/serve-status.py
```

打开 <http://127.0.0.1:4174/>，从入口选择项目。服务只监听本机回环地址，只提供三个指定 JSON 文件；不提供仓库目录浏览。

## 准备状态文件

创建 `.local-status` 目录（已被 Git 忽略），放入以下文件：

- `agent-platform.json`：按 [Agent Platform 使用说明](https://github.com/mat973252/agent-platform#read-only-project-status-export) 导出；密码由环境变量提供，禁止放进 URL。输出文件移到本目录后重命名。
- `relay.json`：先构建 Relay，再运行 `node packages/cli/dist/src/cli.js status --storage <现有账本> --output <mat-console绝对路径>/.local-status/relay.json`。不要让输出与账本或其 sidecar 重合。详见 [Relay 导出说明](https://github.com/mat973252/Relay/blob/main/docs/STATUS-EXPORT.md)。
- `agent-permit4j.json`：从 [AgentPermit4j build](https://github.com/mat973252/agent-permit4j/actions/workflows/build.yml) 下载对应 run 的 `mat-console-status` artifact，把 `status.json` 重命名。详见 [发布和 CI 说明](https://github.com/mat973252/agent-permit4j/blob/main/docs/releasing.md)。

CI artifact 与隔离测试账本是测试证据；本机初次验收使用这些数据，不能当作正在运行的生产服务。文件缺失会在入口标为尚未导出。重新导出或下载后刷新页面；页面会保留原始 `generated_at` 和 TTL，不把下载时间当成新证据。
