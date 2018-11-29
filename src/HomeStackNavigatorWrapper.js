import React from 'react';
import HomeStackNavigator from './HomeStackNavigator';


export default class HomeStackNavigatorWrapper extends React.Component {

    render() {
        const { navigation } = this.props;

        return (
            <HomeStackNavigator
                screenProps={{
                    params: navigation.state.params,
                    rootNavigation: navigation
                }} />
        );
    }
}
