import { libsodiumSymbol } from './interfaces';

const additionalSymbols: libsodiumSymbol[] = [
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
    return: 'Uint8Array',
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
    inputs: [],
    name: 'symbols',
    noOutputFormat: true,
    return: 'string[]',
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
];

const genericTypes = {
  CryptoBox: [
    { name: 'ciphertext', type: 'Uint8Array' },
    { name: 'mac', type: 'Uint8Array' }
  ],
  CryptoKX: [
    { name: 'sharedRx', type: 'Uint8Array' },
    { name: 'sharedTx', type: 'Uint8Array' }
  ],
  KeyPair: [
    { name: 'keyType', type: 'KeyType' },
    { name: 'privateKey', type: 'Uint8Array' },
    { name: 'publicKey', type: 'Uint8Array' }
  ],
  SecretBox: [
    { name: 'cipher', type: 'Uint8Array' },
    { name: 'mac', type: 'Uint8Array' }
  ],
  StringCryptoBox: [
    { name: 'ciphertext', type: 'string' },
    { name: 'mac', type: 'string' }
  ],
  StringCryptoKX: [
    { name: 'sharedRx', type: 'string' },
    { name: 'sharedTx', type: 'string' }
  ],
  StringKeyPair: [
    { name: 'keyType', type: 'KeyType' },
    { name: 'privateKey', type: 'string' },
    { name: 'publicKey', type: 'string' }
  ],
  StringSecretBox: [
    { name: 'cipher', type: 'string' },
    { name: 'mac', type: 'string' }
  ],
  generichash_state_address: [{ name: 'name', type: 'string' }],
  onetimeauth_state_address: [{ name: 'name', type: 'string' }],
  secretstream_xchacha20poly1305_state_address: [
    { name: 'name', type: 'string' }
  ],
  sign_state_address: [{ name: 'name', type: 'string' }],
  state_address: [{ name: 'name', type: 'string' }]
};

const enums = {
  base64_variants: [
    'ORIGINAL',
    'ORIGINAL_NO_PADDING',
    'URLSAFE',
    'URLSAFE_NO_PADDING'
  ]
};

const types = {
  KeyType: [`'curve25519'`, `'ed25519'`, `'x25519'`],
  StringOutputFormat: [`'text'`, `'hex'`, `'base64'`],
  Uint8ArrayOutputFormat: [`'uint8array'`]
};

export default { additionalSymbols, genericTypes, enums, types };
