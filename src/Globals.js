import {
    Dimensions, Platform
} from 'react-native';
import Constants from 'expo-constants';

export var Vars = {
    focusedScreen: null, // string

    location: null, // Location

    signUpType: null, // 'FACEBOOK', 'EMAIL', 'MOBILE'
    signUpName: null,

    distanceUnit: null // unit of length - 'meter', 'mile' based on user location (user profile)
};

export const Cons = {
    version: '1.0.0',
    buildNumber: '93088300',
    lastUpdatedDate: 'Aug 09, 2019 08:38',

    // push notification type
    pushNotification: {
        chat: 1,
        review: 2,
        reply: 3,
        comment: 4,
        like: 5
    },

    // red dot badge
    redDotWidth: Math.round(Dimensions.get('window').height / 100) + 1,

    // log-in dot badge
    logInDotWidth: Math.round(Dimensions.get('window').height / 30),

    // button press timeout
    // buttonTimeout: 100,
    buttonTimeout: 10,

    // S9 (692): 40
    // buttonHeight: Dimensions.get('window').height / 17,
    // buttonHeight: 40,
    buttonHeight: Dimensions.get('window').height / 100 * 2 + 28,

    // bottomTabBarHeight: Platform.isPad ? 49 : 29, // const DEFAULT_HEIGHT = 49; const COMPACT_HEIGHT = 29;

    // view margin bottom
    // ToDo: iphone x, iphone xr, iphone xs, ...
    /*
    viewMarginVertical: () => {
        if (Platform.OS === 'android') return 0;

        const model = Constants.platform.ios.model.toLowerCase();

        if (model === 'iphone x') return 12;
        if (model === 'iphone xs') return 12;
        if (model === 'iphone xs max') return 12;
        if (model === 'iphone xr') return 12;

        return 0;
    },
    */

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
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    bottomButtonMarginBottom: 32,

    stickerWidth: 185,
    stickerHeight: 160
};
