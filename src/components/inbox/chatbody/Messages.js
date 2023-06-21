import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDispatch, useSelector } from 'react-redux';
import { messagesApi } from '../../../features/messages/messagesApi';
import Message from './Message';

export default function Messages({ messages = [], totalMessage }) {
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth) || {};
    const { email } = user || {};
    const conversationId = messages[0]?.conversationId;
    const fetchMore = () => {
        setPage((prevPage) => prevPage + 1);
    };
    useEffect(() => {
        if (page > 1) {
            dispatch(
                messagesApi.endpoints.getMoreMessages.initiate({
                    conversationId,
                    page,
                })
            );
        }
    }, [conversationId, page, dispatch]);
    useEffect(() => {
        if (totalMessage > 0) {
            const more =
                Math.ceil(totalMessage / Number(process.env.REACT_APP_MESSAGES_PER_PAGE)) > page;
            setHasMore(more);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, totalMessage]);
    return (
        <div
            className='relative w-full h-[calc(100vh_-_200px)]  overflow-y-auto flex flex-col-reverse'
            id='scrollableDiv'
        >
            <InfiniteScroll
                dataLength={messages.length}
                next={fetchMore}
                hasMore={hasMore}
                loader={<h4>Loading...</h4>}
                style={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    padding: '20px',
                }}
                inverse //
                scrollableTarget='scrollableDiv'
            >
                <ul className='space-y-2'>
                    {messages
                        .slice()
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map((message) => {
                            const { message: lastMessage, id, sender } = message || {};

                            const justify = sender.email !== email ? 'start' : 'end';

                            return <Message key={id} justify={justify} message={lastMessage} />;
                        })}
                </ul>
            </InfiniteScroll>
        </div>
    );
}
