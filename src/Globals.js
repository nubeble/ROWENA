import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";


export var Globals = {
    // button press timeout
    buttonTimeout: 300,

    // alert dialog
    alertHeight: Dimensions.get('window').height * 0.25,
    alertButtonMarginLeft: Dimensions.get('window').width * 0.1,

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    // send button
    // sendButtonMarginBottom: Platform.OS === "ios" ? 12 : 14
    sendButtonMarginBottom: 14,

    // search bar text padding
    // iPhone X: 4, Tango: ?, S7: 8
    searchBarPaddingTop:() => {
        const height = Dimensions.get('window').height;

        const param = height / 100;

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
    

    

};
