const fs = require('fs');
const babel = require('@babel/core');
const path = require('path');

const Module = module.constructor;
const mInstance = new Module();
const fileSuffix = ['.js', '.json'];

function fileExistsAssert(condition) {
  if (!condition) throw new Error('File not found!');
}

function checkSuffix(p) {
  return fileSuffix.some(su => {
    if (fs.existsSync(p + su)) {
      p += su;
      return true;
    } else {
      return false;
    }
  }) ? p : null;
}

function findValidFile(p) {
  p = path.join(process.cwd(), p);

  let validSu = fileSuffix.some(su => p.endsWith(su));
  if (validSu) return fs.existsSync(p) ? p : null;

  const tmp = checkSuffix(p);
  if (tmp) return tmp;

  if (fs.statSync(p).isDirectory())
    p = path.join(p, 'index');
  return checkSuffix(p);
}

function requireEsModule(p) {
  p = findValidFile(p);
  fileExistsAssert(p);

  let script = fs.readFileSync(p).toString();
  const code = babel.transformSync(script, {
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code;

  mInstance._compile(code, '');
  return mInstance.exports;
}

function removeImportExport(script) {
  return babel.transformSync(script, {
    plugins: ["remove-import-export"]
  }).code;
}

module.exports = {
  requireEsModule,
  removeImportExport,
};