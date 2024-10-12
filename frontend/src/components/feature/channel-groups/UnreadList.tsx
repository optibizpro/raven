import { SidebarGroup, SidebarGroupItem, SidebarGroupLabel, SidebarGroupList } from "../../layout/Sidebar";
import { ChannelItemElement } from '@/components/feature/channels/ChannelList';
import { DirectMessageItemElement } from '../../feature/direct-messages/DirectMessageList';
import { __ } from '@/utils/translations';
import { useStickyState } from "@/hooks/useStickyState";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { SidebarBadge, SidebarViewMoreButton } from "@/components/layout/Sidebar/SidebarComp";
import { Box, Flex } from "@radix-ui/themes";
import { ChannelWithUnreadCount, DMChannelWithUnreadCount } from "@/components/layout/Sidebar/useGetChannelUnreadCounts";
import clsx from "clsx";

interface UnreadListProps {
    unreadChannels: ChannelWithUnreadCount[]
    unreadDMs: DMChannelWithUnreadCount[]
}

export const UnreadList = ({ unreadChannels, unreadDMs }: UnreadListProps) => {

    const [showData, setShowData] = useStickyState(true, 'expandDirectMessageList')

    const toggle = () => setShowData(d => !d)

    const ref = useRef<HTMLDivElement>(null)

    const [height, setHeight] = useState(ref?.current?.clientHeight ?? showData ? (unreadDMs.length + unreadChannels.length) * (36) - 4 : 0)

    useLayoutEffect(() => {
        setHeight(ref.current?.clientHeight ?? 0)
    }, [unreadDMs, unreadChannels])

    const totalUnreadCount = useMemo(() => {
        let totalUnreadCount = 0

        // Count unread messages from channels
        for (const channel of unreadChannels) {
            if (channel.is_archived == 0) {
                totalUnreadCount += channel.unread_count || 0
            }
        }

        // Count unread messages from DMs
        for (const dm of unreadDMs) {
            totalUnreadCount += dm.unread_count || 0
        }

        return totalUnreadCount
    }, [unreadChannels, unreadDMs])

    return (
        <SidebarGroup>
            <SidebarGroupItem className={'gap-1 pl-1'}>
                <Flex width='100%' justify='between' align='center' gap='2' pr='2' className="group">
                    <Flex align='center' gap='2' width='100%' onClick={toggle} className="cursor-default select-none">
                        <SidebarGroupLabel>{__("Unread")}</SidebarGroupLabel>
                        <Box className={clsx('transition-opacity ease-in-out duration-200',
                            !showData && totalUnreadCount > 0 ? 'opacity-100' : 'opacity-0')}>
                            <SidebarBadge>
                                {totalUnreadCount}
                            </SidebarBadge>
                        </Box>
                    </Flex>
                    <Flex align='center' gap='1'>
                        <SidebarViewMoreButton onClick={toggle} expanded={showData} />
                    </Flex>
                </Flex>
            </SidebarGroupItem>
            <SidebarGroupList
                style={{
                    height: showData ? height : 0
                }}>
                <div ref={ref} className="flex gap-1 flex-col fade-in">
                    {/* Render unread DMs */}
                    {unreadDMs.map(dm => (
                        <DirectMessageItemElement
                            key={dm.name}
                            channel={dm}
                        />
                    ))}
                    {/* Render unread channels */}
                    {unreadChannels.map(channel => (
                        <ChannelItemElement
                            key={channel.name}
                            channel={channel}
                        />
                    ))}
                </div>
            </SidebarGroupList>
        </SidebarGroup>
    )
}