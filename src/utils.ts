import * as fs from 'fs-extra';
import * as http from 'http';
import * as path from 'path';

import { stdout as log } from 'single-line-log';
const https = require('follow-redirects/https');

const checkSource = async (sourcePath: string): Promise<string> => {
  let symbolFiles: string[];
  const symbolPath = path.join(sourcePath, 'wrapper', 'symbols');
  const constantsFile = path.join(sourcePath, 'wrapper', 'constants.json');
  const packageFile = path.join(sourcePath, 'package.json');

  try {
    symbolFiles = await fs.readdir(symbolPath);
  } catch (error) {
    throw new Error(
      `Could not find symbols in ${symbolPath} from downloaded ZIP file.`
    );
  }

  try {
    await fs.readFile(constantsFile);
  } catch (error) {
    throw new Error(
      `Could not find constants file ${constantsFile} in downloaded ZIP file.`
    );
  }

  if (!symbolFiles.some(fileName => /.*json/.test(fileName))) {
    throw new Error(`Could not find wrapper files in ${sourcePath}.`);
  }

  try {
    const packageData = await fs.readFile(packageFile, 'utf8');
    const jsonData = JSON.parse(packageData);
    return jsonData.version;
  } catch (error) {
    throw new Error(`Error reading libsodium package file: ${error}`);
  }
};

const httpsGetFileAsync = (url: URL, fileName: string): Promise<string> => {
  const MEGABYTE = 0x100000;
  const KILOBYTE = 0x400;
  let startedAt: number;

  return new Promise((resolve, reject) => {
    https
      .get(url.href, (res: http.IncomingMessage) => {
        const { statusCode } = res;

        if (statusCode !== 200) {
          return reject(
            new Error(`Request to ${url} failed.\nStatus code: ${statusCode}`)
          );
        }

        const file = fs.createWriteStream(fileName);
        const lengthRaw = res.headers['content-length'];
        const usesChunkedEncoding = !lengthRaw;
        const length = usesChunkedEncoding ? 0 : parseInt(lengthRaw, 10);
        let total = usesChunkedEncoding ? 0 : length / MEGABYTE;
        let transferred = 0;
        let elapsed = 0;

        res
          .on('data', chunk => {
            transferred += chunk.length;
            if (usesChunkedEncoding) {
              total = transferred / MEGABYTE;
            }
            elapsed = (Date.now() - startedAt) / 1000;
            const percent = ((100.0 * transferred) / length).toFixed(2);
            const speed = transferred / elapsed;
            const speedFormatted =
              speed < MEGABYTE
                ? `${~~(speed / KILOBYTE)} kB`
                : `${(speed / MEGABYTE).toFixed(2)} MB`;
            log(
              `${usesChunkedEncoding ? '?' : percent + ' %'} of ${total.toFixed(
                2
              )} MB (${speedFormatted}/s)`
            );
          })
          .on('end', () => {
            const seconds = ~~elapsed;
            console.log(` in ${seconds} second${seconds === 1 ? '' : 's'}.`);
            resolve(fileName);
          })
          .pipe(file);
      })
      .on('response', () => (startedAt = Date.now()))
      .on('error', (error: Error) =>
        reject(`Could not download libsodium.js: ${error.message}`)
      );
  });
};

export { checkSource, httpsGetFileAsync };
