import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/lib/auth/show-access";
import { CreateShowWizard } from "./create-show-wizard";

export default async function NewShowPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return <CreateShowWizard />;
}
