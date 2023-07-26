export default function getStringFromList(list: string[], andStr = " and "): string {
  if (list.length < 2) return list[0];
  else if (list.length == 2) return `${list[0]}${andStr}${list[1]}`
  else return list.map((el, idx) => {
    if (idx === list.length - 1) {
      return andStr + el;
    }
    return " " + el;
  }).join(',');
}