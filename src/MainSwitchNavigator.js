import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import AuthStackNavigator from './AuthStackNavigator';
import MainBottomTabNavigator from './MainBottomTabNavigator';


export default createSwitchNavigator(
    {
        // guide

        authStackNavigator: AuthStackNavigator, // stack navigator

        // welcome

        mainBottomTabNavigator: MainBottomTabNavigator // tab navigator
    },
    {
        initialRouteName: 'authStackNavigator'
    }
);
