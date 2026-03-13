# 🛡️ AgentShield — Dify Plugins Security Report

> Automated security scan of the [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) repository.

**Scanned**: 493 plugins | 9862 files | 939,367 lines
**Duration**: 109.4s
**Average Score**: 92/100
**Scanner**: [AgentShield](https://github.com/elliotllliu/agentshield) v0.3.0
**Date**: 2026-03-13

## Summary

| Category | Count | % |
|----------|-------|---|
| 🔴 Plugins with High Risk findings | 6 | 1.2% |
| 🟡 Plugins with Medium Risk only | 72 | 14.6% |
| 🟢 Clean plugins (Low/None) | 415 | 84.2% |

**Total findings**: 1191 (🔴 15 high, 🟡 225 medium, 🟢 951 low)

## Score Distribution

| Score Range | Count |
|-------------|-------|
| 90-100 (Low Risk) | 421 |
| 70-89 (Moderate Risk) | 43 |
| 40-69 (High Risk) | 18 |
| 0-39 (Critical Risk) | 11 |

## 🔴 High Risk Plugins

| Plugin | Score | 🔴 High | 🟡 Med | 🟢 Low | Top Finding |
|--------|-------|---------|--------|--------|-------------|
| LogicOber/better-e2b-sandbox/Better-E2B-Sandbox | 0 | 2 | 10 | 12 | pipe-to-shell: downloads and executes remote code |
| allenyzx/enhancing_function_agent/enhancing_function_agent | 0 | 4 | 4 | 1 | eval() with dynamic input |
| bowenliang123/md_exporter/md_exporter | 0 | 6 | 6 | 2 | Python exec() with dynamic input |
| xiaobao_plugin/yinxiangnote/yingxiangnote | 33 | 1 | 5 | 1 | Python exec() with dynamic input |
| sawyer-shi/smart_excel_kit/smart_excel_kit-0.0.1 | 57 | 1 | 2 | 1 | Python exec() with dynamic input |
| qin2dim/table_cooking/table-cooking-0.0.3 | 65 | 1 | 1 | 1 | Python exec() with dynamic input |

### High Risk Details

#### LogicOber/better-e2b-sandbox/Better-E2B-Sandbox (Score: 0)

- **HIGH** `tools/create-nextjs-bun-sandbox.py:134`: pipe-to-shell: downloads and executes remote code
- **HIGH** `tools/install-packages.py:18`: pipe-to-shell: downloads and executes remote code
- **MEDIUM** `tools/create-nextjs-bun-sandbox.py:158`: /dev/tcp reverse shell
- **MEDIUM** `tools/create-nextjs-sandbox.py:153`: /dev/tcp reverse shell
- **MEDIUM** `tools/setup-sandbox-heartbeat.py:5`: Periodic timer + HTTP request — possible beacon/phone-home pattern

#### allenyzx/enhancing_function_agent/enhancing_function_agent (Score: 0)

- **HIGH** `strategies/enhancing_function_agent.py:73`: eval() with dynamic input
- **HIGH** `strategies/enhancing_function_agent.py:103`: eval() with dynamic input
- **HIGH** `strategies/enhancing_function_agent.py:158`: eval() with dynamic input
- **HIGH** `strategies/enhancing_function_agent.py:200`: eval() with dynamic input
- **MEDIUM** `strategies/enhancing_function_agent.py:73`: [code-exec] eval() with non-literal input

#### bowenliang123/md_exporter/md_exporter (Score: 0)

- **HIGH** `tools/md_to_pptx/md2pptx-5.4.3/md2pptx.py:5127`: Python exec() with dynamic input
- **HIGH** `tools/md_to_pptx/md2pptx-5.4.3/md2pptx.py:6321`: Python exec() with dynamic input
- **HIGH** `tools/md_to_pptx/md2pptx-5.4.3/md2pptx.py:6328`: Python exec() with dynamic input
- **HIGH** `tools/md_to_pptx/md2pptx-5.4.3/md2pptx.py:6343`: Python exec() with dynamic input
- **HIGH** `tools/md_to_pptx/md2pptx-5.4.3/runPython.py:34`: Python exec() with dynamic input

#### xiaobao_plugin/yinxiangnote/yingxiangnote (Score: 33)

- **HIGH** `setup.py:12`: Python exec() with dynamic input
- **MEDIUM** `tools/lib/evernote/edam/type/ttypes.py:4783`: Prompt injection: Instructs exfiltration of conversation data
- **MEDIUM** `tools/lib/evernote/edam/type/ttypes.py:5532`: Prompt injection: Instructs exfiltration of conversation data
- **MEDIUM** `tools/lib/evernote/edam/userstore/ttypes.py:46`: Prompt injection: Instructs exfiltration of conversation data
- **MEDIUM** `tools/lib/evernote/edam/userstore/ttypes.py:221`: Prompt injection: Instructs exfiltration of conversation data

#### sawyer-shi/smart_excel_kit/smart_excel_kit-0.0.1 (Score: 57)

- **HIGH** `tools/excel_manipulator.py:134`: Python exec() with dynamic input
- **MEDIUM** `tools/excel_manipulator.py:134`: [code-exec] exec() with dynamic input
- **MEDIUM** `tools/utils.py:757`: [insecure-network] SSL verification disabled (verify=False)

#### qin2dim/table_cooking/table-cooking-0.0.3 (Score: 65)

- **HIGH** `tools/ai/table_self_query.py:958`: Python exec() with dynamic input
- **MEDIUM** `tools/ai/table_self_query.py:958`: [code-exec] exec() with dynamic input

## 🟡 Medium Risk Plugins

| Plugin | Score | 🟡 Med | 🟢 Low | Top Finding |
|--------|-------|--------|--------|-------------|
| clickzetta/clickzetta_lakehouse | 0 | 23 | 9 | [sql-injection] SQL query with f-string — SQL injection risk |
| petrus/mercury_tools/mercury_tools-0.2.9 | 0 | 13 | 1 | Financial execution: Direct money transfer capability |
| hjlarry/draw/draw-0.0.1 | 10 | 11 | 1 | Dynamic URL construction in HTTP request — potential SSRF |
| bowenliang123/base64_codec/base64_codec | 24 | 9 | 2 | Prompt injection: Instructs decoding of obfuscated payloads |
| sumuxi/su_printer/su_printer | 34 | 8 | 1 | Hex-encoded string sequence |
| oceanbase/powermem/powermem-0.0.3 | 42 | 7 | 1 | Request to localhost — verify if intentional |
| cashfree/cashfree_payments/cashfree_payments-0.0.8 | 46 | 3 | 15 | Prompt injection: Instructs decoding of obfuscated payloads |
| petrus/mercury_trigger/mercury_trigger-0.4.9 | 46 | 5 | 7 | Request to localhost — verify if intentional |
| kito/kito-dify | 50 | 6 | 1 | Request to localhost — verify if intentional |
| wwwzhouhui/qwen-image/qwen_text2image_0.0.4 | 50 | 2 | 17 | Reads environment variables (line 18) and sends HTTP request |
| lework/kafka/kafka_0.0.1 | 52 | 5 | 4 | Prompt injection: Instructs exfiltration of conversation dat |
| actionbook/actionbook/actionbook-v0.1.1 | 58 | 5 | 1 | Request to localhost — verify if intentional |
| lfenghx/mini_claw/mini_claw-1.0.0 | 60 | 4 | 4 | Reads environment variables (line 345,727,932,996) and sends |
| beersoccer/mem0ai/mem0ai-0.2.9 | 64 | 4 | 2 | Periodic timer + HTTP request — possible beacon/phone-home p |
| upstage-document-parser/upstage-document-parser | 64 | 4 | 2 | Reads environment variables (line 70) and sends HTTP request |
| axdlee/sophnet/sophnet-0.0.5 | 66 | 4 | 1 | Hex-encoded string sequence |
| datoujiejie/botos3/botos3 | 68 | 3 | 4 | [insecure-network] SSL verification disabled (verify=False) |
| stvlynn/x/x-0.0.1 | 68 | 2 | 8 | [insecure-network] SSL verification disabled (verify=False) |
| dwdecon/url_extract_images-0.3.0 | 72 | 3 | 2 | Hex-encoded string sequence |
| Organization/JOTO_DataFocus/Datafocus | 74 | 2 | 5 | [insecure-network] SSL verification disabled (verify=False) |
| petrus/quickbooks/quickbooks-0.2.10 | 74 | 3 | 1 | Financial execution: Direct money transfer capability |
| samanhappy/excel-process/dify-excel-process-plugin-v0.0.1 | 74 | 3 | 1 | Hex-encoded string sequence |
| Fusic/upstage/upstage-0.0.1 | 76 | 2 | 4 | Periodic timer + HTTP request — possible beacon/phone-home p |
| bikeread/dify_wechat_plugin/dify_wechat_plugin | 78 | 2 | 3 | Periodic timer + HTTP request — possible beacon/phone-home p |
| edtechools/mattermost/mattermost-0.0.3 | 78 | 2 | 3 | Prompt injection: Instructs exfiltration of conversation dat |
| edtechools/mattermost_send_message/mattermost_send_message | 78 | 2 | 3 | Prompt injection: Instructs exfiltration of conversation dat |
| JOTO-Tech/schemarag/schemarag-0.1.6 | 82 | 1 | 5 | Prompt injection: Urgency-based behavioral directive in desc |
| ParkerWen/volcengine_ai/volcengine_ai-0.0.2 | 82 | 2 | 1 | Prompt injection: Claims elevated priority/privilege |
| arrenxxxxx/mcp_config_during_use/mcp_config_during_use | 82 | 2 | 1 | Prompt injection: Instructs exfiltration of conversation dat |
| atoy0m0/pdf-to-images | 82 | 2 | 1 | Request to localhost — verify if intentional |
| bowenliang123/cryptography/cryptography | 82 | 2 | 1 | Embedded private key |
| imran-siddique/agentmesh-trust-layer | 82 | 2 | 1 | Tool shadowing: Redirects from another tool to this one |
| jingfelix/kook-notify/kook-notify-0.0.1 | 82 | 2 | 1 | Prompt injection: Instructs exfiltration of conversation dat |
| livien/ffmpeg_tools_dify | 82 | 2 | 1 | [cmd-injection] subprocess with variable input |
| michael_edison/funasr-connecter/funasr-connecter | 82 | 2 | 1 | Request to localhost — verify if intentional |
| r3-yamauchi/blastengine_mailer/blastengine_mailer | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| r3-yamauchi/sendgrid_mailer/sendgrid_mailer | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| r3-yamauchi/wordpress/wordpress | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| shaoruidong/dify-plugin-volcengine-ai | 82 | 2 | 1 | Prompt injection: Claims elevated priority/privilege |
| witmeng/ragflow-api/ragflow-api | 82 | 2 | 1 | [insecure-network] SSL verification disabled (verify=False) |
| yeuoly/waifu/waifu.0.0.1 | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| nacos/a2a_server/a2a_server | 86 | 1 | 3 | High instruction density (17 directive words in 319 words) — |
| Euraxluo/dingtalk-assistant-caller/dingtalk-assistant-caller-0.0.2 | 88 | 1 | 2 | Reads environment variables (line 66,67,110,514) and sends H |
| axdlee/safety-chat | 88 | 1 | 2 | [deserialization] pickle.load/loads — arbitrary code executi |
| feiwangoooh/giphy/giphy.0.0.1 | 88 | 1 | 2 | [weak-crypto] random module for security-sensitive value (us |
| investoday/stock/investoday-stock-3.0.5 | 88 | 1 | 2 | Prompt injection: Zero-width characters (potential hidden te |
| jingfelix/bilibili_search/bilibili_search-0.0.3 | 88 | 1 | 2 | Request to localhost — verify if intentional |
| oy_plat/gen_pptx/oy-gen-pptx | 88 | 1 | 2 | Reads environment variables (line 32,109) and sends HTTP req |
| raftds/salutespeech/salute-speech | 88 | 1 | 2 | Reads environment variables (line 17) and sends HTTP request |
| stock_research/stock_researcher | 88 | 1 | 2 | Dynamic URL construction in HTTP request — potential SSRF |
| Xcode-wu/trtc-conai/trtc-conai | 90 | 1 | 1 | High instruction density (10 directive words in 190 words) — |
| ahasasjeb/mc_ping/mc_ping | 90 | 1 | 1 | Hex-encoded string sequence |
| alterxyz/cloudflare_d1/data_connector_cloudflare_d1-0.0.3 | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| alterxyz/conversation_memory/conversation_memory-0.0.4 | 90 | 1 | 1 | Reads environment variables (line 29,30,31) and sends HTTP r |
| apro/apro_ai_oracle/apro_ai_oracle.0.0.2 | 90 | 1 | 1 | Prompt injection: Instructs exfiltration of conversation dat |
| asukhodko/markdown-chunker-2.1.7 | 90 | 1 | 1 | Prompt injection: Fake mode activation to bypass restriction |
| axdlee/safety_chat/safety_chat-0.0.4 | 90 | 1 | 1 | [deserialization] pickle.load/loads — arbitrary code executi |
| catnyan/link-reader/link-reader | 90 | 1 | 1 | Request to localhost — verify if intentional |
| cybozu/kintone/kintone | 90 | 1 | 1 | Reads environment variables (line 186) and sends HTTP reques |
| dms/aliyundms_v0.0.8 | 90 | 1 | 1 | Prompt injection: Attempts to change agent identity |
| eft/redis/dify-plugin-redis | 90 | 1 | 1 | Request to localhost — verify if intentional |
| gu/gmail/gmail-0.0.1 | 90 | 1 | 1 | Prompt injection: Instructs decoding of obfuscated payloads |
| logicober/cursor-background-agents/cursor-background-agents | 90 | 1 | 1 | Reads environment variables (line 16) and sends HTTP request |
| microsoft-teams/microsoft-teams | 90 | 1 | 1 | Prompt injection: Instructs exfiltration of conversation dat |
| nikolamilosevic86/neo4j_query | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| shamspias/togetherai/image/togetherai-dify-image | 90 | 1 | 1 | Prompt injection: Instructs decoding of obfuscated payloads |
| stackit_model_serving/stackit-model-serving-dify-plugin | 90 | 1 | 1 | dynamic import() |
| stvlynn/ffmpeg/ffmpeg-0.0.1 | 90 | 1 | 1 | [cmd-injection] subprocess with variable input |
| weaviate/weaviate_plugin/weaviate_plugin-0.0.1 | 90 | 1 | 1 | Prompt injection: Attempts to extract credentials via prompt |
| whyteawhy/rhymefinder/rhymefinder | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| yt-koike/dify-cron/dify-cron-0.1.0 | 90 | 1 | 1 | Periodic timer + HTTP request — possible beacon/phone-home p |
| zm1990s/ai_security_api/panw_ai_security_api_for_dify | 90 | 1 | 1 | [insecure-network] SSL verification disabled (verify=False) |

## Most Common Findings

| # | Finding | Occurrences |
|---|---------|-------------|
| 1 | [privilege] No SKILL.md found — permission analysis skipped | 478 |
| 2 | [python-security] [info-leak] Printing sensitive data | 58 |
| 3 | [prompt-injection] Prompt injection: Zero-width characters (potential hidden text) | 37 |
| 4 | [prompt-injection] Prompt injection: Instructs exfiltration of conversation data | 29 |
| 5 | [python-security] [weak-crypto] MD5 hash — cryptographically weak | 22 |
| 6 | [network-ssrf] Request to localhost — verify if intentional | 17 |
| 7 | [obfuscation] Hex-encoded string sequence | 13 |
| 8 | [sensitive-read] Accesses AWS credentials | 13 |
| 9 | [python-security] [weak-crypto] SHA1 hash — cryptographically weak | 13 |
| 10 | [python-security] [insecure-network] SSL verification disabled (verify=False) | 11 |
| 11 | [skill-risks] Financial execution: Direct money transfer capability | 10 |
| 12 | [tool-shadowing] Tool shadowing: Redirects from another tool to this one | 9 |
| 13 | [backdoor] Python exec() with dynamic input | 8 |
| 14 | [sensitive-read] Accesses Kubernetes config | 8 |
| 15 | [prompt-injection] Prompt injection: Instructs decoding of obfuscated payloads | 8 |
| 16 | [prompt-injection] Prompt injection: Claims elevated priority/privilege | 8 |
| 17 | [skill-risks] Unverifiable external dependency: Dynamic import from remote URL | 8 |
| 18 | [phone-home] Periodic timer + HTTP request — possible beacon/phone-home pattern | 6 |
| 19 | [prompt-injection] Prompt injection: Urgency-based behavioral directive in description | 6 |
| 20 | [prompt-injection] Suspicious URL: Pipes download output to execution | 6 |

## Recommendations

1. Plugins with 🔴 High Risk findings should be reviewed immediately before deployment
2. Consider integrating AgentShield into the dify-plugins CI pipeline
3. Add `.agentshield.yml` config to customize severity thresholds per plugin

---

*Generated by [AgentShield](https://github.com/elliotllliu/agentshield) v0.3.0*
