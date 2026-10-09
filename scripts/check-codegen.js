#!/usr/bin/env node
/**
 * Validates the TenTapKeyboard codegen spec against the frozen native contract.
 *
 * - Parses the spec with @react-native/codegen and compares every method signature.
 * - Checks that the spec stays literal (no Platform checks or conditionals).
 * - Checks package.json#codegenConfig.
 * - Checks the hand-written old-architecture Java spec, when present, declares
 *   the same methods.
 *
 * Usage: node scripts/check-codegen.js [--spec <file>] [--java <file>]
 */
const fs = require('fs');
const path = require('path');
const {
  TypeScriptParser,
} = require('@react-native/codegen/lib/parsers/typescript/parser');

const root = path.resolve(__dirname, '..');

const MODULE_NAME = 'TenTapKeyboard';
const SPEC_NAME = 'NativeTenTapKeyboard';
const EXPECTED_METHODS = {
  setSystemKeyboardSuppressed: '(suppressed: boolean) => Promise<boolean>',
  showSystemKeyboard: '() => Promise<boolean>',
  isSystemKeyboardVisible: '() => Promise<boolean>',
  setWindowOverlayMode: '(enabled: boolean) => Promise<boolean>',
  getNavigationBarInset: '() => Promise<Double>',
  getStatusBarHeight: '() => Promise<Double>',
};
const EXPECTED_CODEGEN_CONFIG = {
  name: 'RNTenTapSpec',
  type: 'modules',
  jsSrcsDir: 'src/specs',
  android: { javaPackageName: 'com.tentap' },
  ios: { modulesProvider: { [MODULE_NAME]: MODULE_NAME } },
};
const JAVA_TYPES = { boolean: 'boolean', Double: 'double' };

const parseArgs = (argv) => {
  const args = {
    spec: path.join(root, 'src/specs', `${SPEC_NAME}.ts`),
    java: path.join(
      root,
      'android/src/oldarch/com/tentap/TenTapKeyboardSpec.java'
    ),
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (!(key in args) || !value) {
      throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
    }
    args[key] = path.resolve(value);
  }
  return args;
};

const TYPE_NAMES = {
  BooleanTypeAnnotation: 'boolean',
  DoubleTypeAnnotation: 'Double',
  FloatTypeAnnotation: 'Float',
  Int32TypeAnnotation: 'Int32',
  NumberTypeAnnotation: 'number',
  StringTypeAnnotation: 'string',
  VoidTypeAnnotation: 'void',
};

const typeToString = (annotation) => {
  if (annotation.type === 'NullableTypeAnnotation') {
    return `${typeToString(annotation.typeAnnotation)} | null`;
  }
  if (annotation.type === 'PromiseTypeAnnotation') {
    return `Promise<${typeToString(annotation.elementType)}>`;
  }
  return TYPE_NAMES[annotation.type] ?? annotation.type;
};

const signatureOf = ({ typeAnnotation, optional }) => {
  const fn =
    typeAnnotation.type === 'NullableTypeAnnotation'
      ? typeAnnotation.typeAnnotation
      : typeAnnotation;
  const params = fn.params
    .map(
      (p) =>
        `${p.name}${p.optional ? '?' : ''}: ${typeToString(p.typeAnnotation)}`
    )
    .join(', ');
  const signature = `(${params}) => ${typeToString(fn.returnTypeAnnotation)}`;
  return optional ? `${signature} (optional)` : signature;
};

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const checkLiteral = (source, errors) => {
  const code = stripComments(source);
  if (/\bPlatform\b/.test(code))
    errors.push('spec must not reference Platform');
  if (/\bif\s*\(|\s\?\s|\bswitch\s*\(/.test(code)) {
    errors.push('spec must not contain conditionals');
  }
  if (!code.includes(`TurboModuleRegistry.get<Spec>('${MODULE_NAME}')`)) {
    errors.push(
      `spec must export TurboModuleRegistry.get<Spec>('${MODULE_NAME}') as default`
    );
  }
};

const checkSchema = (specPath, errors) => {
  let schema;
  try {
    schema = new TypeScriptParser().parseFile(specPath);
  } catch (error) {
    errors.push(`codegen failed to parse the spec: ${error.message}`);
    return;
  }
  // The parser keys modules by file name, so --spec fixtures can have any name.
  const modules = Object.values(schema.modules).filter(
    (m) => m.type === 'NativeModule'
  );
  if (modules.length !== 1) {
    errors.push(`expected exactly one NativeModule, found ${modules.length}`);
    return;
  }
  const [module] = modules;
  const actual = Object.fromEntries(
    module.spec.methods.map((method) => [method.name, signatureOf(method)])
  );
  for (const [name, expected] of Object.entries(EXPECTED_METHODS)) {
    if (!(name in actual)) {
      errors.push(`missing method ${name}${expected}`);
    } else if (actual[name] !== expected) {
      errors.push(`${name}: expected ${expected}, got ${actual[name]}`);
    }
  }
  for (const name of Object.keys(actual)) {
    if (!(name in EXPECTED_METHODS)) errors.push(`unexpected method ${name}`);
  }
  if (module.spec.eventEmitters.length > 0) {
    errors.push('spec must not declare event emitters');
  }
};

const checkCodegenConfig = (errors) => {
  const { codegenConfig } = require(path.join(root, 'package.json'));
  if (
    JSON.stringify(codegenConfig) !== JSON.stringify(EXPECTED_CODEGEN_CONFIG)
  ) {
    errors.push(
      `package.json#codegenConfig must be ${JSON.stringify(EXPECTED_CODEGEN_CONFIG)}`
    );
  }
};

const javaSignature = (name, signature) => {
  const params = signature
    .slice(1, signature.indexOf(')'))
    .split(', ')
    .filter(Boolean)
    .map((param) => `${JAVA_TYPES[param.split(': ')[1]]}\\s+\\w+\\s*,\\s*`)
    .join('');
  return new RegExp(
    `@ReactMethod(?:\\s+@\\w+)*\\s+public\\s+abstract\\s+void\\s+${name}\\s*\\(\\s*${params}Promise\\s+\\w+\\s*\\)\\s*;`
  );
};

const checkJavaSpec = (javaPath, errors) => {
  if (!fs.existsSync(javaPath)) {
    console.log(
      `- old-arch Java spec not found, skipped (${path.relative(root, javaPath)})`
    );
    return;
  }
  const source = stripComments(fs.readFileSync(javaPath, 'utf8'));
  for (const [name, signature] of Object.entries(EXPECTED_METHODS)) {
    if (!javaSignature(name, signature).test(source)) {
      errors.push(
        `Java spec: ${name} must be "@ReactMethod public abstract void ${name}(…, Promise)" matching ${signature}`
      );
    }
  }
  const declared = [
    ...source.matchAll(/@ReactMethod[\s\S]*?\bvoid\s+(\w+)\s*\(/g),
  ].map((m) => m[1]);
  for (const name of declared) {
    if (!(name in EXPECTED_METHODS))
      errors.push(`Java spec: unexpected method ${name}`);
  }
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const errors = [];
  checkLiteral(fs.readFileSync(args.spec, 'utf8'), errors);
  checkSchema(args.spec, errors);
  checkCodegenConfig(errors);
  checkJavaSpec(args.java, errors);

  if (errors.length > 0) {
    console.error(
      `Codegen check failed for ${path.relative(root, args.spec)}:`
    );
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(
    `Codegen spec OK: ${SPEC_NAME} (${Object.keys(EXPECTED_METHODS).length} methods)`
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
