interface libsodiumEnums {
  [type: string]: string[];
}

interface FormattableReturnType {
  binaryType: string;
  stringType: string;
}

interface libsodiumConstant {
  name: string;
  type: string;
}

interface libsodiumSymbol {
  assert_retval?: [
    {
      condition: string;
      or_else_throw: string;
    }
  ];
  dependencies?: string[];
  inputs?: libsodiumSymbolIO[];
  name: string;
  noOutputFormat?: boolean;
  outputs?: libsodiumSymbolIO[];
  return?: string;
  target?: string;
  type: 'function';
}

interface libsodiumSymbolIO {
  name: string;
  optional?: boolean;
  size?: string;
  type: string;
}

interface libsodiumGenericTypes {
  [type: string]: Array<{ name: string; type: string }>;
}

export {
  FormattableReturnType,
  libsodiumConstant,
  libsodiumEnums,
  libsodiumGenericTypes,
  libsodiumSymbol,
  libsodiumSymbolIO
};
