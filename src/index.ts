import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import { URL } from 'url';
import * as rimraf from 'rimraf';
import libsodiumTypes from './libsodiumTypes';
import utils from './utils';

const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const http = require('follow-redirects/http');

interface FormattableReturnType {
  binaryType: string;
  stringType: string;
}

interface libsodiumConstant {
  name: string;
  type: string;
}

export interface libsodiumSymbolIO {
  name: string;
  optional?: boolean;
  size?: string;
  type: string;
}

export interface libsodiumSymbol {
  assert_retval?: [
    {
      condition: string;
      or_else_throw: string;
    }
  ];
  dependencies?: Array<string>;
  inputs?: Array<libsodiumSymbolIO>;
  name: string;
  noOutputFormat?: boolean;
  outputs?: Array<libsodiumSymbolIO>;
  return?: string;
  target?: string;
  type: 'function';
}

interface libsodiumGenericTypes {
  [type: string]: Array<{ name: string; type: string }>;
}

interface libsodiumEnums {
  [type: string]: Array<string>;
}

export default class TypeGenerator {
  private constants: Array<libsodiumConstant>;
  private libsodiumVersion = '0.7.3';
  private externalLibsodiumSource = `https://github.com/jedisct1/libsodium.js/archive/${
    this.libsodiumVersion
  }.zip`;

  private additionalSymbols: Array<libsodiumSymbol> = libsodiumTypes.additionalSymbols;
  private enums: libsodiumEnums = libsodiumTypes.enums;
  private genericTypes: libsodiumGenericTypes = libsodiumTypes.genericTypes;
  private types: libsodiumEnums = libsodiumTypes.types;

  /**
   * @param outputFile Where to write the libsodium.js declarationfile
   * @param libsodiumLocalSource The source of the libsodium.js library (local path)
   */
  constructor(
    public outputFile: string,
    private libsodiumLocalSource?: string
  ) {
    this.outputFile = path.resolve(this.outputFile);
  }

  public async setDownloadVersion(version: string): Promise<TypeGenerator> {
    this.libsodiumVersion = version;
    this.externalLibsodiumSource = `https://github.com/jedisct1/libsodium.js/archive/${
      this.libsodiumVersion
    }.zip`;

    return this;
  }

  private async downloadLibrary(): Promise<string> {
    console.log(
      `Downloading libsodium.js from "${this.externalLibsodiumSource}" ...`
    );

    const tmpPath = await utils.promisify<any>(cb => {
      try {
        tmp.dir(cb);
      } catch (err) {
        console.error('Could not create temp dir:', err.message);
      }
    });
    const zipURL = new URL(this.externalLibsodiumSource);
    const downloadFileName = path.join(tmpPath, 'libsodium.zip');
    const file = await utils.httpsGetFileAsync(zipURL, downloadFileName);
    await decompress(file, tmpPath, { plugins: [decompressUnzip()] });

    const proposedSymbolSource = path.join(
      tmpPath,
      `libsodium.js-${this.libsodiumVersion}`
    );

    return proposedSymbolSource;
  }

