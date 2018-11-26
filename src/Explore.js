// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import { StyleSheet, View, Animated, SafeAreaView, TouchableHighlight, TouchableWithoutFeedback, Platform, Dimensions, TouchableOpacity, TextInput, Modal, StatusBar } from "react-native";
import { Header } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from "./rnff/src/components/SmartImage";
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete/GooglePlacesAutocomplete';

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

// const homePlace = { description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } } };
// const workPlace = { description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } } };
const Bangkok = { description: 'Bangkok, Thailand', place_id : 'ChIJ82ENKDJgHTERIEjiXbIAAQE', geometry: { location: { lat: 13.7563309, lng: 100.5017651 } } };
const Manila = { description: 'Manila, Philippines', place_id : 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk', geometry: { location: { lat: 14.5995124, lng: 120.9842195 } } };
const HoChiMinh = { description: 'Ho Chi Minh, Vietnam', place_id : 'ChIJ0T2NLikpdTERKxE8d61aX_E', geometry: { location: { lat: 10.8230989, lng: 106.6296638 } } };
const Vientiane = { description: 'Vientiane, Laos', place_id : 'ChIJIXvtBoZoJDER3-7BGIaxkx8', geometry: { location: { lat: 17.9757058, lng: 102.6331035 } } };

type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore") @observer
export default class Explore extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
    state = {
        scrollAnimation: new Animated.Value(0),

        showModal: false,
        searchText: ''
    };

    /*
    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }
    */

    componentDidMount() {
        this.props.feedStore.checkForNewEntriesInFeed();
    }

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;
        const { scrollAnimation } = this.state;
        const { profile } = profileStore;

        const opacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [1, 0],
            extrapolate: "clamp"
        });
        const translateY = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, -60],
            extrapolate: "clamp"
        });
        const fontSize = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [36, 24],
            extrapolate: "clamp"
        });
        const height = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: Platform.OS === "android" ? [70, 70] : [100, 60],
            extrapolate: "clamp"
        });
        const marginTop = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [24, 0],
            extrapolate: "clamp"
        });
        const shadowOpacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, 0.25],
            extrapolate: "clamp"
        });

        return (
            <View style={styles.flex}>

                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={this.state.showModal}
                    onRequestClose={() => {
                        // Alert.alert('Modal has been closed.');
                    }}>

                    <View style={styles.modalFlex}>
                        <View style={styles.modalSearchBarStyle}>
                            <TouchableOpacity
                                style={{ marginTop: Header.HEIGHT / 3 - 3, marginRight: 22, alignSelf: 'baseline' }}
                                onPress={() => this.setState({ showModal: false })}
                            >
                                <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                            </TouchableOpacity>



                            {/*
                            <TouchableHighlight
                                onPress={() => {
                                    this.setState({ showModal: false });
                                }}>
                                <Text>Hide Modal</Text>
                            </TouchableHighlight>
                            */}
                        </View>

                        <GooglePlacesAutocomplete
                            placeholder='Where to?'
                            minLength={2} // minimum length of text to search
                            autoFocus={false}
                            returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                            // listViewDisplayed='auto'    // true/false/undefined
                            listViewDisplayed={this.state.showPlaceSearchListView}
                            fetchDetails={true}
                            // fetchDetails={false}
                            renderDescription={row => row.description} // custom description render
                            onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                console.log('data', data);
                                console.log('details', details);

                                console.log('data.place_id', data.place_id);
                                
                                // console.log('details', details.geometry.location);
                                // const location = details.geometry.location;
                                // location.lat;
                                // location.lng;

                                // close the modal in 0.3 sec
                                let that = this;
                                setTimeout(function () {
                                    that.setState({ showModal: false });
                                }, 300);

                            }}

                            getDefaultValue={() => ''}

                            query={{
                                // available options: https://developers.google.com/places/web-service/autocomplete
                                key: 'AIzaSyC6j5HXFtYTYkV58Uv67qyd31KjTXusM2A',
                                language: 'en', // language of the results
                                types: '(cities)' // default: 'geocode'
                            }}

                            styles={{
                                container: {
                                    // position: 'absolute',
                                    // left: 0, right: 0,
                                    // bottom: 0,

                                    // width: '100%',

                                    // height: 32,
                                    // height: Dimensions.get('window').height - (Constants.statusBarHeight + 2), // - bottom tab height

                                    // top: Constants.statusBarHeight + 2,
                                    // backgroundColor: 'transparent',
                                    backgroundColor: 'transparent',
                                },
                                textInputContainer: {
                                    /*
                                    position: 'absolute',
                                    left: 40,
                                    right: 40,
                                    alignSelf: 'baseline',
                                    borderRadius: 25,
                                    */
                                    height: 50,
                                    backgroundColor: 'transparent',
                                    // backgroundColor: 'grey',
                                    borderTopColor: 'transparent',
                                    borderBottomColor: 'transparent',
                                },
                                textInput: {
                                    // width: '70%',
                                    // position: 'absolute',
                                    // left: 60,
                                    // right: 60,
                                    // backgroundColor: 'green',
                                    //borderRadius: 25,

                                    // width: '100%',
                                    position: 'absolute',
                                    left: 0,
                                    right: 40,

                                    height: 40,
                                    backgroundColor: 'transparent',
                                    // backgroundColor: '#777777',
                                    fontSize: 24,
                                    lineHeight: 28,
                                    fontWeight: '500',
                                    // fontFamily: "SFProText-Semibold",
                                    color: "white",
                                    // borderColor: 'transparent'

                                    // selectionColor: 'rgb(234, 150, 24)'
                                    
                                },

                                listView: {
                                    marginTop: 20,
                                    // position: 'absolute',
                                    // width: '100%',
                                    // left: 0, right: 0,
                                    height: '100%',
                                    backgroundColor: 'transparent'
                                },
                                separator: {
                                    backgroundColor: 'transparent'
                                },
                                description: {
                                    fontSize: 16,
                                    lineHeight: 20,
                                    height: 30,
                                    fontWeight: '500',
                                    color: "white"
                                },
                                predefinedPlacesDescription: {
                                    // color: 'rgb(234, 150, 24)'
                                    color: 'white'
                                },
                                poweredContainer: {
                                    backgroundColor: 'transparent',
                                    width: 0,
                                    height: 0
                                },
                                powered: {
                                    backgroundColor: 'transparent',
                                    width: 0,
                                    height: 0
                                }
                            }}

                            currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                            currentLocationLabel="Current location"
                            nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                            GoogleReverseGeocodingQuery={{
                                // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                            }}
                            GooglePlacesSearchQuery={{
                                // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                rankby: 'distance',
                                types: 'food'
                            }}

                            filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
                            predefinedPlaces={[Bangkok, Manila, HoChiMinh, Vientiane]}

                            debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                        // renderLeftButton={() => <Image source={require('path/custom/left-icon')} />}
                        /*
                        renderLeftButton={() =>
                            <TouchableOpacity
                                style={{ position: 'absolute', left: 30, top: 10, alignSelf: 'baseline' }}
                                onPress={() => {
                                    // this.startEditing();
                                }}
                            >
                                <FontAwesome name='search' color="grey" size={20} />
                            </TouchableOpacity>
                        }
                        */
                        // renderRightButton={() => <Text>Custom text after the input</Text>}
                        />


                    </View>

                </Modal>

                <View style={styles.searchBarStyle}>
                    <View style={{
                        width: '50%', height: 32,
                        // backgroundColor: 'rgb(36, 36, 36)',
                        backgroundColor: '#303030',
                        borderColor: '#303030',
                        borderRadius: 25, borderWidth: 1
                    }} >
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 10, top: 6, alignSelf: 'baseline' }}
                            onPress={() => {
                                // this.refs['searchInput'].focus();
                                // this.startEditing();
                                this.setState({ showModal: true });
                            }}
                        >
                            <FontAwesome name='search' color="grey" size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                position: 'absolute', left: 36, right: 40, width: '100%', height: '100%',
                            }}
                            onPress={() => this.setState({ showModal: true })}>
                            <TextInput
                                // ref='searchInput'
                                editable={false}
                                style={{ fontSize: 16, color: "white" }}
                                placeholder='Where to?' placeholderTextColor='grey'
                                // underlineColorAndroid="transparent"
                                // onTouchStart={() => this.startEditing()}
                                // onEndEditing={() => this.leaveEditing()}
                                value={this.state.searchText}
                            />
                        </TouchableOpacity>

                    </View>
                </View>


                {/* <AnimatedSafeAreaView style={[styles.header, { shadowOpacity }]}>
                    <Animated.View style={[styles.innerHeader, { height }]}>
                        <View>
                            <AnimatedText
                                type="large"
                                style={[styles.newPosts, { opacity, transform: [{ translateY }] }]}
                            >
                                New posts
                            </AnimatedText>
                            <AnimatedText
                                type="header2"
                                style={{ fontSize, marginTop }}
                            >
                                {moment().format("dddd")}
                            </AnimatedText>
                        </View>
                        {
                            profile && (
                                <TouchableWithoutFeedback onPress={this.profile}>
                                    <View>
                                        <Avatar {...profile.pictures.one} />
                                    </View>
                                </TouchableWithoutFeedback>
                            )
                        }
                    </Animated.View>
                </AnimatedSafeAreaView> */}

                <Feed
                    store={feedStore}
                    onScroll={Animated.event([{
                        nativeEvent: {
                            contentOffset: {
                                y: scrollAnimation
                            }
                        }
                    }])}
                    ListHeaderComponent={(
                        <Animated.View>
                            <TouchableOpacity onPress={() => {
                                /*
                                if (this.state.showPlaceSearchListView) {
                                    this.setState({ showPlaceSearchListView: false });
                                } else {
                                    this.setState({ showPlaceSearchListView: true });
                                }
                                */

                                if (this.state.showModal) {
                                    this.setState({ showModal: false });
                                } else {
                                    this.setState({ showModal: true });
                                }
                            }}>
                                <SmartImage
                                    style={styles.ad}
                                    // preview={"data:image/gif;base64,R0lGODlhAQABAPAAAKyhmP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <View style={styles.header}>
                                <Text style={styles.headerText}>{'NEARBY GIRLS'}</Text>
                            </View>
                        </Animated.View>
                    )}
                    // numColumns={2}
                    // keyExtractor
                    {...{ navigation }}
                />
            </View>
        );
    } // end of render()

    startEditing() {
        // ToDo: add animation
        // alert('startEditing()');
    }

    leaveEditing() {
        // ToDo: add animation
        // alert('leaveEditing()');
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'rgb(26, 26, 26)'
    },
    header: {
        backgroundColor: "white",
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 8,
        zIndex: 10000
    },
    innerHeader: {
        marginHorizontal: Theme.spacing.base,
        marginVertical: Theme.spacing.tiny,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    newPosts: {
        position: "absolute",
        top: 0
    },





    searchBarStyle: {
        height: Constants.statusBarHeight + Header.HEIGHT,
        paddingBottom: 14 + 2,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    ad: {
        width: Dimensions.get('window').width - 2,
        height: (Dimensions.get('window').width - 2) / 21 * 9,
        marginBottom: Theme.spacing.small
    },
    header: {
        padding: Theme.spacing.small
    },
    headerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },


    modalFlex: {
        flex: 1,
        // backgroundColor: 'rgb(26, 26, 26)'
        backgroundColor: 'black'
    },
    modalSearchBarStyle: {
        backgroundColor: 'black', // RN issue
        height: Header.HEIGHT,
        paddingBottom: 14 + 2,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },

});





















