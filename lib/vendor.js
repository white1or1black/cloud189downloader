export async function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(resolve, t * 1000);
  });
}

export function isCharDigit(c) {
  return /^[a-z0-9]$/i.test(c);
}

export function ex(select) {
  if (!select instanceof String || select.length === 0)
    return null;

  select = select.split(' ')[0];
  let i = 0;
  while (i < select.length && !isCharDigit(select[i])) i++;
  return select.substring(i);
}