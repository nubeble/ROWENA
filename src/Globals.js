import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";

export var Vars = {
    currentScreenName: null, // string



};

export const Cons = {
    // push notification type
    pushNotification: {
        chat: 1,
        review: 2,
        reply: 3,
        comment: 4
    },

    // button press short, long timeout
    buttonTimeoutShort: 100,
    buttonTimeoutLong: 300,

    // S9 (692): 40
    buttonHeight: Dimensions.get('window').height / 17,

    // bottomTabBarHeight: Platform.isPad ? 49 : 29, // const DEFAULT_HEIGHT = 49; const COMPACT_HEIGHT = 29;

    // view margin bottom
    // ToDo: iphone x, iphone xr, iphone xs, ...
    // viewMarginBottom: (Platform.OS == 'ios' && Constants.platform.ios.model.toLowerCase() === 'iphone x') ? 8 : 0,
    viewMarginBottom: () => {
        if (Platform.OS === 'android') return 0;

        const model = Constants.platform.ios.model.toLowerCase();

        if (model === 'iphone x') return 8;
        if (model === 'iphone xs') return 8;
        if (model === 'iphone xs max') return 8;
        if (model === 'iphone xr') return 8;

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

    // alert dialog
    alertWidth: ((Dimensions.get('window').width) * 0.9),
    alertHeight: ((Dimensions.get('window').height) / 24 * 7),
    alertButtonWidth: (Dimensions.get('window').width * 0.32),
    alertButtonHeight: ((Dimensions.get('window').width * 0.32) / 5 * 2),
    alertButtonMarginBetween: (Dimensions.get('window').width * 0.03),
    alertButtonPaddingTop: (Dimensions.get('window').height / 80),

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,



};
