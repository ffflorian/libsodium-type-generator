# libsodium-type-generator [![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/)

This is a TypeScript declaration file generator for [`libsodium.js`](https://github.com/jedisct1/libsodium.js).


## Installation
```
yarn global add libsodium-type-generator
```
or
```
npm install -g libsodium-type-generator
```

## Run
```
Usage: libsodium-type-generator [options]

Options:

  -V, --version               output the version number
  -o, --output <file|dir>     Specify the output file or directory (required)
  -b, --base <path>           Specify the libsodium.js base path
  -s, --sumo                  Generate types for the sumo version
  -v, --setversion <version>  Set the version for the libsodium.js download (default is 0.7.3)
  -h, --help                  output usage information
```

### Example:
```
libsodium-type-generator -o /path/to/libsodium.d.ts -b /path/to/libsodium.js
```
or
```
libsodium-type-generator -o /path/to/libsodium.d.ts
# source will be downloaded from GitHub and saved to a temp folder
```


## Include in your project
```ts
import TypeGenerator from 'libsodium-type-generator';

const generator = new TypeGenerator('/path/to/outputfile');

generator
  .generate()
  .then(outputFile => {
    // success!
    console.log(outputFile); // /path/to/outputfile
  })
  .catch(error => {
    // handle error
  });
```
