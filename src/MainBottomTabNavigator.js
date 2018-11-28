// tab navigator

import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from 'react-navigation';
import { AntDesign, Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

import Chats from './Chats';
import Likes from './Likes';
import Profile from './Profile';


// import HomeStackNavigator from './HomeStackNavigator';
import HomeSwitchNavigator from './HomeSwitchNavigator';

import Test from './Test';
import SignIn from './SignIn';
import SignUp from './SignUp';


export default createBottomTabNavigator(
    {
        // home: HomeStackNavigator,
        home: HomeSwitchNavigator,
        likes: Likes,
        chats: Chats,
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
                backgroundColor: 'rgb(40, 40, 40)',
                borderTopWidth: 1,
                borderTopColor:'rgb(61, 61, 61)',
                // paddingTop: parseInt(Dimensions.get('window').height / 80)
                // paddingTop: Dimensions.get('window').height > 640 ? 10 : 2
                paddingTop: Platform.OS === "ios" ? 10 : 0
            },
            animationEnabled: true,
            showLabel: false,
            showIcon: true,
            // tintColor: 'red',
            // activeTintColor: 'rgb(234, 68, 90)',
            activeTintColor: 'rgb(255, 255, 255)',
            inactiveTintColor: 'rgb(144, 144, 144)',
            tabStyle: {
                // paddingVertical: 10
            }
        },
    }
);
