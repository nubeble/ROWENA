// @flow
type Typography = {
    fontFamily: string,
    fontSize: number,
    lineHeight: number
};

type Color = string;

type Theme = {
    color: {
        splash: Color,
        background: Color,
        component: Color,
        highlight: Color,
        line: Color,
        title: Color,
        subtitle: Color,
        text1: Color,
        text2: Color,
        text3: Color,
        text4: Color,
        text5: Color,
        textInput: Color,
        selection: Color,
        placeholder: Color,
        skeleton1: Color,
        skeleton2: Color,
        buttonBackground: Color,
        buttonText: Color,
        new: Color,
        chartBarBackground: Color,
        chartBar: Color,
        notification: Color,
        marker: Color
    },
    palette: {
        primary: Color,
        info: Color,
        secondary: Color,
        success: Color,
        danger: Color,
        warning: Color,
        sidebar: Color,
        lightGray: Color,
        borderColor: Color,
        white: Color,
        black: Color
    },
    typography: {
        color: string,
        bold: string,
        semibold: string,
        normal: string,
        light: string,
        header1: Typography,
        header2: Typography,
        header3: Typography,
        large: Typography,
        regular: Typography,
        small: Typography,
        micro: Typography
    },
    spacing: {
        xSmall: number,
        tiny: number,
        small: number,
        base: number,
        large: number,
        xLarge: number
    }
};

const theme: Theme = {
    color: {
        splash: "#CD5E77",
        background: '#282828', // "rgb(40, 40, 40)"
        component: "rgb(61, 61, 61)",
        highlight: "rgb(33, 33, 33)",
        line: "rgb(62, 62, 62)",
        title: "#F0F0F0",
        subtitle: "#C0C0C0",
        text1: "#F3F3F3",
        text2: "#F0F0F0",
        text3: "#C0C0C0",
        text4: "#9A9A9A",
        text5: "#7B7B7B",
        textInput: "rgb(208, 211, 218)",
        selection: "rgb(62, 165, 255)",
        placeholder: "rgb(160, 160, 160)",
        skeleton1: "#505050",
        skeleton2: "#606060",
        // buttonBackground: "rgb(62, 165, 255)",
        buttonBackground: "#CD5E77", // splash
        buttonText: 'white',
        new: "#CD5E77", // splash
        chartBarBackground: "#7B7B7B",
        chartBar: '#f1c40f',
        notification: '#FFBB33',
        marker: 'purple'
    },
    palette: {
        primary: "#00AAFF",
        info: "#00A699",
        secondary: "#f7555c",
        success: "#5cb85c",
        danger: "#d93900",
        warning: "#f0ad4e",
        sidebar: "#484848",
        lightGray: "#BFBFBF",
        borderColor: "#F5F5F5",
        white: "white",
        black: "black"
    },
    typography: {
        color: "#666666",
        bold: "Roboto-Bold",
        semibold: "Roboto-Medium",
        normal: "Roboto-Regular",
        light: "Roboto-Light",
        header1: {
            fontSize: 48,
            lineHeight: 58,
            fontFamily: "Roboto-Black"
        },
        header2: {
            fontSize: 36,
            lineHeight: 43,
            fontFamily: "Roboto-Black"
        },
        header3: {
            fontSize: 24,
            lineHeight: 28,
            fontFamily: "Roboto-Black"
        },
        large: {
            fontSize: 14,
            lineHeight: 21,
            fontFamily: "Roboto-Black"
        },
        regular: {
            fontSize: 14,
            lineHeight: 21,
            fontFamily: "Roboto-Regular"
        },
        small: {
            fontSize: 14,
            lineHeight: 18,
            fontFamily: "Roboto-Light"
        },
        micro: {
            fontSize: 8,
            lineHeight: 8,
            fontFamily: "Roboto-Bold"
        }
    },
    spacing: {
        xSmall: 4,
        tiny: 8,
        small: 16,
        base: 24,
        large: 48,
        xLarge: 64
    }
};

export { theme as Theme };
