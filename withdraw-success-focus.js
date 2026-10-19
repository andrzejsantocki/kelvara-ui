export function withdrawSuccessReturnKey(element) {
  if (!element) return null;
  if (typeof element.dataset?.withdrawReturnFocus === 'string' && element.dataset.withdrawReturnFocus) return element.dataset.withdrawReturnFocus;
  return typeof element.id === 'string' && element.id ? `id:${element.id}` : null;
}

export function focusWithdrawSuccessReturnTarget(original, key, root = document) {
  if (original?.isConnected) {
    original.focus();
    return true;
  }
  let replacement = null;
  if (typeof key === 'string' && key.startsWith('id:')) replacement = root.getElementById(key.slice(3));
  else if (key) replacement = [...root.querySelectorAll('[data-withdraw-return-focus]')].find(element => element.dataset.withdrawReturnFocus === key);
  if (!replacement?.isConnected) return false;
  replacement.focus();
  return true;
}
