import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for(const directory of ['src','server','scripts'])for(const file of readdirSync(new URL(`../${directory}/`,import.meta.url))) {
  if(/\.(js|mjs)$/.test(file))execFileSync(process.execPath,['--check',fileURLToPath(new URL(`../${directory}/${file}`,import.meta.url))],{stdio:'inherit'});
}
console.log('JavaScript syntax checks passed.');
