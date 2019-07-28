import React from 'react';
import { createBottomTabNavigator } from 'react-navigation';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import Stacks from './Stacks';


import Test from './Test';
import SignIn from './SignIn';
import SignUp from './SignUp';

import Home from './Home';
import Messages from './Messages';
import Likes from './Likes';
import Me from './Me';


export default createBottomTabNavigator(
	/*
	{
		home: {
			screen: Home,
			// screen: Stacks,
			tabBarOptions: { // style (bar), labelStyle (label), tabStyle (tab)
				activeTintColor: 'tomato',
				inactiveTintColor: 'grey'
			},
			navigationOptions: {
				title: 'Title',
				tabBarLabel: 'Tab Bar Label',
				tabBarIcon: ({ tintColor, focused }) => (
					<Ionicons
						name={focused ? 'ios-compass' : 'ios-compass-outline'}
						size={24}
						style={{ color: tintColor }}
					/>
				),
			},
		},

		messages: {
			screen: Messages,
			tabBarOptions: { // style (bar), labelStyle (label), tabStyle (tab)
				activeTintColor: 'tomato',
				inactiveTintColor: 'grey'
			},
			navigationOptions: {
				title: 'Title',
				tabBarLabel: 'Tab Bar Label',
				tabBarIcon: ({ tintColor, focused }) => (
					<Ionicons
						name={focused ? 'ios-chatbubbles' : 'ios-chatbubbles-outline'}
						size={24}
						style={{ color: tintColor }}
					/>
				),
			},
		},

		likes: {
			screen: Likes,
			tabBarOptions: { // style (bar), labelStyle (label), tabStyle (tab)
				activeTintColor: 'tomato',
				inactiveTintColor: 'grey'
			},
			navigationOptions: {
				title: 'Title',
				tabBarLabel: 'Tab Bar Label',
				tabBarIcon: ({ tintColor, focused }) => (
					<Ionicons
						name={focused ? 'md-heart' : 'md-heart-outline'}
						size={24}
						style={{ color: tintColor }}
					/>
				),
			},
		},

		me: {
			screen: Me,
			tabBarOptions: { // style (bar), labelStyle (label), tabStyle (tab)
				activeTintColor: 'tomato',
				inactiveTintColor: 'grey'
			},
			navigationOptions: {
				title: 'Title',
				tabBarLabel: 'Tab Bar Label',
				tabBarIcon: ({ tintColor, focused }) => (
					<MaterialIcons
						name={focused ? 'person' : 'person-outline'}
						size={24}
						style={{ color: tintColor }}
					/>
				),
			},
		}
	}
	*/
    {
        home: Stacks,
        messages: Test,
        likes: SignIn,
        me: SignUp
    },
    {
        navigationOptions: ({ navigation }) => ({
            // title: `${navigation.state.params.name}'s Profile!`,
            title: 'Title',
            tabBarLabel: navigation.state.routeName,

            tabBarIcon: ({ tintColor, focused }) => {

                // console.log('navigation:', navigation);

                // let iconName;

                if (navigation.state.routeName === 'home') {

                    return <Ionicons
                        name={focused ? 'ios-compass' : 'ios-compass-outline'}
                        size={34}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'messages') {

                    return <Ionicons
                        name={focused ? 'ios-chatbubbles' : 'ios-chatbubbles-outline'}
                        size={32}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'likes') {

                    return <Ionicons
                        name={focused ? 'md-heart' : 'md-heart-outline'}
                        size={30}
                        style={{ color: tintColor }}
                    />;

                } else if (navigation.state.routeName === 'me') {

                    return <MaterialIcons
                        name={focused ? 'person' : 'person-outline'}
                        size={34}
                        style={{ color: tintColor }}
                    />;
                }

            },
        }),

        tabBarOptions: { // style (bar), labelStyle (label), tabStyle (tab)
            showLabel: false,
            showIcon: true,
            // tintColor: 'red',
            activeTintColor: 'black',
            inactiveTintColor: 'dimgrey'
        },
    }
);
