import React from 'react';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, BackHandler } from 'react-native';
import { NavigationActions } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Cons } from "./Globals";
import autobind from "autobind-decorator";


export default class UserMain extends React.Component {
    state = {
        // bottomPosition: Dimensions.get('window').height
    };

    componentDidMount() {
        console.log('UserMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    componentWillUnmount() {
        console.log('UserMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();

        this.isClosed = true;
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    render() {

        return (
            <View style={styles.flex}>

                <View style={styles.searchBar}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.props.navigation.dispatch(NavigationActions.back())}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24}/>
                    </TouchableOpacity>

                    {/*
                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center',
                            paddingBottom: 4
                        }}
                    >{post.name}</Text>
                    */}
                </View>







            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: Theme.color.background
        backgroundColor: 'green'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },



});
