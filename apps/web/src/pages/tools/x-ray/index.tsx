import { prisma } from "@shared/database";
import { XRay } from "@src/components/features";
import FeaturePage from "@src/components/layout/ToolPage";
import { appRouter } from "@src/server/routers/_app";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import React from "react";

const Index = () => {
  return (
    <FeaturePage
      name="X-Ray"
      description="Use it to predict the outcome of a round."
      feature={<XRay />}
      instructions={[
        "Choose your event, season, and circuit.",
        [
          "Select the two teams competing by searching for their code.",
          "The teams must've completed at least once in the specified event, season, and circuit combination.",
        ],
        "(Optional) Add the judge(s) for the round by searching for their name.",
        "Get your custom head-to-head prediction!",
      ]}
    />
  );
};

export const getStaticProps = async () => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: {
      prisma,
    },
  });

  await ssg.feature.compass.prefetch({});

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60 * 30, // Half hour
  };
};

export default Index;
