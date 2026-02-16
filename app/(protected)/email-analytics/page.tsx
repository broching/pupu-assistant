"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { useApiClient } from "@/app/utils/axiosClient"
import { useUser } from "@/app/context/userContext"

type EmailAIResponse = {
    id: string
    message_id: string
    message_status: "processing" | "completed" | "failed"
    message_score: number | null
    flagged_keywords: string[] | null
    created_at: string
}

export default function EmailAnalyticsPage() {
    const [data, setData] = useState<EmailAIResponse[]>([])
    const [timeRange, setTimeRange] = useState("7d")
    const [loading, setLoading] = useState(true)

    // Frontend pagination
    const [page, setPage] = useState(1)
    const pageSize = 10

    const apiClient = useApiClient()
    const { user } = useUser()

    useEffect(() => {
        fetchData()
    }, [timeRange, user?.id])

    async function fetchData() {
        try {
            setLoading(true)
            setPage(1) // reset page on new filter

            const res = await apiClient.get(
                `/api/email-analytics?range=${timeRange}`
            )

            setData(res.data.data || [])
        } catch (err: any) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    // ---------- Pagination Logic ----------
    const totalPages = Math.ceil(data.length / pageSize)

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return data.slice(start, end)
    }, [data, page])

    // ---------- Stats (calculated from FULL dataset) ----------
    const totalJunk = data.filter((d) => (d.message_score ?? 0) < 40).length
    const totalImportant = data.filter((d) => (d.message_score ?? 0) >= 70).length

    return (
        <ContentLayout title="Email Analytics">
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Email Analytics
                    </h1>

                    <Select
                        value={timeRange}
                        onValueChange={(value) => setTimeRange(value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1d">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Row */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Junk Emails</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-red-500">
                                {totalJunk}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Emails with score below 40
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total Important Emails</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-green-600">
                                {totalImportant}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Emails with score 70+
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Table */}
                <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                        <CardTitle>Email AI Responses</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Message ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Flagged Keywords</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                {row.message_id}
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.message_status === "completed"
                                                            ? "default"
                                                            : row.message_status === "processing"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {row.message_status}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {row.message_score ?? "-"}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {row.flagged_keywords?.map((kw) => (
                                                        <Badge key={kw} variant="outline">
                                                            {kw}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {new Date(row.created_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>

                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    )
}
