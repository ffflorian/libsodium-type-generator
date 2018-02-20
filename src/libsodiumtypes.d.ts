export as namespace libsodiumtypes;

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

export interface libsodiumGenericTypes {
  [type: string]: Array<{ name: string; type: string }>;
}

export interface libsodiumEnums {
  [type: string]: Array<string>;
}
