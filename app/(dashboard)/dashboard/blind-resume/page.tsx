import { UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BlindResumePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-neutral-50 p-4">
            <UserX className="size-10 text-neutral-300" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">Coming Soon</h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            We are working on the automatic generation of blind resumes. This section will allow you to share your profile without personal identifiers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
