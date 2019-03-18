// @flow
import * as React from "react";
import { FlatList, StyleSheet, View, Animated, Dimensions, TextInput, TouchableOpacity } from "react-native";
import { Header } from 'react-navigation';
import { Constants } from "expo";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from "react-native-vector-icons/AntDesign";
import Image from "./Image";
import NavigationBar from "./NavigationBar";
import Text from "./Text";
import { withTheme, StyleGuide, type StyleProps, type ThemeProps } from "./theme";
import type { NavigationProps } from "./Navigation";
import type { Action } from "./Model";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type FeedItem = {
    id: string
};

type FeedProps<T> = ThemeProps & StyleProps & NavigationProps<*> & {
    data: T[],
    renderItem: T => React.Node,
    title: string,
    header ?: React.Node,
    back ?: string,
    rightAction ?: Action,
    numColumns ?: number,
    inverted ?: boolean,
    title1: string,
    title2: string,
    title3: string
};

type FeedState = {
    scrollAnimation: Animated.Value
};

const { height } = Dimensions.get("window");
// const keyExtractor = <T: FeedItem>(item: T): string => item.id;
const keyExtractor = <T: FeedItem>(item: T): string => item.uid;


class Feed<T: FeedItem> extends React.Component<FeedProps<T>, FeedState> {
    state = {
        scrollAnimation: new Animated.Value(0)
    };

    renderItem = (item: {item: T}): React.Node => {
        const {renderItem} = this.props;
        return renderItem(item.item);
    }

    startEditing() {
        // ToDo: add animation
        // alert('startEditing()');
    }

    leaveEditing() {
        // ToDo: add animation
        // alert('leaveEditing()');
    }

    render(): React.Node {
        const {renderItem} = this;
        const {data, title, navigation, theme, back, rightAction, header, numColumns, style, inverted, title1, title2, title3} = this.props;
        const {scrollAnimation} = this.state;
        const translateY = scrollAnimation.interpolate({
            inputRange: [55, 56, 57],
            outputRange: [55, 0, 0]
        });

        const backgroundScroll = scrollAnimation.interpolate({
            inputRange: [0, height],
            outputRange: [0, -height],
            extrapolate: "clamp"
        });

        const onScroll = Animated.event(
            [{
                nativeEvent: {
                    contentOffset: {
                        y: scrollAnimation
                    }
                }
            }],
            { useNativeDriver: true }
        );

        const titleStyle = back ? {} : {transform: [{translateY}] };
        const top = theme.palette.primary;
        const bottom = theme.palette.lightGray;


        return (
            <View style={styles.flex}>

                {/*
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: bottom }}>
                    {
                        !back && (
                            <Animated.View
                                style={{ flex: 1, backgroundColor: top, transform: [{ translateY: backgroundScroll }] }}
                            />
                        )
                    }
                </View>
                */}
                {/*
                <NavigationBar
                    {...{ navigation, title, back, titleStyle, rightAction }}
                />
                */}


                <View style={styles.searchBar}>
                    {/*
                    <View style={{ width: '70%', height: 32, backgroundColor: 'rgb(36, 36, 36)', borderColor: 'rgb(36, 36, 36)', borderRadius: 25, borderWidth: 1 }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 10, top: 7, alignSelf: 'baseline' }}
                            onPress={() => {
                                this.refs['searchInput'].focus();
                                this.startEditing();
                            }}
                        >
                            <FontAwesome name='search' color="grey" size={16}/>
                        </TouchableOpacity>

                        <TextInput
                            ref='searchInput'
                            style={{ position: 'absolute', left: 40, right: 40, width: '100%', height: '100%', fontSize: 16, color: "white" }} underlineColorAndroid="transparent"
                            placeholder='Try "Bangkok"' placeholderTextColor='grey'
                            onTouchStart={()=> this.startEditing() }
                            onEndEditing={()=> this.leaveEditing() }
                        />
                    </View>
                    */}
                </View>


                <AnimatedFlatList
                    contentContainerStyle={[styles.container, style]}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <Animated.View style={{ backgroundColor: theme.palette.primary }}>
                            {/* key, uri, preview, style */}
                            <Image
                                style={styles.ad}
                                // source={{ uri: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg' }}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <View style={styles.header}>
                                <Text style={styles.headerText}>{'NEARBY GIRLS'}</Text>
                            </View>



                            {/*
                                <View style={styles.header}>
                                    <Text type="title1" style={styles.headerText}>{title}</Text>
                                </View>
                            */}


                            {/*
                                <View style={styles.extraHeader}>{header}</View>
                            */}
                        </Animated.View>
                    }
                    ListFooterComponent={
                        <Animated.View style={{ backgroundColor: theme.palette.primary }}>
                            <View style={styles.header}>
                                <Text style={styles.headerText}>{'FORUMS'}</Text>
                            </View>
                            <Image
                                  style={styles.ad}
                                // source={{ uri: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg' }}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />
                        </Animated.View>
                    }
                    scrollEventThrottle={1}
                    columnWrapperStyle={(numColumns && numColumns > 0) ? styles.columnWrapperStyle : undefined}
                    {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'black'
    },
    container: {
        flexGrow: 1,
        paddingBottom: StyleGuide.spacing.small,
        // backgroundColor: StyleGuide.palette.black
        // backgroundColor: '#303030'
        backgroundColor: 'black'
    },


    header: {
        padding: StyleGuide.spacing.small
        // padding: StyleGuide.spacing.tiny
    },
    headerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
    extraHeader: {
        backgroundColor: StyleGuide.palette.white,
    ...StyleGuide.styles.shadow
    },
    columnWrapperStyle: {
        marginRight: StyleGuide.spacing.small,
    marginTop: StyleGuide.spacing.small
    },
    searchBar: {
        height: Constants.statusBarHeight + Header.HEIGHT,
        paddingBottom: 14,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },


    ad: {
        width: (Dimensions.get('window').width) - 2,
        height: (Dimensions.get('window').width - 2) / 21 * 9,
        marginBottom: StyleGuide.spacing.small
    }



});

export default withTheme(Feed);
