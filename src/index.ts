import TypeGenerator from './TypeGenerator';

const generator = new TypeGenerator();

generator
  .generate()
  .then(() =>
    console.log(
      `Success! The types file is now available at "${generator.outputFile}."`
    )
  )
  .catch(error => console.error(error));
