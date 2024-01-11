'use strict';
import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url';
import yargs from 'yargs'
import chalk from 'chalk'

const getArgs = () => {
  const optionsYargs = yargs(process.argv.slice(2))
    .usage('Uso: $0 [options]')
    .option("a", { alias: "inputFile", describe: "caminho do arquivo CNAB", type: "string" })
    .option("f", { alias: "from", describe: "posição inicial de pesquisa da linha do Cnab", type: "number", demandOption: true })
    .option("t", { alias: "to", describe: "posição final de pesquisa da linha do Cnab", type: "number", demandOption: true })
    .option("s", { alias: "segment", describe: "tipo de segmento", type: "string" })
    .option("n", { alias: "companyName", describe: "nome da empresa", type: "string" })
    .example('$0 -f 21 -t 34 -s p', 'lista a linha e campo que from e to do cnab')
    .argv;

  return optionsYargs;
}

const sliceArrayPosition = (arr, ...positions) => {
  return [...arr].slice(...positions)
};

const getDirName = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return __dirname;
};

const getFile = (inputFile) => {
  const __dirname = getDirName();
  const inputFileName = inputFile ?? 'cnabExample.rem';
  const file = path.resolve(`${__dirname}/${inputFileName}`);
  return file;
};

const saveJsonFile = (companyName, companyAddress) => {
  const __dirname = getDirName();

  const jsonOutputFile = path.resolve(`${__dirname}/output.json`);

  const output = {
    companyName,
    companyAddress,
  };

  writeFile(jsonOutputFile, JSON.stringify(output, null, 2), 'utf8');
};

const showMessage = (row, from, to) => {
  const segment = row.substring(13, 14);

  const companyName = segment === 'Q' ? row.substring(33, 73) : 'Não identificado';

  const companyAddress = segment === 'Q' ? row.substring(73, 151) : 'Não identificado';

  const message = `----- CNAB linha do segmento ${segment} -----

  Posição inicial: ${chalk.inverse.bgBlack(from)}
  
  Posição final: ${chalk.inverse.bgBlack(to)}
  
  Item isolado: ${chalk.inverse.bgBlack(row.substring(from - 1, to))}
  
  Conteúdo dentro da linha ${segment}: 
  ${row.substring(0, from)}${chalk.inverse.bgBlack(row.substring(from - 1, to))}${row.substring(to)}
  
  Nome da empresa: ${chalk.inverse.bgBlack(companyName)}
  
  Endereço da empresa: ${chalk.inverse.bgBlack(companyAddress)}
  
  ----- FIM ------
  `;

  console.log(message);

  saveJsonFile(companyName, companyAddress)
};

(() => {
  const { from, to, segment, inputFile, companyName } = getArgs();

  const file = getFile(inputFile);

  console.time('leitura Async')

  readFile(file, 'utf8')
    .then(file => {
      const cnabArray = file.split('\n');

      if (!companyName && !segment)
        throw new Error('You need to provide companyName or segment as a parameter');

      const rows = sliceArrayPosition(cnabArray, 2, -2);

      if (companyName) {
        const row = rows.find(row => row.includes(companyName));

        showMessage(row, from, to);
      } else {
        const segmentDictionary = {
          'P': 0,
          'Q': 1,
          'R': 2
        };

        const index = segmentDictionary[segment.toUpperCase()];

        const row = rows[index];

        showMessage(row, from, to);
      }
    })
    .catch(error => {
      console.log("🚀 ~ file: cnabRows.js ~ line 76 ~ error", error)
    })

  console.timeEnd('leitura Async')
})();