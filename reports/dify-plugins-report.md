# 🛡️ AgentShield — Dify Plugins Security Report

> Automated security scan of the [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) repository.

**Scanned**: 493 plugins | 9862 files | 939,367 lines
**Duration**: 126.1s
**Average Score**: 93/100
**Scanner**: [AgentShield](https://github.com/elliotllliu/agent-shield) v0.3.0
**Date**: 2026-03-13

## Summary

| Category | Count | % |
|----------|-------|---|
| 🔴 Plugins with High Risk findings | 6 | 1.2% |
| 🟡 Plugins with Medium Risk only | 73 | 14.8% |
| 🟢 Clean plugins (Low/None) | 414 | 84.0% |

**Total findings**: 971 (🔴 18 high, 🟡 227 medium, 🟢 726 low)

## Score Distribution

| Score Range | Count |
|-------------|-------|
| 90-100 (Low Risk) | 445 |
| 70-89 (Moderate Risk) | 26 |
| 40-69 (High Risk) | 11 |
| 0-39 (Critical Risk) | 11 |

## 🔴 High Risk Plugins

| Plugin | Score | 🔴 High | 🟡 Med | 🟢 Low | Top Finding |
|--------|-------|---------|--------|--------|-------------|
| LogicOber/better-e2b-sandbox/Better-E2B-Sandbox | 0 | 2 | 10 | 12 | pipe-to-shell: downloads and executes remote code |
| allenyzx/enhancing_function_agent/enhancing_function_agent | 0 | 4 | 5 | 1 | eval() with dynamic input |
| bowenliang123/md_exporter/md_exporter | 0 | 9 | 7 | 1 | Python exec() with dynamic input |
| sawyer-shi/smart_excel_kit/smart_excel_kit-0.0.1 | 49 | 1 | 3 | 1 | Python exec() with dynamic input |
| qin2dim/table_cooking/table-cooking-0.0.3 | 57 | 1 | 2 | 1 | Python exec() with dynamic input |
| xiaobao_plugin/yinxiangnote/yingxiangnote | 57 | 1 | 2 | 1 | Python exec() with dynamic input |

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

#### sawyer-shi/smart_excel_kit/smart_excel_kit-0.0.1 (Score: 49)

- **HIGH** `tools/excel_manipulator.py:134`: Python exec() with dynamic input
- **MEDIUM** `tools/excel_manipulator.py:134`: [code-exec] exec() with dynamic input
- **MEDIUM** `tools/utils.py:757`: [insecure-network] SSL verification disabled (verify=False)
- **MEDIUM** `manifest.yaml`: Capability mismatch: manifest doesn't declare 'exec' but code uses it in: tools/excel_manipulator.py

#### qin2dim/table_cooking/table-cooking-0.0.3 (Score: 57)

- **HIGH** `tools/ai/table_self_query.py:958`: Python exec() with dynamic input
- **MEDIUM** `tools/ai/table_self_query.py:958`: [code-exec] exec() with dynamic input
- **MEDIUM** `manifest.yaml`: Capability mismatch: manifest doesn't declare 'exec' but code uses it in: tools/ai/table_self_query.py

#### xiaobao_plugin/yinxiangnote/yingxiangnote (Score: 57)

- **HIGH** `setup.py:12`: Python exec() with dynamic input
- **MEDIUM** `setup.py:12`: [code-exec] exec() with dynamic input
- **MEDIUM** `manifest.yaml`: Capability mismatch: manifest doesn't declare 'exec' but code uses it in: setup.py

## 🟡 Medium Risk Plugins

| Plugin | Score | 🟡 Med | 🟢 Low | Top Finding |
|--------|-------|--------|--------|-------------|
| clickzetta/clickzetta_lakehouse | 0 | 24 | 1 | [sql-injection] SQL query with f-string — SQL injection risk |
| petrus/mercury_tools/mercury_tools-0.2.9 | 0 | 13 | 1 | Financial execution: Direct money transfer capability |
| hjlarry/draw/draw-0.0.1 | 2 | 12 | 1 | Dynamic URL construction in HTTP request — potential SSRF |
| bowenliang123/base64_codec/base64_codec | 24 | 9 | 2 | Prompt injection: Instructs decoding of obfuscated payloads |
| oceanbase/powermem/powermem-0.0.3 | 34 | 8 | 1 | Request to localhost — verify if intentional |
| sumuxi/su_printer/su_printer | 34 | 8 | 1 | Hex-encoded string sequence |
| kito/kito-dify | 42 | 7 | 1 | Request to localhost — verify if intentional |
| actionbook/actionbook/actionbook-v0.1.1 | 50 | 6 | 1 | Request to localhost — verify if intentional |
| r3-yamauchi/my_aws_tools/my_aws_tools | 50 | 1 | 21 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| lfenghx/mini_claw/mini_claw-1.0.0 | 52 | 5 | 4 | Reads environment variables (line 345,727,932,996) and sends |
| petrus/mercury_trigger/mercury_trigger-0.4.9 | 56 | 5 | 2 | Request to localhost — verify if intentional |
| upstage-document-parser/upstage-document-parser | 64 | 4 | 2 | Reads environment variables (line 70) and sends HTTP request |
| axdlee/sophnet/sophnet-0.0.5 | 66 | 4 | 1 | Hex-encoded string sequence |
| datoujiejie/botos3/botos3 | 68 | 3 | 4 | [insecure-network] SSL verification disabled (verify=False) |
| beersoccer/mem0ai/mem0ai-0.2.9 | 72 | 3 | 2 | Periodic timer + HTTP request — possible beacon/phone-home p |
| dwdecon/url_extract_images-0.3.0 | 72 | 3 | 2 | Hex-encoded string sequence |
| Organization/JOTO_DataFocus/Datafocus | 74 | 2 | 5 | [insecure-network] SSL verification disabled (verify=False) |
| cashfree/cashfree_payments/cashfree_payments-0.0.8 | 74 | 3 | 1 | Prompt injection: Instructs decoding of obfuscated payloads |
| livien/ffmpeg_tools_dify | 74 | 3 | 1 | [cmd-injection] subprocess with variable input |
| petrus/quickbooks/quickbooks-0.2.10 | 74 | 3 | 1 | Financial execution: Direct money transfer capability |
| samanhappy/excel-process/dify-excel-process-plugin-v0.0.1 | 74 | 3 | 1 | Hex-encoded string sequence |
| yasu89/redmine/redmine-0.1.0 | 74 | 2 | 5 | [zh] Chinese: privilege escalation attempt |
| Fusic/upstage/upstage-0.0.1 | 76 | 2 | 4 | Periodic timer + HTTP request — possible beacon/phone-home p |
| bikeread/dify_wechat_plugin/dify_wechat_plugin | 78 | 2 | 3 | Periodic timer + HTTP request — possible beacon/phone-home p |
| ParkerWen/volcengine_ai/volcengine_ai-0.0.2 | 82 | 2 | 1 | Prompt injection: Claims elevated priority/privilege |
| atoy0m0/pdf-to-images | 82 | 2 | 1 | Request to localhost — verify if intentional |
| bowenliang123/cryptography/cryptography | 82 | 2 | 1 | Embedded private key |
| dms/aliyundms_v0.0.8 | 82 | 2 | 1 | Prompt injection: Attempts to change agent identity |
| imran-siddique/agentmesh-trust-layer | 82 | 2 | 1 | Tool shadowing: Redirects from another tool to this one |
| michael_edison/funasr-connecter/funasr-connecter | 82 | 2 | 1 | Request to localhost — verify if intentional |
| r3-yamauchi/blastengine_mailer/blastengine_mailer | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| r3-yamauchi/sendgrid_mailer/sendgrid_mailer | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| r3-yamauchi/wordpress/wordpress | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| shaoruidong/dify-plugin-volcengine-ai | 82 | 2 | 1 | Prompt injection: Claims elevated priority/privilege |
| stvlynn/x/x-0.0.1 | 82 | 2 | 1 | [insecure-network] SSL verification disabled (verify=False) |
| witmeng/ragflow-api/ragflow-api | 82 | 2 | 1 | [insecure-network] SSL verification disabled (verify=False) |
| wwwzhouhui/qwen-image/qwen_text2image_0.0.4 | 82 | 2 | 1 | Reads environment variables (line 18) and sends HTTP request |
| yeuoly/waifu/waifu.0.0.1 | 82 | 2 | 1 | Unverifiable external dependency: Dynamic import from remote |
| axdlee/safety-chat | 88 | 1 | 2 | [deserialization] pickle.load/loads — arbitrary code executi |
| jingfelix/bilibili_search/bilibili_search-0.0.3 | 88 | 1 | 2 | Request to localhost — verify if intentional |
| Euraxluo/dingtalk-assistant-caller/dingtalk-assistant-caller-0.0.2 | 90 | 1 | 1 | Reads environment variables (line 66,67,110,514) and sends H |
| Xcode-wu/trtc-conai/trtc-conai | 90 | 1 | 1 | High instruction density (10 directive words in 190 words) — |
| ahasasjeb/mc_ping/mc_ping | 90 | 1 | 1 | Hex-encoded string sequence |
| aigczenith/doc_translator/doc_translator | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| alterxyz/cloudflare_d1/data_connector_cloudflare_d1-0.0.3 | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| alterxyz/conversation_memory/conversation_memory-0.0.4 | 90 | 1 | 1 | Reads environment variables (line 29,30,31) and sends HTTP r |
| arthurleeee1-lgtm/canopywave/canopywave-0.0.6 | 90 | 1 | 1 | [ja] Japanese: system prompt reference |
| asukhodko/markdown-chunker-2.1.7 | 90 | 1 | 1 | Prompt injection: Fake mode activation to bypass restriction |
| axdlee/safety_chat/safety_chat-0.0.4 | 90 | 1 | 1 | [deserialization] pickle.load/loads — arbitrary code executi |
| catnyan/link-reader/link-reader | 90 | 1 | 1 | Request to localhost — verify if intentional |
| cybozu/kintone/kintone | 90 | 1 | 1 | Reads environment variables (line 186) and sends HTTP reques |
| eft/redis/dify-plugin-redis | 90 | 1 | 1 | Request to localhost — verify if intentional |
| feiwangoooh/giphy/giphy.0.0.1 | 90 | 1 | 1 | [weak-crypto] random module for security-sensitive value (us |
| fernvenue/meilisearch/meilisearch-0.1.4 | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| gu/gmail/gmail-0.0.1 | 90 | 1 | 1 | Prompt injection: Instructs decoding of obfuscated payloads |
| hangboss1761/echarts_convert/echarts_convert-0.0.1 | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| kurokobo/knowledge_toolbox/knowledge_toolbox | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| kurokobo/openai_audio_toolkit/openai_audio_toolkit | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| logicober/cursor-background-agents/cursor-background-agents | 90 | 1 | 1 | Reads environment variables (line 16) and sends HTTP request |
| nacos/a2a_server/a2a_server | 90 | 1 | 1 | High instruction density (17 directive words in 319 words) — |
| nikolamilosevic86/neo4j_query | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| oy_plat/gen_pptx/oy-gen-pptx | 90 | 1 | 1 | Reads environment variables (line 32,109) and sends HTTP req |
| r3-yamauchi/kintone/kintone_integration | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| raftds/salutespeech/salute-speech | 90 | 1 | 1 | Reads environment variables (line 17) and sends HTTP request |
| shamspias/togetherai/image/togetherai-dify-image | 90 | 1 | 1 | Prompt injection: Instructs decoding of obfuscated payloads |
| stackit_model_serving/stackit-model-serving-dify-plugin | 90 | 1 | 1 | dynamic import() |
| stock_research/stock_researcher | 90 | 1 | 1 | Dynamic URL construction in HTTP request — potential SSRF |
| stvlynn/ffmpeg/ffmpeg-0.0.1 | 90 | 1 | 1 | [cmd-injection] subprocess with variable input |
| whyteawhy/rhymefinder/rhymefinder | 90 | 1 | 1 | Prompt injection: Urgency-based behavioral directive in desc |
| woztell/woztell/woztell-0.0.5 | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| yt-koike/dify-cron/dify-cron-0.1.0 | 90 | 1 | 1 | Periodic timer + HTTP request — possible beacon/phone-home p |
| zeroz-lab/milvus/milvus-0.1.4 | 90 | 1 | 1 | Capability mismatch: manifest doesn't declare 'exec' but cod |
| zm1990s/ai_security_api/panw_ai_security_api_for_dify | 90 | 1 | 1 | [insecure-network] SSL verification disabled (verify=False) |

## Most Common Findings

| # | Finding | Occurrences |
|---|---------|-------------|
| 1 | [privilege] No SKILL.md found — permission analysis skipped | 479 |
| 2 | [python-security] [weak-crypto] MD5 hash — cryptographically weak | 25 |
| 3 | [network-ssrf] Request to localhost — verify if intentional | 17 |
| 4 | [obfuscation] Hex-encoded string sequence | 13 |
| 5 | [python-security] [weak-crypto] SHA1 hash — cryptographically weak | 13 |
| 6 | [cross-file] Capability mismatch: manifest doesn't declare 'exec' but code uses it in: tools/ | 12 |
| 7 | [sensitive-read] Accesses AWS credentials | 12 |
| 8 | [python-security] [insecure-network] SSL verification disabled (verify=False) | 11 |
| 9 | [skill-risks] Financial execution: Direct money transfer capability | 10 |
| 10 | [tool-shadowing] Tool shadowing: Redirects from another tool to this one | 9 |
| 11 | [backdoor] Python exec() with dynamic input | 8 |
| 12 | [sensitive-read] Accesses Kubernetes config | 8 |
| 13 | [prompt-injection] Prompt injection: Instructs decoding of obfuscated payloads | 8 |
| 14 | [skill-risks] Unverifiable external dependency: Dynamic import from remote URL | 8 |
| 15 | [phone-home] Periodic timer + HTTP request — possible beacon/phone-home pattern | 6 |
| 16 | [python-security] [code-exec] exec() with dynamic input | 6 |
| 17 | [prompt-injection] Prompt injection: Claims elevated priority/privilege | 6 |
| 18 | [python-security] [sql-injection] SQL query with f-string — SQL injection risk | 5 |
| 19 | [prompt-injection] Prompt injection: Urgency-based behavioral directive in description | 5 |
| 20 | [prompt-injection] Prompt injection: Fake mode activation to bypass restrictions | 5 |

## Recommendations

1. Plugins with 🔴 High Risk findings should be reviewed immediately before deployment
2. Consider integrating AgentShield into the dify-plugins CI pipeline
3. Add `.agent-shield.yml` config to customize severity thresholds per plugin

---

*Generated by [AgentShield](https://github.com/elliotllliu/agent-shield) v0.3.0*
