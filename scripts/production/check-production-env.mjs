#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs"; import { dirname, resolve } from "node:path";
const REQUIRED=["NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","CRON_SECRET","HEALTHCHECK_SECRET"];
const FORBIDDEN=["DATABASE_URL","POSTGRES_URL","SUPABASE_DB_URL","SUPABASE_ACCESS_TOKEN","SUPABASE_DB_PASSWORD","ORIENTA_RESPONDENT_INITIAL_PASSWORD"];
const PREFIXES=["E2E_","ORIENTA_SOURCE_","ORIENTA_TARGET_"]; const PLACEHOLDER=/(?:coloque_|example|exemplo|changeme|replace_me|your[_-]|seu-dominio|localhost)/i; const issues=[];
const value=(key)=>process.env[key]?.trim()??""; const add=(key,code)=>issues.push({key,code});
function parseHttpsUrl(key,{originOnly}){const raw=value(key);if(!raw)return;try{const parsed=new URL(raw);if(parsed.protocol!=="https:")add(key,"insecure_url");if(parsed.username||parsed.password)add(key,"credentials_in_url");if(originOnly&&(parsed.pathname!=="/"||parsed.search||parsed.hash))add(key,"must_be_origin");}catch{add(key,"invalid_url");}if(PLACEHOLDER.test(raw))add(key,"placeholder");}
function secret(key,min){const raw=value(key);if(!raw)return;if(raw.length<min)add(key,"weak_secret");if(/\s/.test(raw))add(key,"contains_whitespace");if(PLACEHOLDER.test(raw))add(key,"placeholder");}
for(const key of REQUIRED)if(!value(key))add(key,"missing"); parseHttpsUrl("NEXT_PUBLIC_APP_URL",{originOnly:true});parseHttpsUrl("NEXT_PUBLIC_SUPABASE_URL",{originOnly:true});
secret("NEXT_PUBLIC_SUPABASE_ANON_KEY",32);secret("SUPABASE_SERVICE_ROLE_KEY",32);secret("CRON_SECRET",32);secret("HEALTHCHECK_SECRET",32);
if(value("NEXT_PUBLIC_SUPABASE_ANON_KEY")===value("SUPABASE_SERVICE_ROLE_KEY"))add("SUPABASE_SERVICE_ROLE_KEY","duplicates_anon_key");if(value("CRON_SECRET")===value("HEALTHCHECK_SECRET"))add("HEALTHCHECK_SECRET","duplicates_cron_secret");
const webhookUrl=value("NOTIFICATION_WEBHOOK_URL"),webhookSecret=value("NOTIFICATION_WEBHOOK_SECRET");if(Boolean(webhookUrl)!==Boolean(webhookSecret))add(webhookUrl?"NOTIFICATION_WEBHOOK_SECRET":"NOTIFICATION_WEBHOOK_URL","pair_required");if(webhookUrl)parseHttpsUrl("NOTIFICATION_WEBHOOK_URL",{originOnly:false});if(webhookSecret)secret("NOTIFICATION_WEBHOOK_SECRET",24);
for(const key of FORBIDDEN)if(value(key))add(key,"forbidden_in_runtime");for(const key of Object.keys(process.env))if(value(key)&&PREFIXES.some((prefix)=>key.startsWith(prefix)))add(key,"forbidden_in_runtime");
const unique=issues.filter((issue,index,all)=>all.findIndex((item)=>item.key===issue.key&&item.code===issue.code)===index);const report={checkedAt:new Date().toISOString(),status:unique.length===0?"pass":"fail",issueCount:unique.length,issues:unique};
const reportPath=resolve(process.env.PRODUCTION_GATE_REPORT??"var/release/environment-report.json");mkdirSync(dirname(reportPath),{recursive:true});writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`,{mode:0o600});
if(unique.length){console.error("Configuração de produção inválida:");for(const issue of unique)console.error(`- ${issue.key}: ${issue.code}`);process.exit(1);}console.log(`Configuração de produção aprovada. Relatório: ${reportPath}`);
