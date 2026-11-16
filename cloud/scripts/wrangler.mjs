import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const cloud=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// Never use another project's/global Wrangler authorization.
const child=spawn(process.execPath,[resolve(cloud,'node_modules/wrangler/bin/wrangler.js'),...process.argv.slice(2)],{cwd:cloud,stdio:'inherit',env:{...process.env,XDG_CONFIG_HOME:resolve(cloud,'../.dev/cloudflare-auth'),WRANGLER_SEND_METRICS:'false'}});
child.once('error',()=>{console.error('No se pudo iniciar Wrangler de El Oeste.');process.exitCode=1;});
child.once('exit',code=>{process.exitCode=code??1;});
