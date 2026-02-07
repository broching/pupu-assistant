"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useApiClient } from "../../utils/axiosClient";
import { useUser } from "../../context/userContext";
import { Mail, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ContentLayout } from "@/components/admin-panel/content-layout";

type Filter = {
  id: string;
  filter_name: string;
  notification_mode: string;
  watch_tags: string[];
  ignore_tags: string[];
  created_at: string;
  updated_at: string;
};

export default function FiltersPage() {
  const router = useRouter();
  const apiClient = useApiClient();
  const { user } = useUser();

  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<Filter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchFilters = async () => {
      try {
        const res = await apiClient.get("/api/filter");
        setFilters(res.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load filters");
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, [user?.id]);

  const handleEdit = (id: string) => {
    router.push(`/filters/${id}/edit`);
  };

  const handleOpenDeleteModal = (filter: Filter) => {
    setDeleteTarget(filter);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiClient.delete(`/api/filter/${deleteTarget.id}`);
      setFilters(filters.filter((f) => f.id !== deleteTarget.id));
      toast.success("Filter deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete filter");
    } finally {
      setDeleteTarget(null);
      setModalOpen(false);
    }
  };

  if (loading) return <p>Loading filters...</p>;

  return (
    <ContentLayout title="Filters">
      <div className="flex justify-center">
        <div className="w-full max-w-screen-2xl mt-7 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Email Filters</h1>
              <p className="text-sm text-muted-foreground">
                Manage how incoming emails trigger notifications and alerts.
              </p>
            </div>

            <Button onClick={() => router.push("/filters/create-filter")}>
              Create Filter
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border w-full max-w-screen-2xl mt-7">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Filter Name</div>
                <div className="col-span-2">Notification Mode</div>
                <div className="col-span-4">Watch Tags</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {/* Rows */}
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-sm border-b last:border-b-0"
                >
                  <div className="col-span-3 flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {filter.filter_name}
                  </div>

                  <div className="col-span-2 text-muted-foreground">
                    {filter.notification_mode}
                  </div>

                  <div className="col-span-4 flex items-center gap-2">
                    {/* Tags container - show only 3 tags */}
                    <div className="relative max-h-[28px] overflow-hidden flex flex-wrap gap-1">
                      {filter.watch_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                      {filter.watch_tags.length > 3 && (
                        <span className="text-muted-foreground">…</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(filter.id)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDeleteModal(filter)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.filter_name}</strong>? This action cannot be undone.
            </p>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  );
}
