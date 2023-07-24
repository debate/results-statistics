export default function getStringFromList(list: string[]) {
  if (list.length < 2) return list;
  else if (list.length == 2) return `${list[0]} and ${list[1]}`
  else return list.map((el, idx) => {
    if (idx === list.length - 1) {
      return 'and ' + el;
    }
    return el;
  }).join(', ');
}