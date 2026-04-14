import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAdminUsers } from "@/lib/actions/admin-actions";
import { UserDisableButton } from "./user-disable-button";
import { format } from "date-fns";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          Disable accounts to block sign-in and hide their listings from the public feed.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Listings</TableHead>
            <TableHead className="text-center">Role</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="text-center">{u.listingCount}</TableCell>
              <TableCell className="text-center">
                {u.isAdmin ? (
                  <Badge variant="default">Admin</Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                {u.disabled ? (
                  <Badge variant="destructive">Disabled</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(u.createdAt, "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <UserDisableButton
                  userId={u.id}
                  disabled={u.disabled}
                  isSelf={u.id === session.user.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
