import * as fs from 'fs';
import * as path from 'path';

export interface libsodiumConstant {
  name: string;
  type: 'uint' | 'string';
}

export default class TypeGenerator {
  private constants: Array<libsodiumConstant>;
  private libsodiumBase: string;
  public outputFile: string;

  constructor(libsodiumBase?: string, outputFile?: string) {
    this.libsodiumBase = path.join(__dirname, '..', 'libsodium.js');
    this.outputFile = path.join(__dirname, 'libsodium.d.ts');
  }

  private getConstants(): Promise<Array<libsodiumConstant>> {
    const filePath = path.join(this.libsodiumBase, 'wrapper', 'constants.json');

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (!err) {
          const constants: Array<libsodiumConstant> = JSON.parse(
            data.toString()
          );
          resolve(constants);
        } else {
          reject(err);
        }
      });
    });
  }

  private convertType(type: string): string {
    switch (type) {
      case 'uint':
        return 'number';
      case 'buf':
        return 'Uint8Array';
      case 'unsized_buf':
        return 'Uint8Array';
      default:
        return type;
    }
  }

  private buildData(): string {
    let data = 'declare namespace libsodium {\n';
    this.constants.forEach(
      (constant: libsodiumConstant) =>
        (data += `  const ${constant.name}: ${this.convertType(
          constant.type
        )};\n`)
    );
    data += '}';
    return data;
  }

  private writeFile(): Promise<void> {
    const data = this.buildData();
    return new Promise((resolve, reject) => {
      fs.writeFile(this.outputFile, data, err => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  public async generate() {
    try {
      this.constants = await this.getConstants();
      await this.writeFile();
      console.log('success');
    } catch (err) {
      console.error(err);
    }
  }
}
