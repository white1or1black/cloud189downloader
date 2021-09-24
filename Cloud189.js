const { requireEsModule, removeImportExport } = require('./lib/requireEsModule');
const { sleep, ex } = requireEsModule('./lib/vendor');
const {
  DOWNLOAD_BTN_SELECTOR,
  DOWNLOAD_TASK_SELECTOR,
  RESOURCE_LOAD_SELECTOR,
} = requireEsModule('./constants');
const puppeteer = require('puppeteer');
const fs = require('fs');
const CDP = require('chrome-remote-interface');

const STATE_IN_PROGRESS = 'inProgress';
const STATE_COMPLETED = 'completed';
const STATE_CANCELED = 'canceled';

const MAX_PROCESSING_NUM = 5;
const MAX_REQ_TIMEOUT = 10;

const SLEEP_SEC_PER_ROUND = 3;

const STATE_NO = 1;
const STATE_REQ = 2;


class Cloud189 {
  constructor(url) {
    this.url = url;
    this.browser = null;
    this.page = null;
    this.fileList = [];
    this.downloading = false;
    this.loopTimer = null;
    this.cookiesPath = './cookies.txt';
    this.dlQueue = [];  // Downloading queue.
    this.dlProcess = new Map();  // Download processing set.
    this.cdpCli = null;
    this.isDlReq = false;
    this.curDlItem = null;
    this.reqTimeout = 0;

    this.browserConfig = {
      headless: false,
      defaultViewport: null,
    };
  }

  async storeCookie(cookies) {
    fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies));
  }

  async loadCookies() {
    try {
      return JSON.parse(fs.readFileSync(this.cookiesPath).toString());
    } catch (err) {
      return null;
    }
  }

  /**
   * Run browser and open target page.
   */
  async start() {
    this.browser = await puppeteer.launch(this.browserConfig);
    this.page = (await this.browser.pages())[0];

    await this.initCdpClient();
    await this.initPageEvent();
    await this.initCookie();
    await this.page.goto(this.url);
    await this.loop();
  }

  async initPageEvent() {
    await this.listen(this.cdpCli, 'Page.downloadWillBegin', data => {
      this.isDlReq = false;
      const { guid } = data;
      this.dlProcess.set(guid, STATE_REQ);
    });

    await this.listen(this.cdpCli, 'Page.downloadProgress', data => {
      const { guid, state } = data;
      if (state === STATE_IN_PROGRESS) {
        this.dlProcess.set(guid, STATE_NO);
      } else if (state === STATE_CANCELED || state === STATE_COMPLETED) {
        this.dlProcess.delete(guid);
      } else {
        console.log('Unknown state, guid:', guid, ' state: ', state);
      }
    });
  }

  async initCdpClient() {
    const ep = new URL(this.browser.wsEndpoint())
    const client = this.cdpCli = await CDP({
      host: ep.hostname,
      port: ep.port,
      secure: ep.protocol === 'wss:',
    });

    await client.Page.enable();
    await client.Runtime.enable();
    await client.Debugger.enable();
    return client;
  }

  /**
   * Set cookie for page.
   */
  async initCookie() {
    const cookies = await this.loadCookies();
    if (cookies)
      await Promise.all(
        cookies.map(cookie => {
          this.page.setCookie(cookie);
        })
      )
  }

  hasDlReq() {
    return this.isDlReq;
  }

  async loop() {
    let round = 1;
    while (true) {
      console.log(`Loop round ${round++} start.`);

      await this.loadResources();
      await this.storeCookie(await this.page.cookies());

      await this.downloadStatusHandler();
      await sleep(SLEEP_SEC_PER_ROUND);
    }
  }

  /**
   * Add download item to queue.
   * @returns 
   */
  async downloadFiles() {
    const dlItems = await this.page.$$('.file-list-ul > li');
    if (!dlItems instanceof Array) return;

    const ps = dlItems.map(item =>
      item.$eval('.file-item-check', ele => ele.getAttribute('value') === 'true')
    );

    const results = await Promise.all(ps);
    const startIdx = results.findIndex(_ => _);

    // Cancel select.
    if (startIdx > -1) {
      const dlItem = await dlItems[startIdx].$('.file-item-check');
      await dlItem.click();
    }

    this.dlQueue = dlItems.slice(startIdx + 1);
  }

  async processingDownload() {
    let ele = null;
    if (this.hasDlReq() && this.reqTimeout <= MAX_REQ_TIMEOUT * 2) {
      if (++this.reqTimeout <= MAX_REQ_TIMEOUT) {
        console.log('Last download item is not started.');
        return;
      }

      if (!this.curDlItem) return;
      ele = this.curDlItem;
    } else {
      if (this.dlQueue.length === 0) {
        console.log('nothing download!');
        return;
      }
      if (this.dlProcess.size >= MAX_PROCESSING_NUM) {
        console.log('Downloading number is too many.');
        return;
      }
      ele = this.dlQueue.shift();
      this.curDlItem = ele;
      this.reqTimeout = 0;
    }

    this.isDlReq = true;
    try {
      const dlItem = await ele.$('.file-item');
      await dlItem.click();
      const dlIcon = await dlItem.$('.file-item-ope-item-download');
      if (dlIcon) await dlIcon.click();
    } catch (err) {
      console.log(err.message);
    }
  }

  async downloadStatusHandler() {
    console.log(`
      Waiting for download response: ${this.isDlReq}
      Downloading: ${this.dlProcess.size}
      Waiting for download: ${this.dlQueue.length}
    `);

    if (this.dlQueue.length > 0) {
      await this.processingDownload();
      return;
    }

    const dlTask = await this.page.$(DOWNLOAD_TASK_SELECTOR);
    if (!dlTask) return;

    await this.page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(ele => ele.remove());
    }, DOWNLOAD_TASK_SELECTOR);

    await this.downloadFiles();
  }

  /**
   * Close browser.
   */
  async close() {
    clearInterval(this.loopTimer);
    this.browser.close();
  }

  async ceval(selector, fn) {
    try {
      return await this.page.$eval(selector, fn);
    } catch (err) {
      console.log(err.message);
      return null;
    }
  }

  async checkLoadedTag() {
    return await this.page.$(RESOURCE_LOAD_SELECTOR);
  }

  async loadResources() {
    if (await this.checkLoadedTag()) return;
    await this.page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.6.0.min.js' });
    await this.page.addStyleTag({ path: './browser/index.css' });
    await this.page.addScriptTag({
      content: `
        ${removeImportExport(fs.readFileSync('./lib/vendor.js'))};
        ${removeImportExport(fs.readFileSync('./constants.js'))};
        ${fs.readFileSync('./browser/script.js')};
        `
    });
  }

  async listen(cli, eventName, fn) {
    cli.on(eventName, fn);
  }
}

module.exports = Cloud189;