import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Loading from './Loading';
import AuthStackNavigator from './AuthStackNavigator';
import MainBottomTabNavigator from './MainBottomTabNavigator';


export default createSwitchNavigator(
    {
        loading: { screen: Loading },

        authStackNavigator: { screen: AuthStackNavigator }, // stack navigator

        // welcome & guile

        mainBottomTabNavigator: { screen: MainBottomTabNavigator } // tab navigator
    },
    {
        initialRouteName: 'loading'
    }
);
