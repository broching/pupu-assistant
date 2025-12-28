'use client'

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApiClient } from "@/app/utils/axiosClient"
import { useUser } from "@/app/context/userContext"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function LeadChatPage() {
    const { contact_number } = useParams()
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [activeTab, setActiveTab] = useState<"resolved" | "unresolved">("unresolved")
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"none" | "highestScore" | "lowestScore" | "urgent" | "medium" | "low">("none")

    const [highlightedId, setHighlightedId] = useState<string | null>(null)

    const apiClient = useApiClient()
    const { user, session } = useUser()
    const chatEndRef = useRef<HTMLDivElement | null>(null)
    const chatContainerRef = useRef<HTMLDivElement | null>(null)

    const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const router = useRouter()

    const getScoreColor = (score: number | null) => {
        if (score === null) return "bg-gray-300 text-gray-700"
        if (score >= 80) return "bg-green-500 text-white"
        if (score >= 50) return "bg-yellow-500 text-black"
        return "bg-red-500 text-white"
    }

    const resolveMessage = async (id: string, value: boolean) => {
        console.log("resolve", id, value)
        if (!session?.access_token) return

        setLoading(true)
        try {
            // Send the update to your API
            const res = await apiClient.put(`/api/messages`, {
                id,
                resolved: value
            })

            // Update the local messages state
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === id ? { ...msg, resolved: value } : msg
                )
            )

            toast.success(`Message marked as ${value ? "resolved" : "unresolved"}`)
        } catch (err: any) {
            console.error("Error updating message:", err)
            toast.error(err?.response?.data?.error || "Failed to update message")
        } finally {
            setLoading(false)
        }
    }


    const viewMessage = (id: string) => {
        const msgEl = messageRefs.current[id]
        if (msgEl) {
            msgEl.scrollIntoView({ behavior: "smooth", block: "center" })
            setHighlightedId(id)
            setTimeout(() => setHighlightedId(null), 20000) // remove highlight after 10s
        }
    }

    useEffect(() => {
        if (!session?.access_token || !contact_number) return

        const fetchMessages = async () => {
            setLoading(true)
            try {
                const res = await apiClient.get(
                    `/api/messages?user_id=${user?.id}&contact_number=${contact_number}&limit=500`
                )
                const msgs = res.data.messages || []
                msgs.sort(
                    (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )
                setMessages(msgs)
            } catch (err: any) {
                console.error("Error fetching messages:", err)
                toast.error(err?.response?.data?.error || "Failed to load messages")
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()
    }, [session, contact_number])

    useEffect(() => {
        if (chatEndRef.current && chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatEndRef.current.offsetTop,
                behavior: "smooth"
            })
        }
    }, [messages])


    if (loading) return <p className="p-6">Loading...</p>
    if (!messages.length) return <p className="p-6">No messages found.</p>

    const contactName = messages[0]?.contact_name || "Unknown"

    // Filter messages based on tab
    let filteredMessages = messages.filter(
        (msg) =>
            msg.type !== "assistant" &&
            ((activeTab === "resolved" && msg.resolved) || (activeTab === "unresolved" && !msg.resolved))
    )

    // Apply search filter
    if (search.trim() !== "") {
        filteredMessages = filteredMessages.filter(
            (msg) =>
                msg.body?.toLowerCase().includes(search.toLowerCase()) ||
                (msg.score?.toString() ?? "").toLowerCase().includes(search.toLowerCase()) ||
                (msg.insights ?? "").toLowerCase().includes(search.toLowerCase()) ||
                (msg.actions ?? "").toLowerCase().includes(search.toLowerCase())
        )
    }

    // First, sort messages by latest first
    filteredMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Then, apply additional sorting / filtering based on sortBy
    switch (sortBy) {
        case "highestScore":
            filteredMessages.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            break
        case "lowestScore":
            filteredMessages.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
            break
        case "urgent":
            filteredMessages = filteredMessages.filter((msg) => (msg.score ?? 0) >= 80)
            break
        case "medium":
            filteredMessages = filteredMessages.filter(
                (msg) => (msg.score ?? 0) >= 50 && (msg.score ?? 0) < 80
            )
            break
        case "low":
            filteredMessages = filteredMessages.filter((msg) => (msg.score ?? 0) < 50)
            break
        case "none":
        default:
            break
    }




    const totalPages = Math.max(1, Math.ceil(filteredMessages.length / rowsPerPage))
    const displayedMessages = filteredMessages.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    return (
        <div className="wrapper">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center mt-2 ml-2"
                onClick={() => router.push('/leads')}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
            </Button>
            <div className="wrapper p-6 flex flex-col lg:flex-row gap-6">
                {/* Chat - 40% width */}
                <div className="w-full lg:w-2/5">
                    <Card style={{ backgroundColor: "var(--card)" }} className="h-[70vh] flex flex-col">
                        <CardHeader>
                            <CardTitle>Chat with {contactName}</CardTitle>
                        </CardHeader>
                        <Separator className="my-2" />
                        <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto p-4" ref={chatContainerRef}>
                            {messages.map((msg, index) => {
                                const isBot = msg.type === "assistant"
                                const isHighlighted = highlightedId === msg.id
                                return (
                                    <div
                                        key={index}
                                        ref={(el) => {
                                            messageRefs.current[msg.id] = el
                                        }}
                                        className={`flex ${isBot ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-xs p-3 rounded-lg text-sm ${isBot
                                                ? "bg-blue-500 text-white rounded-br-none"
                                                : "bg-gray-200 text-gray-900 rounded-bl-none"
                                                } ${isHighlighted ? "ring-2 ring-green-400" : ""}`}
                                        >
                                            {msg.body}
                                            <div className="text-xs opacity-70 mt-1">
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                )
                            })}
                            <div ref={chatEndRef}></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table - 60% width */}
                <div className="w-full lg:w-3/5">
                    <Card style={{ backgroundColor: "var(--card)" }} className="flex flex-col w-full">
                        <CardHeader>
                            <CardTitle>Lead Details</CardTitle>
                        </CardHeader>
                        <Separator className="my-2" />

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as any); setCurrentPage(1) }} className="mb-4">
                            <TabsList className="ml-4 mb-3 mt-1">
                                <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                            </TabsList>
                            {/* Filters */}
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-4 ">
                                <Input
                                    placeholder="Search by message, score, insights, actions..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full md:w-1/3 ml-4"
                                />
                                <div className="mr-3">
                                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="highestScore">Highest Lead Score</SelectItem>
                                            <SelectItem value="lowestScore">Lowest Lead Score</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="medium">Medium Urgency</SelectItem>
                                            <SelectItem value="low">Low Urgency</SelectItem>
                                            <SelectItem value="none">Default</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <TabsContent value={activeTab}>
                                <CardContent className="flex-1 p-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Actions</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Message</TableHead>
                                                <TableHead>Insights</TableHead>
                                                <TableHead>Recommended</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayedMessages.map((msg, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="flex gap-2 align-top">

                                                        <Button
                                                            variant="default"
                                                            className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-gray-600"
                                                            onClick={() => viewMessage(msg?.id)}
                                                        >
                                                            View
                                                        </Button>
                                                    </TableCell>

                                                    <TableCell className="align-top">
                                                        {msg.score !== null ? (
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getScoreColor(
                                                                    msg.score
                                                                )}`}
                                                            >
                                                                {msg.score}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">N/A</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="max-w-xs break-words whitespace-normal align-top">{msg.body}</TableCell>
                                                    <TableCell className="max-w-xs break-words whitespace-normal align-top">{msg.insights ?? "—"}</TableCell>
                                                    <TableCell className="max-w-xs break-words whitespace-normal align-top">{msg.actions ?? "—"}</TableCell>
                                                    <TableCell className="align-top">
                                                        <Select
                                                            value={msg.resolved ? "resolved" : "unresolved"}
                                                            onValueChange={(val) => {
                                                                resolveMessage(msg.id, val === "resolved")
                                                            }}
                                                        >
                                                            <SelectTrigger
                                                                className={`w-28 font-semibold ${msg.resolved
                                                                    ? "text-green-400"
                                                                    : "text-yellow-500"
                                                                    }`}
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="unresolved">Unresolved</SelectItem>
                                                                <SelectItem value="resolved">Resolved</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>


                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-2">
                                            <span>Rows per page:</span>
                                            <Select
                                                value={rowsPerPage.toString()}
                                                onValueChange={(val) => {
                                                    setRowsPerPage(parseInt(val))
                                                    setCurrentPage(1)
                                                }}
                                            >
                                                <SelectTrigger className="w-20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[5, 10, 25, 50, 100].map((n) => (
                                                        <SelectItem key={n} value={n.toString()}>
                                                            {n}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                disabled={currentPage === 1 || filteredMessages.length === 0}
                                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                                variant="outline"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </Button>
                                            <span>
                                                {filteredMessages.length === 0 ? 0 : currentPage} / {filteredMessages.length === 0 ? 0 : totalPages}
                                            </span>
                                            <Button
                                                disabled={currentPage === totalPages || filteredMessages.length === 0}
                                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                                variant="outline"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>

    )
}
