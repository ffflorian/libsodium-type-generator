import * as fs from 'fs';
import * as path from 'path';

export interface libsodiumConstant {
  name: string;
  type: 'uint' | 'string';
}

export interface libsodiumSymbolIO {
  name: string;
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
  target: string;
  type: 'function';
}

export interface libsodiumGenericTypes {
  [type: string]: Array<{ name: string; type: string }>;
}

export default class TypeGenerator {
  private constants: Array<libsodiumConstant>;
  private libsodiumBase: string;
  public outputFile: string;

  private genericTypes: libsodiumGenericTypes = {
    generichash_state_address: [{ name: 'name', type: 'string' }],
    onetimeauth_state_address: [{ name: 'name', type: 'string' }],
    state_address: [{ name: 'name', type: 'string' }],
    secretstream_xchacha20poly1305_state_address: [
      { name: 'name', type: 'string' }
    ],
    sign_state_address: [{ name: 'name', type: 'string' }],
    KeyPair: [
      { name: 'publicKey', type: 'string | Uint8Array' },
      { name: 'privateKey', type: 'string | Uint8Array' },
      { name: 'keyType', type: `'ed25519'` }
    ]
  };

  constructor(libsodiumBase?: string, outputFile?: string) {
    this.libsodiumBase = path.join(__dirname, '..', 'libsodium.js');
    this.outputFile = path.join(__dirname, 'libsodium.d.ts');
  }

  private readdirAsync(path: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  private readFileAsync<T>(filePath: string): Promise<T> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(JSON.parse(data.toString()));
        }
      });
    });
  }

  private writeFileAsync(filePath: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async getFunctions(): Promise<Array<libsodiumSymbol>> {
    const symbolPath = path.join(this.libsodiumBase, 'wrapper', 'symbols');
    const symbolFiles = await this.readdirAsync(symbolPath);

    const functions = await Promise.all(
      symbolFiles.map(symbolFile =>
        this.readFileAsync<libsodiumSymbol>(path.join(symbolPath, symbolFile))
      )
    );

    functions.push({
      name: 'ready',
      noOutputFormat: true,
      return: 'Promise<void>',
      target: '',
      type: 'function',
    });

    return functions;
  }

  private getConstants(): Promise<Array<libsodiumConstant>> {
    const filePath = path.join(this.libsodiumBase, 'wrapper', 'constants.json');

    return this.readFileAsync<Array<libsodiumConstant>>(filePath);
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
        return 'string | Uint8Array';
      default:
        return type;
    }
  }

  private convertReturnType(type: string): string {
    if (type.startsWith('{publicKey: _format_output')) {
      return 'KeyPair';
    }
    if (type === 'random_value') {
      return 'number';
    }
    if (type.includes('=== 0')) {
      return 'boolean';
    }
    if (type.includes('_format_output') || type.includes('stringify')) {
      return 'string';
    }
    return type;
  }

  private buildData(): Promise<string> {
    const getParameters = (
      arr: Array<libsodiumSymbolIO>,
      hasOutputFormat: boolean
    ): string => {
      let parameters = '';
      arr.forEach((param, index) => {
        const isLast = index === arr.length - 1;
        parameters += `${param.name}: ${this.convertType(param.type)}${
          param.type.includes('optional') ? ' | null' : ''
        }${
          isLast
            ? hasOutputFormat ? ', outputFormat?: OutputFormat' : ''
            : ', '
        }`;
      });
      return parameters;
    };

    let data = `declare module 'libsodium-wrappers-sumo' {\n`;
    data += `  type OutputFormat = 'uint8array' | 'text' | 'hex' | 'base64';\n\n`;

    Object.keys(this.genericTypes).forEach(type => {
      data += `  interface ${type} {\n`;
      this.genericTypes[type].forEach(arg => {
        data += `    ${arg.name}: ${arg.type};\n`;
      });
      data += `  }\n\n`;
    });

    return this.getConstants()
      .then(constants => {
        constants.forEach(
          (constant: libsodiumConstant) =>
            (data += `  const ${constant.name}: ${this.convertType(
              constant.type
            )};\n`)
        );
        return this.getFunctions();
      })
      .then(functions => {
        functions.forEach(fn => {
          if (!fn.return) {
            fn.return = 'void';
          }
          return (data += `  function ${fn.name}(${
            fn.inputs
              ? getParameters(fn.inputs, fn.return.includes('_format_output'))
              : ''
          }): ${this.convertReturnType(fn.return)};\n`);
        });

        data += '}';
        return data;
      });
  }

  public generate(): Promise<void> {
    return this.buildData().then(data =>
      this.writeFileAsync(this.outputFile, data)
    );
  }
}
