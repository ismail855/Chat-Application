import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    accessToken: undefined,
    user: undefined,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        userLoggedIn: (state, action) => {
            const { accessToken, user } = action.payload || {};
            state.accessToken = accessToken;
            state.user = user;
        },
        userLoggedOut: (state) => {
            state.accessToken = undefined;
            state.user = undefined;
        },
    },
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;
