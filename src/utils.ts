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
  return new Promise((resolve, reject) => {
    https
      .get(url.href, (res: http.IncomingMessage) => {
        const MEGABYTE = 1048576;

        const { statusCode } = res;
        const len = parseInt(res.headers['content-length'], 10);
        const total = len / MEGABYTE;
        let cur = 0;

        if (statusCode !== 200) {
          return reject(
            new Error(`Request to ${url} failed.\nStatus code: ${statusCode}`)
          );
        }

        const file = fs.createWriteStream(fileName);
        res.pipe(file);

        res.on('data', chunk => {
          cur += chunk.length;
          log(`${(100.0 * cur / len).toFixed(2)} % of ${total.toFixed(2)} MB`);
        });

        res.on('end', () => {
          log.clear();
          resolve(fileName);
        });
      })
      .on('error', (error: Error) => {
        reject(`Could not download libsodium.js: ${error.message}`);
      });
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
