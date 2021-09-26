
const SECONDS_PER_DOWNLOAD = 2;

function checkDownloadBtn() {
  return !!$(DOWNLOAD_BTN_SELECTOR).length;
}
function checkCancelBtn() {
  return !!$(DOWNLOAD_CANCEL_BTN_SELECTOR).length;
}

function newElement(tag, attributes, inner) {
  const newEle = document.createElement(tag);
  Object.keys(attributes).forEach(attrName => {
    newEle.setAttribute(attrName, attributes[attrName]);
  });
  newEle.innerHTML = inner || '';
  return newEle;
}

function addLoadedTag() {
  document.body.appendChild(
    newElement('div', { id: ex(RESOURCE_LOAD_SELECTOR) })
  );
}

async function addDownloadBtn(parent) {
  if (checkDownloadBtn()) return;

  const dlEle = newElement('div', {
    id: ex(DOWNLOAD_BTN_SELECTOR),
    class: 'download-btn',
  }, '<button>download</button>');

  dlEle.addEventListener('click', () => {
    document.body.appendChild(
      newElement('div', {
        id: ex(DOWNLOAD_TASK_SELECTOR),
      })
    )
  });

  parent.appendChild(dlEle);
}

async function addCancelBtn(parent) {
  if (checkCancelBtn()) return;

  const cancelEle = newElement('div', {
    id: ex(DOWNLOAD_CANCEL_BTN_SELECTOR),
    class: 'download-btn',
  }, '<button>cancel</button>');

  cancelEle.addEventListener('click', () => {
    document.body.appendChild(
      newElement('div', {
        id: ex(DOWNLOAD_CANCEL_TASK_SELECTOR),
      })
    )
  });

  parent.appendChild(cancelEle);
}
async function addDownloadHelperBoard() {
  const board = newElement('div', { class: 'download-helper-board' }, `
    <div class="helper-board-title">Download Helper Board</div>
  `);
  document.body.appendChild(board);

  await addDownloadBtn(board);
  await addCancelBtn(board);
}

$(document).ready(async function () {
  await addDownloadHelperBoard();
  await addLoadedTag();
});
