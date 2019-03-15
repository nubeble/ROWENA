import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";

export var Vars = {
    postToggleButtonPressed: false,
    toggleButtonPressedPost: null,

    userFeedsChanged: false, // added or removed, not updated

    currentScreenName: null, // string


};

export var Cons = {
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
        if (Platform.OS === 'ios') return 0;

        return 5;

        /*
        const height = Dimensions.get('window').height;
        const param = parseInt(height / 100);

        switch (param) {
            case 5: return 3;
            case 6: return 4; // Galaxy S7: 640, S9: 692
            case 7: return 5; // Tango: 731
            case 8: return 6;
            case 9: return 7;
        }

        if (param < 5) return 3;
        if (param > 9) return 7;
        */
    },

    // alert dialog
    alertWidth: parseInt((Dimensions.get('window').width) * 0.9),
    alertHeight: parseInt((Dimensions.get('window').height) / 24 * 7),
    alertButtonWidth: parseInt(Dimensions.get('window').width * 0.32),
    alertButtonHeight: parseInt((Dimensions.get('window').width * 0.32) / 5 * 2),
    alertButtonMarginBetween: parseInt(Dimensions.get('window').width * 0.03),
    alertButtonPaddingTop: parseInt(Dimensions.get('window').height / 80),

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

    // feed item info text padding top
    ratingTextPaddingTop: () => {
        if (Platform.OS === 'ios') return 1;
        if (Platform.OS === 'android') return 8;
    },

    // body info text padding top
    bodyInfoTitlePaddingTop: () => {
        /*
        const height = Dimensions.get('window').height;
        const param = parseInt(height / 100);

        switch (param) {
            case 5: return 7;
            case 6: return 8; // Galaxy S7: 640
            case 7: return 9; // Tango: 731
            case 8: return 10; // iphone X: 812
            case 9: return 11;
        }

        if (param < 5) return 7;
        if (param > 9) return 11;
        */

        if (Platform.OS === 'ios') return 3;
        if (Platform.OS === 'android') return 7;
    },




};
