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
    // iPhone X: 4
    // Tango: ?
    // S7: 6
    searchBarPaddingTop: 12 - parseInt(Dimensions.get('window').height / 100) // Galaxy S7: 640, Tango: 731, iphone X: 812

    

};
