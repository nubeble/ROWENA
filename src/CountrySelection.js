import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
// https://github.com/ElekenAgency/ReactNativeCountryCodeList
import CountryCodeList from './ReactNativeCountryCodeList/src/CountryCodeList';
import Util from './Util';

const sectionItemTextHeight = (Dimensions.get('window').height - Cons.searchBarHeight - 52) / 26; // 52: textInputContainer height, 26: number of alphabets


export default class CountrySelection extends React.Component {
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    <CountryCodeList
                        onClickCell={(cellObject) => {
                            console.log(cellObject);

                            setTimeout(() => {
                                if (this.closed) return;
                                
                                this.props.navigation.state.params.initFromSelect(cellObject);
                                this.props.navigation.dispatch(NavigationActions.back());
                            }, 300);
                        }}

                        headerBackground={Theme.color.component}

                        // sectionHeaderStyle={{ backgroundColor: 'orange' }}
                        // sectionHeaderHeight={44.5}
                        sectionHeaderHeight={36}

                        sectionHeaderTextStyle={{
                            // backgroundColor: 'red',

                            fontSize: 16,
                            paddingTop: 8, // ToDo: check ios!
                            color: "white",
                            fontFamily: "SFProText-Regular"
                        }}

                        sectionItemTextStyle={{
                            height: sectionItemTextHeight,
                            // backgroundColor: Util.getRandomColor(),

                            fontSize: 12,
                            paddingTop: 2, // ToDo: check ios!
                            color: "white",
                            fontFamily: "SFProText-Regular"
                        }}

                        // cellStyle={{ backgroundColor: 'yellow' }}

                        cellTitleStyle={{
                            // backgroundColor: 'purple',

                            fontSize: 16,
                            paddingTop: 8, // ToDo: check ios!
                            color: "white",
                            fontFamily: "SFProText-Regular"
                        }}

                        cellLabelStyle={{ // country number
                            width: 0, // hide
                            // backgroundColor: 'grey',

                            fontSize: 16,
                            paddingTop: 8, // ToDo: check ios!
                            color: "white",
                            fontFamily: "SFProText-Regular"
                        }}
                    />
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
        // backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        // backgroundColor: 'green'
    }
});
