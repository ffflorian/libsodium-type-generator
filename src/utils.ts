import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const https = require('follow-redirects/https');
const log = require('single-line-log').stdout;

const checkSource = async (sourcePath: string): Promise<void> => {
  let symbolFiles: string[];
  const symbolPath = path.join(sourcePath, 'wrapper', 'symbols');
  const constantsFile = path.join(sourcePath, 'wrapper', 'constants.json');

  try {
    symbolFiles = await promisify<Array<string>>(cb => {
      fs.readdir(symbolPath, cb);
    });
  } catch (error) {
    throw new Error(
      `Could not find symbols in ${symbolPath} from downloaded ZIP file.`
    );
  }

  try {
    await promisify<Buffer>(cb => {
      fs.readFile(constantsFile, cb);
    });
  } catch (error) {
    throw new Error(
      `Could not find constants file ${constantsFile} in downloaded ZIP file.`
    );
  }

  if (!symbolFiles.some(fileName => /.*json/.test(fileName))) {
    throw new Error(`Could not find wrapper files in ${sourcePath}.`);
  }
};

const httpsGetFileAsync = (
  url: URL,
  fileName: string,
  showProgress = false
): Promise<string> => {
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
            const percent = (100.0 * transferred / length).toFixed(2);
            const speed = transferred / elapsed;
            const speedFormatted = speed < MEGABYTE ? `${~~(speed / KILOBYTE)} kB` : `${(speed / MEGABYTE).toFixed(2)} MB`;
            log(`${usesChunkedEncoding ? '?' : percent + ' %'} of ${total.toFixed(2)} MB (${speedFormatted}/s)`);
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

const promisify = <T>(
  resolver: (callback: (err?: Error, value?: T) => void) => void
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    resolver((err, value): void => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
};

export default { checkSource, httpsGetFileAsync, promisify };
