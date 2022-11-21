import util from 'util';

export function inspect(itemToInspect) {
  console.log(util.inspect(itemToInspect, false, Infinity, true));
}
