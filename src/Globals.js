import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";


export var Globals = {
    // push notification type
    pushNotification: {
        chat: 1,
        review: 2,
        reply: 3
    },

    // button press short, long timeout
    buttonTimeoutShort: 100,
    buttonTimeoutLong: 300,

    submitButtonPaddingTop: () => {
        const height = Dimensions.get('window').height;
        const param = parseInt(height / 100);

        switch (param) {
            case 5: return 3;
            case 6: return 4; // Galaxy S7: 640
            case 7: return 5; // Tango: 731
            case 8: return 6; // iphone X: 812
            case 9: return 7;
        }

        if (param < 5) return 3;
        if (param > 9) return 7;
    },

    // alert dialog
    alertHeight: Dimensions.get('window').height * 0.25,
    alertButtonMarginLeft: Dimensions.get('window').width * 0.1,

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    // search bar text padding
    // iPhone X: 4, Tango: ?, S7: 8
    searchBarPaddingTop: () => {
        const height = Dimensions.get('window').height;
        const param = parseInt(height / 100);

        switch (param) {
            case 5: return 10;
            case 6: return 8; // Galaxy S7: 640
            case 7: return 6; // Tango: 731
            case 8: return 4; // iphone X: 812
            case 9: return 2;
        }

        if (param < 5) return 10;
        if (param > 9) return 2;
    },

    // posting date text padding top
    lastLogInDatePaddingTop: () => {
        const height = Dimensions.get('window').height;
        const param = parseInt(height / 100);

        switch (param) {
            case 5: return 1;
            case 6: return 1; // Galaxy S7: 640
            case 7: return 1; // Tango: 731
            case 8: return 2; // iphone X: 812
            case 9: return 2;
        }

        if (param < 5) return 1;
        if (param > 9) return 2;
    },




};
