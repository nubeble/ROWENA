import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign, Feather, MaterialIcons, Entypo } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';


export default class ShowMe extends React.Component {
    state = {
        selectedIndex: -1 // 0: Men, 1: Women, 2: Everyone
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const { selectedIndex } = this.props.navigation.state.params;
        this.originSelectedIndex = selectedIndex;
        this.setState({ selectedIndex });
    }

    @autobind
    handleHardwareBackPress() {
        if (this.originSelectedIndex !== this.state.selectedIndex) this.props.navigation.state.params.initFromShowMe(this.state.selectedIndex);
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        const selectedIndex = this.state.selectedIndex;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    {/* close button */}
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
                            if (this.originSelectedIndex !== this.state.selectedIndex) this.props.navigation.state.params.initFromShowMe(this.state.selectedIndex);
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        // alignSelf: 'center'
                        marginLeft: 40 + 16
                    }}>Show Me</Text>
                </View>
                <View style={styles.container}>

                    {/* I'm interested in... */}
                    <View style={{
                        alignSelf: 'center', width: '90%', height: 20,
                        justifyContent: 'center', paddingLeft: 20
                    }}>
                        <Text style={{ fontSize: 14, color: Theme.color.text5, fontFamily: "Roboto-Regular" }}>{"I'm interested in..."}</Text>
                    </View>

                    <TouchableOpacity style={{ marginVertical: 4 }}
                        onPress={() => {
                            this.setState({ selectedIndex: 0 });
                        }}
                    >
                        <View style={{
                            alignSelf: 'center', width: '90%', height: 40, borderRadius: 20,
                            justifyContent: 'center', paddingHorizontal: 20,
                            backgroundColor: "rgb(64, 64, 64)"
                        }}>
                            <Text style={{ fontSize: 18, color: selectedIndex === 0 ? Theme.color.splash : Theme.color.text4, fontFamily: "Roboto-Regular" }}>{'Men'}</Text>
                            {
                                selectedIndex === 0 &&
                                <Entypo name='check' color={Theme.color.splash} size={24} style={{ position: 'absolute', right: 20 }} />
                            }
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginVertical: 4 }}
                        onPress={() => {
                            this.setState({ selectedIndex: 1 });
                        }}
                    >
                        <View style={{
                            alignSelf: 'center', width: '90%', height: 40, borderRadius: 20,
                            justifyContent: 'center', paddingHorizontal: 20,
                            backgroundColor: "rgb(64, 64, 64)"
                        }}>
                            <Text style={{ fontSize: 18, color: selectedIndex === 1 ? Theme.color.splash : Theme.color.text4, fontFamily: "Roboto-Regular" }}>{'Women'}</Text>
                            {
                                selectedIndex === 1 &&
                                <Entypo name='check' color={Theme.color.splash} size={24} style={{ position: 'absolute', right: 20 }} />
                            }
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginVertical: 4 }}
                        onPress={() => {
                            this.setState({ selectedIndex: 2 });
                        }}
                    >
                        <View style={{
                            alignSelf: 'center', width: '90%', height: 40, borderRadius: 20,
                            justifyContent: 'center', paddingHorizontal: 20,
                            backgroundColor: "rgb(64, 64, 64)"
                        }}>
                            <Text style={{ fontSize: 18, color: selectedIndex === 2 ? Theme.color.splash : Theme.color.text4, fontFamily: "Roboto-Regular" }}>{'Everyone'}</Text>
                            {
                                selectedIndex === 2 &&
                                <Entypo name='check' color={Theme.color.splash} size={24} style={{ position: 'absolute', right: 20 }} />
                            }
                        </View>
                    </TouchableOpacity>

                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        // backgroundColor: 'white'
    }
});
