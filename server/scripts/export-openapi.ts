// API 계약을 docs/api/openapi.json 으로 내보낸다. web 의 gen:api 가 이 파일을 읽는다.
import { mkdirSync, writeFileSync } from "node:fs";
import { openApiDocument } from "../src/contract.js";

const out = new URL("../../docs/api/openapi.json", import.meta.url);
mkdirSync(new URL(".", out), { recursive: true });
writeFileSync(out, JSON.stringify(openApiDocument(), null, 2) + "\n");
console.log(`wrote ${out.pathname}`);
