import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
};

export const calgarySlice = createSlice({
  name: 'calgary',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    removeUserInfo: (state) => {
      state.userInfo = null;
    }
  }
});


export const { setUserInfo, removeUserInfo } = calgarySlice.actions;
export default calgarySlice.reducer;