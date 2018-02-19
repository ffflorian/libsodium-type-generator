# libsodium-type-generator [![Greenkeeper badge](https://badges.greenkeeper.io/ffflorian/libsodium-type-generator.svg)](https://greenkeeper.io/)

This is a TypeScript definitions generator for [`libsodium.js`](https://github.com/jedisct1/libsodium.js).

For now this generates only the types for `libsodium-wrappers-sumo`.

## Run
## Install
```
yarn add -g libsodium-type-generator
```

## Run
```
libsodium-type-generator --source /path/to/source
```
or
```
libsodium-type-generator
# source will be downloaded from GitHub
```

## Include in your project
```ts
import TypeGenerator from 'libsodium-type-generator';

const generator = new TypeGenerator();

generator
  .generate()
  .then(outputFile => {
    // success!
    console.log(outputFile); // /home/Download/ ...
  })
  .catch(error => {
    // handle error
  });
```
