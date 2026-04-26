"use client";

import { ResumeSnapshot, ResumeSnapshotMeta } from "@/lib/db/types";
import { getSnapshotDetailAction } from "@/lib/actions/history.actions";
import { 
  Eye, 
  ExternalLink, 
  Clock,
  Archive,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { motion } from "framer-motion";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";

export type HistoryClientProps = {
  snapshots: ResumeSnapshotMeta[];
};

export function HistoryClient({ snapshots }: HistoryClientProps) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<ResumeSnapshotMeta | null>(null);
  const [selectedFull, setSelectedFull] = useState<ResumeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cache, setCache] = useState<Record<string, ResumeSnapshot>>({});

  async function handleViewDetails(snapshot: ResumeSnapshotMeta) {
    setSelectedSnapshot(snapshot);
    setIsOpen(true);
    
    if (cache[snapshot.id]) {
      setSelectedFull(cache[snapshot.id]);
      return;
    }

    setIsLoading(true);
    setSelectedFull(null);
    try {
      const full = await getSnapshotDetailAction(snapshot.id);
      if (full) {
        setSelectedFull(full);
        setCache(prev => ({ ...prev, [snapshot.id]: full }));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const listDateFormatter = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const detailDateFormatter = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: true 
  });

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-white/50 p-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <Archive className="size-8" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-neutral-900">No history found</p>
          <p className="max-w-xs text-sm text-neutral-500">
            Snapshots are created automatically when you update an approved resume.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((snapshot) => (
          <Card
            key={snapshot.id}
            className="group relative flex flex-col overflow-hidden border-neutral-200/60 bg-white transition-all hover:border-success/20 hover:shadow-lg hover:shadow-success/5"
          >
            {/* Version Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-success/20 text-[11px] font-bold text-success">
                  v{snapshot.version}
                </div>
                <span className="text-[12px] font-semibold text-neutral-700">Approved Version</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                <Clock className="size-3" />
                {listDateFormatter.format(new Date(snapshot.createdAt))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="mb-1 text-sm font-bold text-neutral-900 truncate">
                {snapshot.jobTitle || "Resume Version"}
              </h3>
              <p className="line-clamp-2 text-[12px] text-neutral-500 leading-relaxed">
                {snapshot.professionalSummary || "No professional summary provided."}
              </p>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-neutral-500 font-medium">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-neutral-700">{snapshot.counts.experiences}</span> Exp.
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-neutral-700">{snapshot.counts.education}</span> Edu.
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-neutral-700">{snapshot.counts.skills}</span> Skills
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-neutral-100 p-2">
              <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                <Button
                  variant="ghost"
                  onClick={() => handleViewDetails(snapshot)}
                  className="h-9 w-full gap-2 rounded-lg text-[12px] font-bold text-success hover:bg-success/10 hover:text-success/90"
                >
                  <Eye className="size-4" />
                  View Details
                </Button>
              </motion.div>
            </div>
          </Card>
        ))}
      </div>

      {/* Single Shared Dialog for Performance */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          {selectedFull ? (
            <>
              <DialogHeader className="bg-success px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-white text-lg">
                      Snapshot v{selectedFull.version}
                    </DialogTitle>
                    <DialogDescription className="text-success/80 text-xs">
                      Archived on {detailDateFormatter.format(new Date(selectedFull.createdAt))}
                    </DialogDescription>
                  </div>
                  <Button variant="outline" className="h-8 gap-2 bg-success/90 border-white/20 text-white hover:bg-success/80 hover:text-white">
                     <ExternalLink className="size-3" />
                     View Official
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto bg-neutral-50/10 p-4 sm:p-8">
                 <div className="mx-auto w-fit shadow-2xl shadow-neutral-900/10 origin-top scale-[0.6] min-[880px]:scale-100 transition-transform duration-300">
                    <ResumePreview 
                      employeeName={selectedFull.snapshotData.employee.displayName}
                      profile={selectedFull.snapshotData.profile}
                      experiences={selectedFull.snapshotData.workExperiences}
                      education={selectedFull.snapshotData.education}
                      skills={selectedFull.snapshotData.skills}
                      certifications={selectedFull.snapshotData.certifications}
                      projects={selectedFull.snapshotData.projects}
                      licenses={selectedFull.snapshotData.licenses}
                      achievements={selectedFull.snapshotData.achievements}
                    />
                 </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 bg-white">
              <div className="relative flex items-center justify-center">
                <div className="absolute size-12 animate-ping rounded-full bg-success/20 opacity-75"></div>
                <Loader2 className="relative size-10 animate-spin text-success" />
              </div>
              <p className="animate-pulse text-sm font-medium text-neutral-500">Loading version details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
