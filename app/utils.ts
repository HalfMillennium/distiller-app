interface Track {
    id: any;
    color: any;
    src: string;
    name:
        | string
        | number
        | bigint
        | boolean
        | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
        | Iterable<React.ReactNode>
        | React.ReactPortal
        | Promise<
                | string
                | number
                | bigint
                | boolean
                | React.ReactPortal
                | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
                | Iterable<React.ReactNode>
                | null
                | undefined
            >
        | null
        | undefined;
}

export const exampleTracks: Track[] = [
    {
        id: 1,
        color: '#FF6F61', // soft red
        src: 'track1.mp3',
        name: 'Track 1'
    },
    {
        id: 2,
        color: '#6B8E2380', // soft green
        src: 'track2.mp3',
        name: 'Track 2'
    },
    {
        id: 3,
        color: '#3CB37170', // soft turquoise
        src: 'track3.mp3',
        name: 'Track 3'
    },
    {
        id: 4,
        color: '#FFD70070', // light dijon
        src: 'track4.mp3',
        name: 'Track 4'
    },
    {
        id: 5,
        color: '#9370DB80', // lavendar
        src: 'track5.mp3',
        name: 'Track 5'
    }
];

export const COLORS = {
    softRed: '#FF6F61',
    softGreen: '#6B8E23',
    softTurquoise: '#3CB371',
    lightDijon: '#FFD700',
    lavender: '#9370DB'
}