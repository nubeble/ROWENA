import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "./rnff/src/components";
import { MaterialCommunityIcons } from "react-native-vector-icons";

const lineHeight = 18; // height per 1 line


export default class ReadMore extends React.Component {
    state = {
        showAllText: true,
        showButton: false
    };

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        const { showAllText } = this.state;
        const { numberOfLines } = this.props;

        return (
            <View>
                <TouchableOpacity
                    onLayout={(e) => {
                        if (this.measured) return;
                        this.measured = true;

                        const { height } = e.nativeEvent.layout;
                        // console.log('height', height);

                        const limit = numberOfLines * lineHeight; // 36

                        console.log('limit', limit, 'height', height);

                        if (height <= limit) {
                            this.setState({ showAllText: true, showButton: false });
                        } else {
                            this.setState({ showAllText: false, showButton: true });
                        }
                    }}
                    onPress={this.props.onPress}
                >
                    <Text numberOfLines={showAllText ? 0 : numberOfLines}>
                        {this.props.children}
                    </Text>
                </TouchableOpacity>
                {
                    this.renderReadMore()
                }
            </View>
        );
    }

    renderReadMore() {
        let { showButton, showAllText } = this.state;

        if (showButton && !showAllText) {
            // if (!showAllText) {
            return (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{
                            width: 22,
                            height: 22,
                            justifyContent: "center", alignItems: "center"

                        }}
                        onPress={this._handlePressReadMore}
                    >
                        <MaterialCommunityIcons name='chevron-down' color="silver" size={18} />
                    </TouchableOpacity>
                </View>
            );
        } else if (showButton && showAllText) {
            // } else if (showAllText) {
            return (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{
                            width: 22,
                            height: 22,
                            justifyContent: "center", alignItems: "center"

                        }}
                        onPress={this._handlePressReadLess}
                    >
                        <MaterialCommunityIcons name='chevron-up' color="silver" size={18} />
                    </TouchableOpacity>
                </View>
            );
        }
    }

    _handlePressReadMore = () => {
        this.setState({ showAllText: true });
    };

    _handlePressReadLess = () => {
        this.setState({ showAllText: false });
    };
}
