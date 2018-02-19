import * as fs from 'fs';
import * as path from 'path';

export interface FormattableReturnType {
  binaryType: string;
  stringType: string;
}

export interface libsodiumConstant {
  name: string;
  type: string;
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
  target?: string;
  type: 'function';
}

export interface libsodiumGenericTypes {
  [type: string]: Array<{ name: string; type: string }>;
}

export interface libsodiumEnums {
  [type: string]: Array<string>;
}

export default class TypeGenerator {
  private constants: Array<libsodiumConstant>;

  private types: libsodiumEnums = {
    Uint8ArrayOutputFormat: [`'uint8array'`],
    StringOutputFormat: [`'text'`, `'hex'`, `'base64'`],
    KeyType: [`'curve25519'`, `'ed25519'`, `'x25519'`]
  };

  private genericTypes: libsodiumGenericTypes = {
    CryptoBox: [
      { name: 'ciphertext', type: 'Uint8Array' },
      { name: 'mac', type: 'Uint8Array' }
    ],
    StringCryptoBox: [
      { name: 'ciphertext', type: 'string' },
      { name: 'mac', type: 'string' }
    ],
    CryptoKX: [
      { name: 'sharedRx', type: 'Uint8Array' },
      { name: 'sharedTx', type: 'Uint8Array' }
    ],
    StringCryptoKX: [
      { name: 'sharedRx', type: 'string' },
      { name: 'sharedTx', type: 'string' }
    ],
    KeyPair: [
      { name: 'keyType', type: 'KeyType' },
      { name: 'privateKey', type: 'Uint8Array' },
      { name: 'publicKey', type: 'Uint8Array' }
    ],
    StringKeyPair: [
      { name: 'keyType', type: 'KeyType' },
      { name: 'privateKey', type: 'string' },
      { name: 'publicKey', type: 'string' }
    ],
    SecretBox: [
      { name: 'cipher', type: 'Uint8Array' },
      { name: 'mac', type: 'Uint8Array' }
    ],
    StringSecretBox: [
      { name: 'cipher', type: 'string' },
      { name: 'mac', type: 'string' }
    ],
    generichash_state_address: [{ name: 'name', type: 'string' }],
    onetimeauth_state_address: [{ name: 'name', type: 'string' }],
    state_address: [{ name: 'name', type: 'string' }],
    secretstream_xchacha20poly1305_state_address: [
      { name: 'name', type: 'string' }
    ],
    sign_state_address: [{ name: 'name', type: 'string' }]
  };

  private enums: libsodiumEnums = {
    base64_variants: [
      'ORIGINAL',
      'ORIGINAL_NO_PADDING',
      'URLSAFE',
      'URLSAFE_NO_PADDING'
    ]
  };

  constructor(private libsodiumBase?: string, public outputFile?: string) {
    this.libsodiumBase =
      libsodiumBase || path.join(__dirname, '..', 'libsodium.js');
    this.outputFile =
      outputFile || path.join(__dirname, '..', 'libsodium.d.ts');
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

    const symbols = await Promise.all(
      symbolFiles.map(symbolFile =>
        this.readFileAsync<libsodiumSymbol>(path.join(symbolPath, symbolFile))
      )
    );

    symbols.push(
      {
        inputs: [
          {
            name: 'a',
            type: 'Uint8Array'
          },

          {
            name: 'b',
            type: 'Uint8Array'
          }
        ],
        name: 'add',
        noOutputFormat: true,
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'b1',
            type: 'Uint8Array'
          },
          {
            name: 'b2',
            type: 'Uint8Array'
          }
        ],
        name: 'compare',
        noOutputFormat: true,
        return: 'number',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'input',
            type: 'string'
          },
          {
            name: 'variant',
            type: 'base64_variants'
          }
        ],
        name: 'from_base64',
        noOutputFormat: true,
        return: 'Uint8Array',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'input',
            type: 'string'
          }
        ],
        name: 'from_hex',
        noOutputFormat: true,
        return: 'string',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'str',
            type: 'string'
          }
        ],
        name: 'from_string',
        noOutputFormat: true,
        return: 'Uint8Array',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'bytes',
            type: 'Uint8Array'
          }
        ],
        name: 'increment',
        noOutputFormat: true,
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'bytes',
            type: 'Uint8Array'
          }
        ],
        name: 'is_zero',
        noOutputFormat: true,
        return: 'boolean',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'b1',
            type: 'Uint8Array'
          },
          {
            name: 'b2',
            type: 'Uint8Array'
          }
        ],
        name: 'memcmp',
        noOutputFormat: true,
        return: 'boolean',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'bytes',
            type: 'Uint8Array'
          }
        ],
        name: 'memzero',
        noOutputFormat: true,
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'buf',
            type: 'Uint8Array'
          },
          {
            name: 'blocksize',
            type: 'number'
          }
        ],
        name: 'pad',
        noOutputFormat: true,
        return: 'Uint8Array',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'input',
            type: 'string | Uint8Array'
          },
          {
            name: 'variant',
            type: 'base64_variants'
          }
        ],
        name: 'to_base64',
        noOutputFormat: true,
        return: 'string',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'input',
            type: 'string | Uint8Array'
          }
        ],
        name: 'to_hex',
        noOutputFormat: true,
        return: 'string',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'bytes',
            type: 'Uint8Array'
          }
        ],
        name: 'to_string',
        noOutputFormat: true,
        return: 'string',
        type: 'function'
      },
      {
        inputs: [
          {
            name: 'buf',
            type: 'Uint8Array'
          },
          {
            name: 'blocksize',
            type: 'number'
          }
        ],
        name: 'unpad',
        noOutputFormat: true,
        return: 'Uint8Array',
        type: 'function'
      }
    );

    return symbols.sort(
      (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    );
  }

  private async getConstants(): Promise<Array<libsodiumConstant>> {
    const filePath = path.join(this.libsodiumBase, 'wrapper', 'constants.json');

    const constants = await this.readFileAsync<Array<libsodiumConstant>>(
      filePath
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
        return 'string | Uint8Array'
      default: {
        return type;
      }
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

        parameters += `${param.name}: ${convertedType}${optional ? ' | null' : ''}${
          isLast ? (formattingAvailable ? ', ' : '') : ', '
        }`;
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
          `(${inputs}outputFormat?: StringOutputFormat | null): ` +
          `${returnType.stringType};\n`;
      } else {
        data += `  function ${fn.name}(${inputs}): ${returnType};\n`;
      }
    });

    data += '}';

    return data;
  }

  public generate(): Promise<void> {
    return this.buildData().then(data =>
      this.writeFileAsync(this.outputFile, data)
    );
  }
}
