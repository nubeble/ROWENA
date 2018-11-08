import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Auth from './Auth';
import Main from './Main';


export default createSwitchNavigator(
    {
        // guide

        auth: Auth, // stack navigator

        // welcome

        main: Main // tab navigator
    },
    {
        initialRouteName: 'auth'
    }
);
