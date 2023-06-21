import io from 'socket.io-client';
import { apiSlice } from '../api/apiSlice';
import { messagesApi } from '../messages/messagesApi';

export const conversationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getConversations: builder.query({
            query: (email) =>
                `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_CONVERSATIONS_PER_PAGE}`,
            transformResponse(apiResponse, meta) {
                return {
                    data: apiResponse,
                    totalCount: Number(meta.response.headers.get('X-Total-Count')),
                };
            },
            async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
                // create socket
                const socket = io(process.env.REACT_APP_API_URL, {
                    reconnectionDelay: 1000,
                    reconnection: true,
                    reconnectionAttemps: 10,
                    transports: ['websocket'],
                    agent: false,
                    upgrade: false,
                    rejectUnauthorized: false,
                });

                try {
                    await cacheDataLoaded;
                    socket.on('editConversation', async (data) => {
                        await updateCachedData((draft) => {
                            const conversation = draft.data.find(
                                (c) => Number(c.id) === data?.data?.id
                            );
                            if (conversation?.id) {
                                conversation.message = data?.data?.message;
                                conversation.timestamp = data?.data?.timestamp;
                            } else {
                                // console.log(draft);
                            }
                        });
                    });
                    socket.on('addConversation', async (data) => {
                        await updateCachedData((draft) => {
                            if (data?.data.participants.includes(arg)) {
                                draft?.data?.unshift(data?.data);
                            }
                        });
                    });
                } catch (err) {}

                await cacheEntryRemoved;
                socket.close();
            },
        }),
        getMoreConversations: builder.query({
            query: ({ email, page }) =>
                `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_CONVERSATIONS_PER_PAGE}`,

            async onQueryStarted({ email }, { dispatch, queryFulfilled }) {
                try {
                    const conversations = await queryFulfilled;
                    if (conversations?.data?.length > 0) {
                        dispatch(
                            apiSlice.util.updateQueryData('getConversations', email, (draft) => {
                                return {
                                    data: [...draft.data, ...conversations.data],
                                    totalCount: Number(draft.totalCount),
                                };
                            })
                        );
                    }
                } catch (error) {}
            },
            // async onQueryStarted({ email }, { dispatch, queryFulfilled }) {
            //     try {
            //         const conversations = await queryFulfilled;
            //         if (conversations?.data?.length > 0) {
            //             dispatch(
            //                 apiSlice.util.updateQueryData('getConversations', email, (draft) => {
            //                     return {
            //                         data: [...draft.data, ...conversations.data],
            //                         totalCount: Number(draft.totalCount),
            //                     };
            //                 })
            //             );
            //         }
            //     } catch (error) {}
            // },
        }),
        getConversation: builder.query({
            query: ({ logedInUserEmail, participantEmail }) =>
                `/conversations?participants_like=${logedInUserEmail}-${participantEmail}&participants_like=${participantEmail}-${logedInUserEmail}`,
        }),
        addConversation: builder.mutation({
            query: ({ sender, receiver, data }) => ({
                url: '/conversations',
                method: 'POST',
                body: data,
            }),

            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                const conversation = await queryFulfilled;
                if (conversation?.data?.id) {
                    const { sender, receiver, data } = arg;
                    // silent entry to message table
                    dispatch(
                        messagesApi.endpoints.addMessage.initiate({
                            conversationId: conversation.data.id,
                            sender,
                            receiver,
                            message: data.message,
                            timestamp: data.timestamp,
                        })
                    );
                }
            },
        }),
        editConversation: builder.mutation({
            query: ({ id, data, sender, receiver }) => ({
                url: `/conversations/${id}`,
                method: 'PATCH',
                body: data,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const conversation = await queryFulfilled;
                    if (conversation?.data?.id) {
                        const { sender, receiver, data } = arg;
                        // silent entry to message table
                        await dispatch(
                            messagesApi.endpoints.addMessage.initiate({
                                conversationId: conversation.data.id,
                                sender,
                                receiver,
                                message: data.message,
                                timestamp: data.timestamp,
                            })
                        );
                    }
                } catch (error) {}
            },
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useGetConversationQuery,
    useAddConversationMutation,
    useEditConversationMutation,
} = conversationsApi;
