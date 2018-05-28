import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as tmp from 'tmp';
import { promisify } from 'util';

const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const https = require('follow-redirects/https');
const log = require('single-line-log').stdout;
const readFilePromise = promisify(fs.readFile);

const checkSource = async (sourcePath: string): Promise<string> => {
  let symbolFiles: string[];
  const symbolPath = path.join(sourcePath, 'wrapper', 'symbols');
  const constantsFile = path.join(sourcePath, 'wrapper', 'constants.json');
  const packageFile = path.join(sourcePath, 'package.json');

  try {
    symbolFiles = await promisify(fs.readdir)(symbolPath);
  } catch (error) {
    throw new Error(
      `Could not find symbols in ${symbolPath} from downloaded ZIP file.`
    );
  }

  try {
    await readFilePromise(constantsFile);
  } catch (error) {
    throw new Error(
      `Could not find constants file ${constantsFile} in downloaded ZIP file.`
    );
  }

  if (!symbolFiles.some(fileName => /.*json/.test(fileName))) {
    throw new Error(`Could not find wrapper files in ${sourcePath}.`);
  }

  try {
    const packageData = await readFilePromise(packageFile, 'utf8');
    const jsonData = JSON.parse(packageData);
    return jsonData.version;
  } catch (error) {
    throw new Error(`Error reading libsodium package file: ${error}`);
  }
};

/**
 * Compare two software version numbers (e.g. 1.7.1)
 * Returns:
 *
 *  `0` if they're identical, negative if `v1` < `v2`,
 *  positive if `v1` > `v2`, `NaN` if they're in the wrong format.
 *
 *  Taken from http://stackoverflow.com/a/6832721/11236.
 */
const compareVersionNumbers = (version1: string, version2: string): number => {
  var v1parts = version1.split('.');
  var v2parts = version2.split('.');

  const isPositiveInteger = (x: string) => /^\d+$/.test(x);

  const validateParts = (parts: Array<string>) => {
    for (var i = 0; i < parts.length; ++i) {
      if (!isPositiveInteger(parts[i])) {
        return false;
      }
    }
    return true;
  };

  if (!validateParts(v1parts) || !validateParts(v2parts)) {
    return NaN;
  }

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }

    if (v1parts[i] === v2parts[i]) {
      continue;
    }
    if (v1parts[i] > v2parts[i]) {
      return 1;
    }
    return -1;
  }

  if (v1parts.length != v2parts.length) {
    return -1;
  }

  return 0;
};

const createTmp = (): Promise<string> =>
  new Promise((resolve, reject) =>
    tmp.dir((err, path) => {
      if (err || !path) {
        reject(err || 'No path from tmp received.');
      } else {
        resolve(path);
      }
    })
  );

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

export { checkSource, compareVersionNumbers, createTmp, httpsGetFileAsync };
