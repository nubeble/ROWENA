import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Authentication from './Authentication';
import Main from './Main';


export default createSwitchNavigator(
    {
        // guide

        authentication: Authentication,

        // welcome

        main: Main // tab navigator
    },
    {
        initialRouteName: 'authentication'
    }
);
