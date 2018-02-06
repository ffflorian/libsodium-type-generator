import TypeGenerator from './TypeGenerator';
import * as fs from 'fs';

const generator = new TypeGenerator();
generator
  .generate()
  .then(() =>
    fs.readFile(generator.outputFile, (err, data) => {
      if (!err) {
        console.log(
          `Success! The type file is now available at "${
            generator.outputFile
          }."`
        );
      } else {
        throw err;
      }
    })
  )
  .catch(err => console.error(err));
