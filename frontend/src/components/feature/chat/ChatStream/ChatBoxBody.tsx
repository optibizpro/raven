import { Message } from "../../../../../../types/Messaging/Message"
import { useMemo, useState } from "react"
import { ArchivedChannelBox } from "../chat-footer/ArchivedChannelBox"
import { ChannelListItem, DMChannelListItem } from "@/utils/channel/ChannelListProvider"
import { JoinChannelBox } from "../chat-footer/JoinChannelBox"
import { useUserData } from "@/hooks/useUserData"
import useFileUpload from "../ChatInput/FileInput/useFileUpload"
import { CustomFile, FileDrop } from "../../file-upload/FileDrop"
import { FileListItem } from "../../file-upload/FileListItem"
import { useSendMessage } from "../ChatInput/useSendMessage"
import { Flex, Box, IconButton } from "@radix-ui/themes"
import { ReplyMessageBox } from "../ChatMessage/ReplyMessageBox/ReplyMessageBox"
import { BiX } from "react-icons/bi"
import ChatStream from "./ChatStream"
import Tiptap from "../ChatInput/Tiptap"
import useFetchChannelMembers, { Member } from "@/hooks/fetchers/useFetchChannelMembers"
import { useParams } from "react-router-dom"
import clsx from "clsx"
import { Stack } from "@/components/layout/Stack"
import TypingIndicator from "../ChatInput/TypingIndicator/TypingIndicator"
import { useTyping } from "../ChatInput/TypingIndicator/useTypingIndicator"

const COOL_PLACEHOLDERS = [
    "Delivering messages atop dragons 🐉 is available on a chargeable basis.",
    "Note 🚨: Service beyond the wall is currently disrupted due to bad weather.",
    "Pigeons just have better brand recognition tbh 🤷🏻",
    "Ravens double up as spies. Eyes everywhere 👀",
    "Ravens do not 'slack' off. See what we did there? 😉",
    "Were you expecting a funny placeholder? 😂",
    "Want to know who writes these placeholders? 🤔. No one.",
    "Type a message..."
]
// const randomPlaceholder = COOL_PLACEHOLDERS[Math.floor(Math.random() * (COOL_PLACEHOLDERS.length))]
interface ChatBoxBodyProps {
    channelData: ChannelListItem | DMChannelListItem
}

export const ChatBoxBody = ({ channelData }: ChatBoxBodyProps) => {

    const { name: user } = useUserData()
    const { channelMembers, isLoading } = useFetchChannelMembers(channelData.name)

    const { onUserType, stopTyping } = useTyping(channelData.name)

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

    const handleReplyAction = (message: Message) => {
        setSelectedMessage(message)
    }

    const clearSelectedMessage = () => {
        setSelectedMessage(null)
    }

    const onMessageSendCompleted = () => {
        // Stop the typing indicator
        stopTyping()
        // Clear the selected message
        clearSelectedMessage()
    }

    const channelMemberProfile: Member | null = useMemo(() => {
        if (user && channelMembers) {
            return channelMembers[user] ?? null
        }
        return null
    }, [user, channelMembers])

    const { fileInputRef, files, setFiles, removeFile, uploadFiles, addFile, fileUploadProgress } = useFileUpload(channelData.name)

    const { sendMessage, loading } = useSendMessage(channelData.name, files.length, uploadFiles, onMessageSendCompleted, selectedMessage)

    const PreviousMessagePreview = ({ selectedMessage }: { selectedMessage: any }) => {

        if (selectedMessage) {
            return <ReplyMessageBox
                justify='between'
                align='center'
                className="m-2"
                message={selectedMessage}>
                <IconButton
                    color='gray'
                    size='1'
                    variant="soft"
                    onClick={clearSelectedMessage}>
                    <BiX size='20' />
                </IconButton>
            </ReplyMessageBox>
        }
        return null
    }

    const { canUserSendMessage, shouldShowJoinBox } = useMemo(() => {

        let canUserSendMessage = false
        let shouldShowJoinBox = false

        const isDM = channelData?.is_direct_message === 1 || channelData?.is_self_message === 1


        if (channelData.type === 'Open' || channelMemberProfile && channelData.is_archived === 0) {
            canUserSendMessage = true
        }

        if (channelData.is_archived === 0 && !channelMemberProfile && channelData.type !== 'Open' && !isDM) {
            shouldShowJoinBox = true
        }

        return { canUserSendMessage, shouldShowJoinBox }

    }, [channelMemberProfile, channelData])




    const { threadID } = useParams()

    return (
        <ChatBoxBodyContainer>
            <FileDrop
                files={files}
                ref={fileInputRef}
                onFileChange={setFiles}
                width={threadID ? 'w-[calc((100vw-var(--sidebar-width)-var(--space-8))/2)]' : undefined}
                maxFiles={10}
                maxFileSize={10000000}>
                <ChatStream
                    channelID={channelData.name}
                    replyToMessage={handleReplyAction}
                />
                {canUserSendMessage &&
                    <Stack>
                        <TypingIndicator channel={channelData.name} />
                        <Tiptap
                            key={channelData.name}
                            channelID={channelData.name}
                            fileProps={{
                                fileInputRef,
                                addFile
                            }}
                            clearReplyMessage={clearSelectedMessage}
                            channelMembers={channelMembers}
                            onUserType={onUserType}
                            // placeholder={randomPlaceholder}
                            replyMessage={selectedMessage}
                            sessionStorageKey={`tiptap-${channelData.name}`}
                            onMessageSend={sendMessage}
                            messageSending={loading}
                            slotBefore={<Flex direction='column' justify='center' hidden={!selectedMessage && !files.length}>
                                {selectedMessage && <PreviousMessagePreview selectedMessage={selectedMessage} />}
                                {files && files.length > 0 && <Flex gap='2' width='100%' align='end' px='2' p='2' wrap='wrap'>
                                    {files.map((f: CustomFile) => <Box className="grow-0" key={f.fileID}><FileListItem file={f} uploadProgress={fileUploadProgress} removeFile={() => removeFile(f.fileID)} /></Box>)}
                                </Flex>}
                            </Flex>}
                        />
                    </Stack>
                }
                {shouldShowJoinBox ?
                    <JoinChannelBox
                        channelData={channelData}
                        user={user} /> : null}
                <ArchivedChannelBox
                    channelID={channelData.name}
                    isArchived={channelData.is_archived}
                    isMemberAdmin={channelMemberProfile?.is_admin}
                />
            </FileDrop>
        </ChatBoxBodyContainer>
    )

}

// Separate container to prevent re-rendering when the threadID changes

const ChatBoxBodyContainer = ({ children }: { children: React.ReactNode }) => {

    const { threadID } = useParams()

    return <div className={clsx("flex flex-col w-full overflow-hidden px-2 pt-16 justify-end h-full", threadID ? "sm:pl-4" : "sm:px-4")}>
        {children}
    </div>
}