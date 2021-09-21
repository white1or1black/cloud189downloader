
const SECONDS_PER_DOWNLOAD = 2;

function checkDownloadBtn() {
  return !!$(DOWNLOAD_BTN_SELECTOR).length;
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

async function addDownloadBtn() {
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

  $('.info-detail').after(dlEle);
}

$(document).ready(async function () {
  await addDownloadBtn();
  await addLoadedTag();
});
