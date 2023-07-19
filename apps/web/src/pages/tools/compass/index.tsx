import { prisma } from "@shared/database";
import { Compass } from "@src/components/features";
import FeaturePage from "@src/components/layout/ToolPage";
import { appRouter } from "@src/server/routers/_app";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import React from "react";

const Index = () => {
  return (
    <FeaturePage
      name="Compass"
      description="Use it to easily navigate our complex database."
      feature={<Compass />}
      instructions={[
        "Choose your event, season, and circuit.",
        [
          "Check out the data!",
          "Run a dataset search (find competitors, teams, schools, tournaments, etc.)",
          "View a dataset summary page (leaderboards, bid list, and more).",
        ],
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
