import { GetServerSidePropsContext } from "next";
import { parse } from "cookie";

export const requireAuth = (ctx: GetServerSidePropsContext) => {
  const cookies = parse(ctx.req.headers.cookie || "");
  const isAuthed = cookies.admin_session === "1";
  if (!isAuthed) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
