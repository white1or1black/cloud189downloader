const Cloud189 = require('./Cloud189');

if (process.argv.length !== 3) {
  console.log(`
    参数有误, 请参照下例:
      node index.js [URL]
  `);
  process.exit(1);
}

const url = process.argv[2]
const reg = /http[s]?:\/\/.*/;
if (!reg.test(url)) {
  console.log('请输入合法的地址');
  process.exit(1);
}

const cloud189 = new Cloud189(url);

(async () => {
  await cloud189.start();
})();

