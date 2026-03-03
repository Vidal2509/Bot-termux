import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';

global.authFile = 'MysticSession';
global.owner = [
  ['5218123334062', 'Tu Nombre', true],
];

global.wm = 'Rei chiquita';
global.wait = '[ ⏳ ] Cargando...';

// Esto es para que el archivo se actualice solo cuando edites
let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  console.log(chalk.redBright("Actualizado 'config.js'"));
});