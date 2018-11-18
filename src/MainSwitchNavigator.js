import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Loading from './Loading';
import AuthStackNavigator from './AuthStackNavigator';
import MainBottomTabNavigator from './MainBottomTabNavigator';
import Welcome from './Welcome'


export default createSwitchNavigator(
    {
        loading: { screen: Loading },

        welcome: { screen: Welcome },

        authStackNavigator: { screen: AuthStackNavigator }, // stack navigator

        // welcome & guile

        mainBottomTabNavigator: { screen: MainBottomTabNavigator } // tab navigator
    },
    {
        initialRouteName: 'loading'
    }
);
