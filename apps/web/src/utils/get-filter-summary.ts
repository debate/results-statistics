import { Event } from "@shared/database";
import getStringFromList from "./get-string-from-list";
import getEnumName from "./get-enum-name";
import _ from "lodash";

export default function getFilterSummary(events?: Event[], circuits?: string[], seasons?: number[]) {
  let seasonDesc: string;
  if (seasons) {
    seasons.sort((a, b) => a - b);
    let uniqueSeasons = _.uniq(seasons);
    let blocks: number[][] = [];
    for (let i = 0; i < uniqueSeasons.length; i++) {
      if (i !== 0 && uniqueSeasons[i] === uniqueSeasons[i - 1] + 1) {
        // Has continuity
        blocks[blocks.length - 1].push(uniqueSeasons[i]);
      } else {
        // No continuity or no previous block
        blocks.push([uniqueSeasons[i]]);
      }
    }
    seasonDesc = getStringFromList(blocks.map(block => {
      let start = "'" + block[0].toString().substring(2);
      let end =  "'" + block[block.length - 1].toString().substring(2);
      if (block.length === 1) {
        return start;
      } else {
        return `${start}-${end}`;
      }
    }), ", ");
  } else {
    seasonDesc = "All Seasons";
  }

  return `${events ? getStringFromList(_.uniq(events.map(e => getEnumName(e)!)), ", ") : "All Events"} | ${circuits ? getStringFromList(_.uniq(circuits), ", ") : "All Circuits"} | ${seasonDesc}`
}