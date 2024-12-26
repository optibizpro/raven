import clsx from 'clsx'
import React from 'react'
import { Message } from '@raven/types/common/Message'
import { Text, Pressable } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import QuickReactions from './QuickActions/QuickReactions'
import ReplyIcon from "@assets/icons/ReplyIcon.svg"
import ForwardIcon from "@assets/icons/ForwardIcon.svg"
import CopyIcon from "@assets/icons/CopyIcon.svg"
import BookMarkMinusIcon from "@assets/icons/BookMarkMinusIcon.svg"
import BookMarkPlusIcon from "@assets/icons/BookMarkPlusIcon.svg"
import PaperClipIcon from "@assets/icons/PaperClipIcon.svg"
import TrashIcon from "@assets/icons/TrashIcon.svg"
import DownloadIcon from "@assets/icons/DownloadIcon.svg"
import ArrowBackRetractIcon from "@assets/icons/ArrowBackRetractIcon.svg"
import MessageIcon from "@assets/icons/MessageIcon.svg"
import { ActivityIndicator } from '@components/nativewindui/ActivityIndicator'
import { useMessageCopy } from './useMessageCopy'
import { useMessageSave } from './useMessageSave'
import useCreateThread from './useCreateThread'
import useCurrentRavenUser from '@raven/lib/hooks/useCurrentRavenUser'
import useRetractVote from './useRetractVote'
import useMessageDelete from './useMessageDelete'
import { router } from 'expo-router'
import { useColorScheme } from '@hooks/useColorScheme'
import { Divider } from '@components/common/DIvider'

interface MessageActionsProps {
    message: Message
    onClose: () => void
}

const MessageActions = ({ message, onClose }: MessageActionsProps) => {

    const { colors } = useColorScheme()

    const { myProfile } = useCurrentRavenUser()

    const copy = useMessageCopy(message)
    const { createThread, isLoading: isCreatingThread } = useCreateThread(message)
    const { save, isLoading: isSaving, isSaved } = useMessageSave(message, myProfile?.name)
    const { retractVote, isLoading: isVoteRetracting, poll_data } = useRetractVote(message)
    const { deleteMessage, loading: isDeleting } = useMessageDelete(message)

    const isOwner = myProfile?.name === message?.owner && !message?.is_bot_message

    const forwardMessage = () => {
        router.push({
            pathname: "../../forward-message",
            params: { ...message }
        }, { relativeToDirectory: true })
        onClose()
    }

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            className='px-3'
        >
            <QuickReactions message={message} onClose={onClose} />

            <Divider className='mx-0 mt-4 mb-1' />

            {message?.message_type === 'Poll' && poll_data?.message.current_user_votes.length ?
                <MessageAction icon={<ArrowBackRetractIcon fill={colors.icon} />} title='Retract Vote' loading={isVoteRetracting} loadingText='Retracting vote...' onAction={() => retractVote(onClose)} /> : null}

            {/* <MessageAction title='Reply' icon={<ReplyIcon />} onAction={() => { }} /> */}
            <MessageAction title='Forward' icon={<ForwardIcon color={colors.icon} />} onAction={forwardMessage} />
            {!message?.is_thread ? <MessageAction title='Create Thread' icon={<MessageIcon fill={colors.icon} />} loading={isCreatingThread} loadingText="Creating thread..." onAction={() => createThread(onClose)} /> : null}

            <Divider className='mx-0 my-1.5' />

            {/* <MessageAction title='Copy Link' icon={<PaperClipIcon />} onAction={() => { }} /> */}
            {message?.message_type === "Text" ? <MessageAction title='Copy' icon={<CopyIcon fill={colors.icon} />} onAction={() => copy(onClose)} /> : null}
            {/* <MessageAction title='Download' icon={<DownloadIcon />} onAction={() => { }} /> */}
            <MessageAction title={isSaved ? 'Unsave Message' : 'Save Message'} icon={isSaved ? <BookMarkMinusIcon fill={colors.icon} /> : <BookMarkPlusIcon fill={colors.icon} />} loading={isSaving} loadingText={isSaved ? 'Unsaving...' : 'Saving...'} onAction={() => save(onClose)} />

            <Divider className='mx-0 my-1.5' />

            {isOwner ? <MessageAction title='Delete' icon={<TrashIcon fill="red" />} loading={isDeleting} loadingText='Deleting message...' onAction={() => deleteMessage(onClose)} danger /> : null}

        </ScrollView>
    )
}

export default MessageActions

interface MessageActionProps {
    onAction: () => void,
    title: string
    icon: React.ReactNode
    loading?: boolean
    loadingText?: string
    danger?: boolean
    className?: string
}
const MessageAction = ({ onAction, icon, title, loading, loadingText, danger, className }: MessageActionProps) => {

    return (
        <Pressable
            onPress={onAction}
            className={clsx('flex flex-row items-center gap-4 p-2 rounded-lg ios:active:bg-linkColor mb-1', className)}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
            disabled={loading}
        >
            <Text className='dark:text-white'>
                {loading ? <ActivityIndicator className='text-gray-800 dark:text-white' /> : icon}
            </Text>
            <Text className={clsx('dark:text-gray-300', loading ? 'opacity-70' : '')}>{loading ? loadingText ?? "Loading..." : <Text className={danger ? 'text-red-500' : ''}>{title}</Text>}</Text>
        </Pressable>
    )
}