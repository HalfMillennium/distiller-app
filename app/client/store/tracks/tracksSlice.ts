import { Track } from "@/app/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const tracksSlice = createSlice({
    name: 'tracks',
    initialState: {
        tracks: [] as Track[],
        currentTrackId: undefined as number | undefined
    },
    reducers: {
        setTracks: (state, action: PayloadAction<{tracks: Track[]}>) => {
            state.tracks = action.payload.tracks;
        },
        addTracks: (state, action: PayloadAction<{tracks: Track[]}>) => {
            state.tracks = [...state.tracks, ...action.payload.tracks];
        },
        setCurrentTrackId: (state, action: PayloadAction<{id: number}>) => {
            state.currentTrackId = state.tracks.find((track) => action.payload.id === track.id)?.id;
        }
    }
})

export const tracksReducer = tracksSlice.reducer;
export const { addTracks, setTracks, setCurrentTrackId } = tracksSlice.actions;