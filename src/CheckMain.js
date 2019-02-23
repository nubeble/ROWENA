import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, BackHandler } from 'react-native';

import { FlatList, Animated } from 'react-native';

import { Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';

const data = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


class AnimatedList extends React.Component {
    state = {
        animatedValue: new Animated.Value(0),
    };

    _renderItem = ({ item }) => {
        return (
            <View style={styles.nonsenseItem}>
                <Text style={styles.itemText}>{item}</Text>
            </View>
        );
    };

    render() {
        return (
            <AnimatedFlatList
                contentContainerStyle={{ marginTop: 200 }}
                scrollEventThrottle={16} // <-- Use 1 here to make sure no events are ever missed
                onScroll={this.props.onScroll}
                data={data}
                renderItem={this._renderItem}
                keyExtractor={(item, i) => i}
            />
        );
    }
}


export default class CheckMain extends React.Component {
    /*
        componentDidMount() {
            this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        }
    
        @autobind
        handleHardwareBackPress() {
            this.props.navigation.dispatch(NavigationActions.back());
    
            return true;
        }
    
        componentWillUnmount() {
            this.hardwareBackPressListener.remove();
    
            this.closed = true;
        }
    
        render() {
            return (
                <View style={styles.flex}>
                    <View style={styles.searchBar}>
                        <TouchableOpacity
                            style={{
                                width: 48,
                                height: 48,
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                this.props.navigation.dispatch(NavigationActions.back());
                            }}
                        >
                            <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                        </TouchableOpacity>
                    </View>
    
                    <View style={styles.header}><Text>header</Text></View>
                    <View style={styles.title}><Text>title</Text></View>
                    <View style={styles.content}><Text>content</Text></View>
                    <View style={styles.footer}><Text>footer</Text></View>
                </View>
            );
        }
    */


    state = {
        animatedValue: new Animated.Value(0),
    };

    _renderItem = ({ item }) => {
        return (
            <View style={styles.nonsenseItem}>
                <Text style={styles.itemText}>{item}</Text>
            </View>
        );
    };

    render() {
        let translateY = this.state.animatedValue.interpolate({
            inputRange: [0, 180],
            outputRange: [0, -180],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.container}>
                <AnimatedList
                    onScroll={Animated.event(
                        [
                            {
                                nativeEvent: { contentOffset: { y: this.state.animatedValue } },
                            },
                        ],
                        { useNativeDriver: true } // <-- Add this
                    )}
                />
                <Animated.View
                    style={[styles.headerWrapper, { transform: [{ translateY }] }]}
                >
                    <Text>
                        testo a caso da ridurre
        </Text>
                </Animated.View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    /*
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },





    container: {
        flex: 1,
        marginTop: 50,
        backgroundColor: 'black',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center'
    },

    header: {
        width: '100%',
        height: '10%',
        backgroundColor: '#ff9a9a',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        width: '100%',
        height: '20%',
        backgroundColor: '#9aa9ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        backgroundColor: '#d6ca1a',

        // justifyContent: 'center',
        alignItems: 'stretch',
        padding: 10
    },
    footer: {
        width: '100%',
        height: '10%',
        backgroundColor: '#1ad657',
        justifyContent: 'center',
        alignItems: 'center'
    },
    */

    container: {
        flex: 1,
        backgroundColor: 'lightblue',
    },
    nonsenseItem: {
        backgroundColor: 'red',
        margin: 8,
    },
    itemText: {
        backgroundColor: 'blue',
        fontSize: 20,
        padding: 20,
    },
    headerWrapper: {
        position: 'absolute',
        backgroundColor: 'red',
        height: 200,
        left: 0,
        right: 0,
    },

});

