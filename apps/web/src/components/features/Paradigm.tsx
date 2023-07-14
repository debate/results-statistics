import { Card, Select } from "@shared/components";
import { Paradigm } from "@shared/database";
import React, { useState } from "react";
import { BsCardText } from "react-icons/bs";

interface ParadigmProps {
  data: Paradigm[];
}

const Paradigm = ({ data }: ParadigmProps) => {
  const [paradigm, setParadigm] = useState<Paradigm>(data[0]);
  return (
    <Card
      icon={<BsCardText />}
      title="Paradigms"
      className="relative max-w-[800px] mx-auto my-4 md:my-8"
      actionBar={
        <Select
          className="md:!w-32"
          options={data.map((d) => ({
            name: new Date(d.scrapedAt * 1000).toLocaleDateString("en-us"),
            value: d.id,
          }))}
          onChange={(v) =>
            setParadigm(data.find((d) => d.id === parseInt(v)) as Paradigm)
          }
        />
      }
      collapsible
    >
      <div
        className="prose md:max-h-[600px] md:px-4 md:overflow-y-auto dark:prose-invert prose-base prose-headings:my-2 prose-a:text-blue-400 w-full mx-auto"
        dangerouslySetInnerHTML={{
          __html: paradigm?.html.replaceAll('style="color: blue;"', ""),
        }}
      />
    </Card>
  );
};

export default Paradigm;
