import { db } from "@/lib/db";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportActions } from "./report-actions";
import type { ReportStatus } from "@/generated/prisma";

const statusVariant: Record<
  ReportStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPEN: "destructive",
  REVIEWING: "default",
  RESOLVED: "secondary",
  DISMISSED: "outline",
};

export default async function ReportsPage() {
  const reports = await db.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
      shoePost: { select: { id: true, title: true } },
      reportedUser: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <Badge variant="outline">{reports.length} total</Badge>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No reports yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {report.shoePost
                      ? `Post: ${report.shoePost.title}`
                      : report.reportedUser
                        ? `User: ${report.reportedUser.name}`
                        : "Unknown target"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Reported by {report.reporter.name} on{" "}
                    {format(report.createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[report.status]}>
                    {report.status}
                  </Badge>
                  <ReportActions
                    reportId={report.id}
                    currentStatus={report.status}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-medium">Reason:</span> {report.reason}
                </p>
                {report.details && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.details}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
