import _ from "lodash";

export default function getStd(array: number[] | undefined | null) {
  if (!array) return array;
  const avg = _.sum(array) / array.length;
  return Math.round(Math.sqrt(_.sum(_.map(array, (i) => Math.pow((i - avg), 2))) / array.length) *  100) / 100;
};