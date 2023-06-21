import io from 'socket.io-client';
import { apiSlice } from '../api/apiSlice';

export const messagesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMessages: builder.query({
            query: (conversationId) =>
                `/messages?conversationId=${conversationId}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
            transformResponse: (apiResponse, meta) => {
                return {
                    data: apiResponse,
                    totalMessage: Number(meta.response.headers.get('X-Total-Count')),
                };
            },
            async onCacheEntryAdded(arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) {
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
                    socket.on('message', async (data) => {
                        if (Number(data?.data.conversationId) === Number(arg)) {
                            await updateCachedData((draft) => {
                                draft?.data.unshift(data.data);
                            });
                        } else {
                            console.log(data.data);
                            console.log(arg);
                        }
                    });
                } catch (error) {
                    console.log(error);
                }
                // await cacheEntryRemoved;
                // socket.close();
            },
        }),
        getMoreMessages: builder.query({
            query: ({ conversationId, page }) =>
                `/messages?conversationId=${conversationId}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
            async onQueryStarted({ conversationId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    await dispatch(
                        apiSlice.util.updateQueryData(
                            'getMessages',
                            conversationId.toString(),
                            (draft) => {
                                return {
                                    data: [...draft.data, ...data],
                                    totalMessage: Number(draft.totalMessage),
                                };
                            }
                        )
                    );
                } catch (error) {
                    console.log(error);
                }
            },
        }),
        addMessage: builder.query({
            query: (data) => ({
                url: '/messages',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const { useGetMessagesQuery, useAddMessageQuery } = messagesApi;
