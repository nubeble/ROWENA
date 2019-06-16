import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";

export var Vars = {
    currentScreenName: null, // string

    location: null, // Location

    signUpType: null, // 'FACEBOOK', 'EMAIL', 'MOBILE'
    signUpName: null
};

export const Cons = {
    buildNumber: '0.0.24',
    lastUpdatedDate: 'Jun 16, 2019 23:36',

    // push notification type
    pushNotification: {
        chat: 1,
        review: 2,
        reply: 3,
        comment: 4
    },

    // red dot badge
    redDotWidth: Math.round(Dimensions.get('window').height / 100) + 1,

    // button press short, long timeout
    buttonTimeoutShort: 100,
    buttonTimeoutLong: 300,

    // S9 (692): 40
    // buttonHeight: Dimensions.get('window').height / 17,
    // buttonHeight: 40,
    buttonHeight: Dimensions.get('window').height / 100 * 2 + 28,

    // bottomTabBarHeight: Platform.isPad ? 49 : 29, // const DEFAULT_HEIGHT = 49; const COMPACT_HEIGHT = 29;

    // view margin bottom
    // ToDo: iphone x, iphone xr, iphone xs, ...
    // viewMarginBottom: (Platform.OS == 'ios' && Constants.platform.ios.model.toLowerCase() === 'iphone x') ? 8 : 0,
    viewMarginBottom: () => {
        if (Platform.OS === 'android') return 0;

        const model = Constants.platform.ios.model.toLowerCase();

        if (model === 'iphone x') return 10;
        if (model === 'iphone xs') return 10;
        if (model === 'iphone xs max') return 10;
        if (model === 'iphone xr') return 10;

        return 0;
    },

    mapPostBottom: () => {
        if (Platform.OS === 'android') return -12;

        const model = Constants.platform.ios.model.toLowerCase();

        if (model === 'iphone x') return -4;
        if (model === 'iphone xs') return -4;
        if (model === 'iphone xs max') return -4;
        if (model === 'iphone xr') return -4;

        return -12;
    },

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8
};
