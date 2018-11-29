import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Intro from './Intro';
// import HomeStackNavigator from './HomeStackNavigator';
import HomeStackNavigatorWrapper from './HomeStackNavigatorWrapper';


export default createSwitchNavigator(
    {
        intro: { screen: Intro },

        // homeStackNavigator: { screen: HomeStackNavigator }
        homeStackNavigator: { screen: HomeStackNavigatorWrapper }
    },
    {
        initialRouteName: 'intro'
    }
);
