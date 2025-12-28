'use client'
import React from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, CheckIcon, PopcornIcon } from "lucide-react"
function ConnectCard(props: any) {
    const {
        userId,
        botActive,
        handleEnableBot,
        handleDisableBot,
        loading,
        qr,
        connected,
        handleDisconnectBot
    } = props
    return (
        <Card className="space-y-4 w-full">
            <CardHeader>
                <CardTitle>WhatsApp Bot</CardTitle>
                <CardDescription className="mt-4">
                    Enable the bot to automatically handle incoming messages and respond.
                </CardDescription>

                <div className="space-y-6" style={{ marginTop: "1rem" }}>
                    {/* Step 1 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                1
                            </div>
                            <div className="flex-1 w-px bg-gray-300 dark:bg-gray-700 mt-1"></div>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Enable the Bot</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Click the <b>Enable Bot</b>  button below to activate your WhatsApp bot.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                2
                            </div>
                            <div className="flex-1 w-px bg-gray-300 dark:bg-gray-700 mt-1"></div>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Connect WhatsApp</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Scan the generated <b> QR code</b> with your WhatsApp app to connect your account.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white">
                                3
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Bot is Ready</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Once <b>connected</b>, your bot will automatically handle incoming messages and respond instantly.
                            </p>
                        </div>
                    </div>
                </div>



            </CardHeader>
            <CardContent>
                {!botActive ? (
                    <div className="flex flex-col items-center space-y-4">
                        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
                            <AlertTriangleIcon />
                            <AlertTitle>Bot Not Enabled!</AlertTitle>
                            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                                Your Bot is currently not enabled. It will not be able to automate replies.
                            </AlertDescription>
                        </Alert>

                        {/* Enable Bot Button */}
                        <div className="w-full flex justify-start">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="lg" disabled={!userId}>
                                        Enable Bot
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Confirm Enable Bot</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to enable the bot? This will generate a WhatsApp QR code.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button size="sm" className="bg-gray-200 hover:bg-gray-300 mr-2">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={handleEnableBot}
                                            >
                                                Confirm
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {!userId && (
                            <Alert variant="destructive" className="w-full">
                                <AlertTitle>Not Logged In</AlertTitle>
                                <AlertDescription>
                                    Please log in to enable the bot.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Alert variant="default" className="w-full">
                            <AlertDescription>
                                Once enabled, the bot will generate a QR code for WhatsApp login.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-4 w-full">
                        {/* Phase 1: Bot Enabled */}
                        <div className="flex flex-col items-center space-y-4">
                            <Alert variant="default" className="w-full flex items-start space-x-3">
                                <CheckCircle2Icon className="h-5 w-5 mt-1 text-green-600" />
                                <div className="flex flex-col">
                                    <AlertTitle>Bot Enabled!</AlertTitle>
                                    <AlertDescription>
                                        Your bot is enabled and ready to connect.
                                    </AlertDescription>
                                </div>
                            </Alert>

                            {/* Disable Bot Button */}
                            <div className="w-full flex justify-start">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="hover:bg-red-700">
                                            Disable Bot
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Confirm Disable Bot</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to disable the bot? This will disconnect it immediately.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button size="sm" className="bg-gray-200 hover:bg-gray-300 mr-2">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600 hover:bg-red-700"
                                                    onClick={handleDisableBot}
                                                >
                                                    Confirm
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-strong" />
                            </div>
                        </div>

                        {/* Phase 2: QR or Connected Status */}
                        <div className="flex flex-col items-center space-y-4">
                            {loading && (
                                <Alert variant="default" className="w-full">
                                    <AlertDescription>Connecting bot...</AlertDescription>
                                </Alert>
                            )}

                            {qr && !connected && (
                                <div className="flex flex-col items-center space-y-2">
                                    <Alert variant="default" className="w-full text-center">
                                        <AlertDescription className='flex'>
                                            Scan this QR code with WhatsApp to connect within <b>5 minutes</b>:
                                        </AlertDescription>
                                    </Alert>
                                    <img src={qr} alt="WhatsApp QR Code" className="w-48 h-48" />
                                </div>
                            )}

                            {!qr && connected && botActive && (

                                <Alert variant="default" className="w-full flex items-start space-x-3">
                                    <CheckCircle2Icon className="h-6 w-6 text-green-600 flex-shrink-0 self-start" />
                                    <div className="flex flex-col">
                                        <AlertTitle>Bot Connected!</AlertTitle>
                                        <AlertDescription>
                                            <p>Your bot is connected and active. It will handle incoming messages automatically.</p>
                                            <p>
                                                There is no need to scan QR since you are still connected. If you want to disconnect your WhatsApp from the bot {' '}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDisconnectBot()}
                                                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                                                >
                                                    click here
                                                </button>
                                            </p>
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default ConnectCard