import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";

export var Vars = {
    // postLikeButtonPressed: false,

    // like button pressed, review updated, ...
    // updatedPostsForIntro: [], // array
    // updatedPostsForLikes: [], // array

    // userFeedsChanged: false, // added or removed, not updated



    currentScreenName: null, // string

    //// add here ////

};

export const Cons = {
    // push notification type
    pushNotification: {
        chat: 1,
        review: 2,
        reply: 3
    },

    // button press short, long timeout
    buttonTimeoutShort: 100,
    buttonTimeoutLong: 300,

    // S9 (692): 40
    buttonHeight: Dimensions.get('window').height / 17,

    // bottomTabBarHeight: Platform.isPad ? 49 : 29, // const DEFAULT_HEIGHT = 49; const COMPACT_HEIGHT = 29;

    // view margin bottom
    // ToDo: iphone x, iphone xr, iphone xs, ...
    viewMarginBottom: (Platform.OS == 'ios' && Constants.platform.ios.model.toLowerCase() === 'iphone x') ? 8 : 0,

    // NOT USED
    submitButtonPaddingTop: () => {
        if (Platform.OS === 'ios') return 0;

        return 5;

        /*
        const height = Dimensions.get('window').height;
        const param = (height / 100);

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
    alertWidth: ((Dimensions.get('window').width) * 0.9),
    alertHeight: ((Dimensions.get('window').height) / 24 * 7),
    alertButtonWidth: (Dimensions.get('window').width * 0.32),
    alertButtonHeight: ((Dimensions.get('window').width * 0.32) / 5 * 2),
    alertButtonMarginBetween: (Dimensions.get('window').width * 0.03),
    alertButtonPaddingTop: (Dimensions.get('window').height / 80),

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    // NOT USED
    // search bar text padding
    // iPhone X: 4, Tango: 7, S7: 8
    searchBarPaddingTop: () => {
        if (Platform.OS === 'ios') return 4;
        if (Platform.OS === 'android') return 8;

        /*
        const height = Dimensions.get('window').height;
        const param = (height / 100);

        switch (param) {
            case 6: return 8; // Galaxy S7: 640
            case 7: return 7; // Tango: 731
            case 8: return 6;
        }

        if (param < 6) return 8;
        if (param > 8) return 6;
        */
    },

    // NOT USED
    // posting date text padding top
    lastLogInDatePaddingTop: () => {
        if (Platform.OS === 'ios') return 0;
        if (Platform.OS === 'android') return 6;

        /*
        const height = Dimensions.get('window').height;
        const param = (height / 100);

        switch (param) {
            case 5: return 1;
            case 6: return 1; // Galaxy S7: 640
            case 7: return 1; // Tango: 731
            case 8: return 2;
            case 9: return 2;
        }

        if (param < 5) return 1;
        if (param > 9) return 2;
        */
    },

    // NOT USED
    // feed item info text padding top
    ratingTextPaddingTop: () => {
        if (Platform.OS === 'ios') return 1;
        if (Platform.OS === 'android') return 8;
    },

    // NOT USED
    // body info text padding top
    bodyInfoTitlePaddingTop: () => {
        if (Platform.OS === 'ios') return 3;
        if (Platform.OS === 'android') return 7;

        /*
        const height = Dimensions.get('window').height;
        const param = (height / 100);

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
    },

    //// add here ////

};
