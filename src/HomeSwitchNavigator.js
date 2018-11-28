import React from 'react';
import { createSwitchNavigator } from "react-navigation";

import Intro from './Intro';
import HomeStackNavigator from './HomeStackNavigator';


export default createSwitchNavigator(
    {
        intro: { screen: Intro },

        homeStackNavigator: { screen: HomeStackNavigator }
    },
    {
        initialRouteName: 'intro'
    }
);
