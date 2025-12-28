'use client'

import React, { useEffect, useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useApiClient } from "../utils/axiosClient"
import { useUser } from "../context/userContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LeadsTablePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("none"); // "none" | "highestScore"
  const apiClient = useApiClient();
  const { user, session } = useUser();
  const router = useRouter()

  useEffect(() => {
    if (!session?.access_token) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/messages?user_id=${user?.id}`);
        const messages = res.data.messages || [];

        const grouped: Record<string, any> = {};

        messages.forEach((msg: any) => {
          if (!grouped[msg.contact_number]) {
            grouped[msg.contact_number] = {
              contactName: msg.contact_name || "Unknown",
              contactNumber: msg.contact_number,
              urgent: [],
              medium: [],
              low: []
            };
          }

          // Only include unresolved messages
          if (!msg.resolved) {
            if (msg.urgency === "urgent") grouped[msg.contact_number].urgent.push(msg);
            else if (msg.urgency === "medium") grouped[msg.contact_number].medium.push(msg);
            else if (msg.urgency === "low") grouped[msg.contact_number].low.push(msg);
            // ignore messages with no urgency
          }
        });

        const leadsArray = Object.values(grouped).map((lead: any) => {
          const urgentScores = lead.urgent.map((m: any) => m.score || 0);
          const avgUrgentScore =
            urgentScores.length > 0
              ? urgentScores.reduce((a: number, b: number) => a + b, 0) / urgentScores.length
              : null;

          return { ...lead, avgUrgentScore };
        });

        setLeads(leadsArray);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        toast.error(err?.response?.data?.error || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [session]);

  // Filtered + sorted leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.contactName.toLowerCase().includes(q) ||
          lead.contactNumber.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "highestScore") {
      result = [...result].sort((a, b) => {
        const scoreA = a.avgUrgentScore ?? -Infinity;
        const scoreB = b.avgUrgentScore ?? -Infinity;
        return scoreB - scoreA;
      });
    }

    return result;
  }, [leads, search, sortBy]);

  // Helper for score color
  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-gray-300 text-gray-700";
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-black";
    return "bg-red-500 text-white";
  };

  return (
    <div className="p-6 flex justify-center">
      <Card
        className="shadow-lg w-full max-w-7xl" // control max width
        style={{ backgroundColor: "var(--card)" }}
      >
        <CardHeader>
          <CardTitle className="text-xl">Top Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            {/* Search Input */}
            <Input
              placeholder="Search by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/3"
            />

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="highestScore">Highest Lead Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableCaption>A list of your most engaged leads.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Average Lead Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell>{lead.contactName}</TableCell>
                    <TableCell>{lead.contactNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                            {lead.urgent.length}
                          </div>
                          <span>urgent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                            {lead.medium.length}
                          </div>
                          <span>medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                            {lead.low.length}
                          </div>
                          <span>low</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {lead.avgUrgentScore !== null ? (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getScoreColor(
                            lead.avgUrgentScore
                          )}`}
                        >
                          {lead.avgUrgentScore.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/leads/${lead.contactNumber}`)}
                      >
                        View
                      </Button>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
