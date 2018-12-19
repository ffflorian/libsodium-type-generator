#!/usr/bin/env node

import program = require('commander');
import TypeGenerator from './TypeGenerator';

const {
  description,
  name,
  version
}: {
  description: string;
  name: string;
  version: string;
} = require('../package.json');

program
  .name(name)
  .version(version)
  .description(description)
  .option(
    '-o, --output <file|dir>',
    'Specify the output file or directory (required)'
  )
  .option('-b, --base <path>', 'Specify the libsodium.js base path')
  .option('-s, --sumo', 'Generate types for the sumo version')
  .option(
    '-v, --setversion <version>',
    'Set the version for the libsodium.js download (default is 0.7.3)'
  )
  .parse(process.argv);

if (!program.output) {
  console.error('No output file or directory specified!');
  program.help();
}

const generator = new TypeGenerator(program.output, program.base);
if (program.setversion) {
  if (program.base) {
    console.info(
      'Info: When setting a base path, the version parameter has no effect.'
    );
  } else {
    generator.setDownloadVersion(program.setversion).catch(error => {
      console.error(error);
      process.exit(1);
    });
  }
}

generator
  .generate(program.sumo)
  .then(outputFile =>
    console.log(
      `Success! The declaration file for libsodium.js v${generator.getVersion()}${
        program.sumo ? ' (sumo)' : ''
      } is now available at "${outputFile}".`
    )
  )
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
