import { redirect } from "next/navigation";
import { currentUser } from "@/lib/fc-auth";
import { FC_CATEGORIES } from "@/lib/fc-types";
import AdminClient from "./AdminClient";

const ADMIN_USERNAMES = (process.env.FC_ADMINS || "will,maddie").split(",");

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
    return <div className="fc-empty">Not authorized.</div>;
  }
  return <AdminClient categories={FC_CATEGORIES as unknown as string[]} />;
}
