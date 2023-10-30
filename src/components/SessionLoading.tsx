import { useSession } from "next-auth/react";

const SessionLoading = () => {
  const { status } = useSession({
    required: true,
  });

  if (status === "loading") {
    return "User is loading";
  }

  return "User is logged in!";
};

export default SessionLoading;
