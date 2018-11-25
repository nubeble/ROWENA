// tab navigator

import React from 'react';
import { createBottomTabNavigator } from 'react-navigation';
import { AntDesign, Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

import Chats from './Chats';
import Likes from './Likes';
import Profile from './Profile';


import HomeStackNavigator from './HomeStackNavigator';
import Test from './Test';
import SignIn from './SignIn';
import SignUp from './SignUp';


export default createBottomTabNavigator(
    {
        home: HomeStackNavigator,
        // likes: SignIn,
        likes: Likes,
        chats: Chats,
        // chats: Test,
        profile: Profile
    },
    {
        navigationOptions: ({ navigation }) => ({
            // title: `${navigation.state.params.name}'s Profile!`,
            title: 'Title',
            tabBarLabel: navigation.state.routeName,

            tabBarIcon: ({ tintColor, focused }) => {

                // console.log('navigation: ', navigation);

                // let iconName;

                if (navigation.state.routeName === 'home') {

                    return <Ionicons
                        // name={focused ? 'compass' : 'compass-outline'}
                        name={'md-compass'}
                        size={30}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'likes') {

                    return <Ionicons
                        // name={focused ? 'ios-heart' : 'ios-heart-empty'}
                        name={'ios-heart'}
                        size={30}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'chats') {

                    return <Ionicons
                        // name={focused ? 'ios-chatbubbles' : 'ios-chatbubbles-outline'}
                        name={'ios-chatbubbles'}
                        size={30}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'profile') {

                    return <FontAwesome
                        name={'user'}
                        size={30}
                        style={{ color: tintColor }}
                    />;
                }

            },
        }),

        tabBarOptions: { // ToDo: style (bar), labelStyle (label), tabStyle (tab)
            style: {
                backgroundColor: 'rgb(26, 26, 26)',
                paddingTop: 10,
                // height: 50
            },
            animationEnabled: true,
            showLabel: false,
            showIcon: true,
            // tintColor: 'red',
            // activeTintColor: 'rgb(234, 68, 90)',
            activeTintColor: 'rgb(234, 150, 24)',
            inactiveTintColor: 'rgb(162, 162, 162)',
            tabStyle: {
                // paddingVertical: 10
            }
        },
    }
);
