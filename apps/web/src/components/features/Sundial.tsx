import React from "react";
import {
  Text,
  Button,
  Input,
  Group,
  Card,
  Select,
  Label,
} from "@shared/components";
import { FaRegCompass, FaSearch } from "react-icons/fa";
import { Event } from "@shared/database";
import { useRouter } from "next/router";
import { trpc } from "@src/utils/trpc";
import { Formik } from "formik";
import * as Yup from "yup";
import { GiSundial } from "react-icons/gi";

const Sundial = () => {
  const router = useRouter();
  const { data } = trpc.feature.seasons.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
    }
  );
  console.log(data);

  return (
    <Card
      icon={<GiSundial />}
      title="Sundial"
      theme="text-orange-300"
      className="bg-orange-100 dark:bg-black shadow-2xl shadow-orange-400/70 dark:shadow-orange-400/50 p-2"
    >
      <Formik
        initialValues={{
          event: "PublicForum",
          season: 2023,
        }}
        validationSchema={Yup.object().shape({
          event: Yup.string().required("An event is required."),
          season: Yup.number().required("A season is required."),
        })}
        onSubmit={async (values) => {
          router.push({
            pathname: "/tools/sundial/calendar",
            query: {
              event: values.event,
              season: values.season,
            },
          });
        }}
      >
        {(props) => (
          <form
            onSubmit={props.handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <Select
              name="event"
              options={[
                {
                  name: "Public Forum",
                  value: "PublicForum",
                },
                {
                  name: "Lincoln Douglas",
                  value: "LincolnDouglas",
                },
                {
                  name: "Policy",
                  value: "Policy",
                },
              ]}
              value={props.values.event}
              handleChange={props.handleChange}
              className="!w-full"
            />
            <Select
              name="season"
              options={
                data?.map(({ id: s }) => ({ name: s.toString(), value: s })) ??
                []
              }
              value={props.values.season}
              handleChange={props.handleChange}
              className="!w-full"
            />
            <Button onClick={props.handleSubmit} _type="primary">
              View Calendar
            </Button>
          </form>
        )}
      </Formik>
    </Card>
  );
};

export default Sundial;
