import { trpc } from "@src/utils/trpc";
import React, { useEffect } from "react";
import TextTransition from "./TextTransition";

const LiveUpdates = () => {
  const { data: updates } = trpc.landingPage.liveUpdates.useQuery();
  const [index, setIndex] = React.useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => setIndex((index) => index + 1), 3000);

    return () => clearTimeout(intervalId);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-blue-500 font-semibold mx-auto md:mx-0">
      <div className="relative grid place-content-center">
        <span className="w-3 h-3 bg-gradient-to-r from-sky-400 via-purple-500 to-red-400 rounded-full z-20" />
        <div className="absolute w-full h-full grid place-content-center">
          <span className="w-3 h-3 bg-gradient-to-r from-sky-400 via-purple-500 to-red-400 rounded-full animate-ping" />
        </div>
      </div>
      <div className="flex space-x-1 max-w-[300px] lg:max-w-[400px]">
        <p>Live:</p>
        {updates ? (
          <TextTransition
            text={updates[index % updates.length]}
            springConfig="stiff"
            className="max-w-lg"
            inline
          />
        ) : undefined}
      </div>
    </div>
  );
};

export default LiveUpdates;