  private async getFunctions(): Promise<Array<libsodiumSymbol>> {
    const symbolPath = path.join(
      this.libsodiumLocalSource,
      'wrapper',
      'symbols'
    );

    const symbolFiles = await utils.promisify<Array<string>>(cb =>
      fs.readdir(symbolPath, cb)
    );

    const symbols = await Promise.all(
      symbolFiles.map(async symbolFile => {
        const symbolRaw = await utils.promisify<Buffer>(cb =>
          fs.readFile(path.join(symbolPath, symbolFile), cb)
        );
        return <libsodiumSymbol>JSON.parse(symbolRaw.toString());
      })
    );

    return symbols.concat(this.additionalSymbols).sort(
      (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    );
  }

  private async getConstants(): Promise<Array<libsodiumConstant>> {
    const filePath = path.join(
      this.libsodiumLocalSource,
      'wrapper',
      'constants.json'
    );

    const constantsRaw = await utils.promisify<Buffer>(cb =>
      fs.readFile(filePath, cb)
    );
    const constants: Array<libsodiumConstant> = JSON.parse(
      constantsRaw.toString()
    );

    constants.push({
      name: 'ready',
      type: 'Promise<void>'
    });

    return constants.sort(
      (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    );
  }

  private convertType(type: string): string {
    switch (type) {
      case 'uint':
        return 'number';
      case 'buf':
      case 'randombytes_implementation':
        return 'Uint8Array';
      case 'unsized_buf':
      case 'unsized_buf_optional':
        return 'string | Uint8Array | undefined';
      default:
        return type;
    }
  }

  private convertReturnType(type: string): string | FormattableReturnType {
    if (type.startsWith('{publicKey: _format_output')) {
      return { binaryType: 'KeyPair', stringType: 'StringKeyPair' };
    }
    if (type.startsWith('_format_output({ciphertext: ciphertext, mac: mac}')) {
      return { binaryType: 'CryptoBox', stringType: 'StringCryptoBox' };
    }
    if (type.startsWith('_format_output({mac: mac, cipher: cipher}')) {
      return { binaryType: 'SecretBox', stringType: 'StringSecretBox' };
    }
    if (
      type.startsWith('_format_output({sharedRx: sharedRx, sharedTx: sharedTx}')
    ) {
      return { binaryType: 'CryptoKX', stringType: 'StringCryptoKX' };
    }
    if (type === 'random_value') {
      return 'number';
    }
    if (type.includes('=== 0')) {
      return 'boolean';
    }
    if (type.includes('stringify')) {
      return 'string';
    }
    if (type.includes('_format_output')) {
      return { binaryType: 'Uint8Array', stringType: 'string' };
    }
    return type;
  }

  private async buildData(): Promise<string> {
    const getParameters = (
      parameterArr: Array<libsodiumSymbolIO>,
      formattingAvailable: boolean
    ): string => {
      let parameters = '';
      parameterArr.forEach((param, index) => {
        const isLast = index === parameterArr.length - 1;
        const convertedType = this.convertType(param.type);
        const optional = param.type.includes('optional');

        parameters += `${param.name}: ${convertedType}${
          optional ? ' | null' : ''
        }${isLast ? (formattingAvailable ? ', ' : '') : ', '}`;
      });
      return parameters;
    };

    let data =
      '// Type definitions for libsodium-wrappers-sumo 0.7.3\n' +
      '// Project: https://github.com/jedisct1/libsodium.js\n' +
      '// Definitions by: Florian Keller <https://github.com/ffflorian>\n\n' +
      `declare module 'libsodium-wrappers-sumo' {\n`;

    Object.keys(this.types).forEach(typeName => {
      data += `  type ${typeName} = `;
      this.types[typeName].forEach((typeValue, index) => {
        const isLast = index === this.types[typeName].length - 1;
        data += typeValue + (isLast ? ';' : ' | ');
      });
      data += '\n';
    });

    data += '\n';

    Object.keys(this.enums).forEach(enumName => {
      data += `  enum ${enumName} {\n`;
      this.enums[enumName].forEach(enumValue => {
        data += `    ${enumValue},\n`;
      });
      data += `  }\n\n`;
    });

    Object.keys(this.genericTypes).forEach(typeName => {
      data += `  interface ${typeName} {\n`;
      this.genericTypes[typeName].forEach(({ name, type }) => {
        data += `    ${name}: ${type};\n`;
      });
      data += `  }\n\n`;
    });

    const constants = await this.getConstants();

    constants.forEach(constant => {
      const convertedType = this.convertType(constant.type);
      data += `  const ${constant.name}: ${convertedType};\n`;
    });

    data += '\n';

    const functions = await this.getFunctions();

    functions.forEach(fn => {
      if (!fn.return) {
        fn.return = 'void';
      }
      const formattingAvailable = fn.return.includes('_format_output');
      const inputs = fn.inputs
        ? getParameters(fn.inputs, formattingAvailable)
        : '';
      const returnType = this.convertReturnType(fn.return);

      if (typeof returnType === 'object') {
        data +=
          `  function ${fn.name}` +
          `(${inputs}outputFormat?: Uint8ArrayOutputFormat | null): ` +
          `${returnType.binaryType};\n` +
          `  function ${fn.name}` +
          `(${inputs}outputFormat: StringOutputFormat | null): ` +
          `${returnType.stringType};\n`;
      } else {
        data += `  function ${fn.name}(${inputs}): ${returnType};\n`;
      }
    });

    return data + '}';
  }

  public async generate(): Promise<string> {
    if (!this.libsodiumLocalSource) {
      this.libsodiumLocalSource = await this.downloadLibrary();
    }

    utils.checkSource(this.libsodiumLocalSource);

    const data = await this.buildData();

    await utils.promisify<string>(cb =>
      fs.writeFile(this.outputFile, data, cb)
    );

    await utils.promisify<void>(cb => rimraf(this.libsodiumLocalSource, cb));

    return this.outputFile;
  }
}
