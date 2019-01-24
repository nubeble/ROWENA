import {
    Dimensions, Platform
} from 'react-native';
import { Constants } from "expo";

/*
export default {
    // button timeout
    buttonTimeout: 300,
    
    // alert dialog
    alertHeight: Dimensions.get('window').height * 0.25,
    buttonMarginLeft: Dimensions.get('window').width * 0.1,

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    

}*/

export var Globals = {
    // button press timeout
    buttonTimeout: 300,

    // alert dialog
    alertHeight: Dimensions.get('window').height * 0.25,
    buttonMarginLeft: Dimensions.get('window').width * 0.1,

    // search bar height
    searchBarHeight: Constants.statusBarHeight + 8 + 34 + 8,

    // send button
    // sendButtonMarginBottom: Platform.OS === "ios" ? 12 : 14
    sendButtonMarginBottom: 14

};
