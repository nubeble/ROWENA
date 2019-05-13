import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, Dimensions, Platform } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
// https://github.com/ElekenAgency/ReactNativeCountryCodeList
import CountryCodeList from './ReactNativeCountryCodeList/src/CountryCodeList';
import Util from './Util';

// const countryCodes = require('./CountryCodes');

const sectionItemTextHeight = (Dimensions.get('window').height - Cons.searchBarHeight - 52) / 26; // 52: textInputContainer height, 26: number of alphabets


export default class CountrySelection extends React.Component {
    state = {
        from: '' // check only if SignUpWithMobileMain
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const params = this.props.navigation.state.params;
        if (params.from) this.setState({ from: params.from });
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

                            if (this.cellClicked) return;
                            this.cellClicked = true;

                            setTimeout(() => {
                                if (this.closed) return;

                                if (this.state.from === 'SignUpWithMobileMain') {
                                    const result = {
                                        name: cellObject.name,
                                        dial: cellObject.dial
                                    };

                                    this.props.navigation.state.params.initFromSelect(result);
                                } else {
                                    const result = {
                                        name: cellObject.name,
                                        code: cellObject.code
                                    };

                                    this.props.navigation.state.params.initFromSelect(result);
                                }

                                this.props.navigation.dispatch(NavigationActions.back());
                            }, Cons.buttonTimeoutShort);
                        }}

                        headerBackground={Theme.color.component}

                        // sectionHeaderStyle={{ backgroundColor: 'orange' }}
                        // sectionHeaderHeight={44.5}
                        sectionHeaderHeight={36}

                        sectionHeaderTextStyle={{
                            // backgroundColor: 'red',

                            fontSize: 16,
                            paddingTop: 2,

                            color: Theme.color.text1,
                            fontFamily: "Roboto-Regular"
                        }}

                        sectionItemTextStyle={{
                            height: sectionItemTextHeight,
                            // backgroundColor: Util.getRandomColor(),

                            fontSize: 12,
                            paddingTop: 2,
                            color: Theme.color.text4,
                            fontFamily: "Roboto-Light",

                            marginRight: 8
                        }}

                        // cellStyle={{ backgroundColor: 'yellow' }}

                        cellTitleStyle={{
                            // backgroundColor: 'green',

                            fontSize: 16,
                            paddingTop: 2,
                            color: Theme.color.text2,
                            fontFamily: "Roboto-Regular"
                        }}

                        cellLabelStyle={
                            this.state.from === 'SignUpWithMobileMain' ?
                                { // country number
                                    // backgroundColor: 'grey',

                                    fontSize: 16,
                                    paddingTop: 2,
                                    color: Theme.color.text2,
                                    fontFamily: "Roboto-Regular"
                                }
                                :
                                {
                                    width: 0, height: 0
                                }
                        }
                    />
                </View>
            </View>
        );
    }

    /*
    getCountryCode(name) {
        const length = countryCodes.length;

        for (var i = 0; i < length; i++) {
            const item = countryCodes[i];
            if (item.Name === name) {
                return item.Code;
            }
        }

        return null;
    }
    */
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
