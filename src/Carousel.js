import React, { Component } from 'react';
import {
    ScrollView, Dimensions, Platform, View,
    // Vibration
} from 'react-native';
import { Theme } from "./rnff/src/components";

const _itemWidth = Dimensions.get('window').width - 40;
// const _itemHeight = (Dimensions.get('window').width - 40) / 5 * 3;


export default class extends Component {
    constructor(props) {
        super(props);

        this.childrenLength = props.children.length;
        this.currentPage = 0;

        this.offsetList = []; // 1024 length

        this.onPageChanged = props.onPageChanged;
    }

    render() {
        return (
            <View style={{
                flex: 1,
                backgroundColor: 'transparent',
                // alignItems: 'center',
                // justifyContent: 'center',
                paddingBottom: Theme.spacing.base
            }}>
                <ScrollView
                    keyboardShouldPersistTaps={'always'}
                    keyboardDismissMode={'interactive'}
                    // style={{ paddingBottom: Theme.spacing.base }}
                    ref={(scrollView) => { this.scrollView = scrollView; }}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}

                    /*
                        decelerationRate={'fast'}
                        // decelerationRate={0.7}
                        snapToInterval={Dimensions.get('window').width - 30} // width - (YOUR_INSET_LEFT + YOUR_INSET_RIGHT)
                        snapToAlignment={"center"}
                        contentInset={{
                            top: 0,
                            left: 15, // YOUR_INSET_LEFT
                            bottom: 0,
                            right: 15, // YOUR_INSET_RIGHT
                        }}
                    */
                    // automaticallyAdjustContentInsets={false}

                    alwaysBounceHorizontal={false}
                    alwaysBounceVertical={false}
                    bounces={false}

                    decelerationRate={0.2} // works fine in android!

                    // scrollEventThrottle={16} // works fine in android
                    scrollEventThrottle={1} // for ios, tango

                    onScroll={this._onScroll}
                    onScrollEndDrag={this._onScrollEnd}
                    onScrollBeginDrag={this._onScrollBegin}
                    contentInset={{ top: 0 }}
                    automaticallyAdjustContentInsets={false}

                // onMomentumScrollEnd={this._onMomentumScrollEnd}
                >
                    {this.props.children}
                </ScrollView>
            </View>
        );
    }

    _onScrollBegin = (event) => {
        this.offsetList = [];
    }

    _onScrollEnd = (event) => {
        const offset = { ...event.nativeEvent.contentOffset };
        // console.log('_onScrollEnd offset', offset.x);

        const prevOffset = this.getPrevOffset();
        // console.log('_onScrollEnd prevOffset', prevOffset);

        let direction = offset.x > prevOffset ? 'right' : 'left';
        let speed = offset.x - prevOffset;
        if (speed < 0) speed = speed * -1;
        // console.log('speed', speed);

        let limit = 10; // speed limit
        /*
        if (Platform.OS === "ios") {
            limit = 20;
        } else { // android
            limit = 10;
        }
        */

        let page;
        if (speed > limit) {
            if (direction === 'right') {
                page = this.currentPage + 1;
            } else {
                page = this.currentPage - 1;
            }

            // console.log('page', page);

            if (page < 0 || page >= this.childrenLength) return;
        } else {
            page = this._calculateCurrentPage(offset.x);
            // if (page === -1) return;
            if (page === -1) {
                page = this.currentPage;
            }
        }

        this._placeCritical(page);
        this.currentPage = page;

        // console.log('Carousel._onScrollEnd, current page', page);
        if (this.onPageChanged) this.onPageChanged(page);
    }

    _calculateCurrentPage = (offset) => {
        // const { width } = this.state.size;
        // const width = Dimensions.get('window').width - 20;
        // const page = Math.round(offset / width); // index


        let page = this.getPage(offset);
        // console.log('!!!!!!!!!!!! page !!!!!!!!!', page);
        if (page === -1) return -1;

        return this._normalizePageNumber(page);
    }

    getPage(offset) { // check the center of the image
        const length = this.childrenLength;

        let half = 20 + _itemWidth / 2;
        if (offset <= half) {
            return 0;
        }

        for (var i = 1; i < length; i++) {
            let start = 20 + _itemWidth / 2 + (i - 1) * (_itemWidth + 10);
            let end = start + _itemWidth + 10;

            if (start < offset && offset <= end) {
                return i;
            }
        }

        return -1;
    }

    getPageOffset(page) {
        return page * (_itemWidth + 10);
    }

    _normalizePageNumber = (page) => {
        const childrenLength = this.childrenLength;

        if (page === childrenLength) {
            return 0;
        } else if (page > childrenLength) {
            return 1;
        } else if (page < 0) {
            return childrenLength - 1;
        }

        return page;
    }

    _placeCritical = (page) => {
        const childrenLength = this.childrenLength;

        let offset = 0;
        if (page < childrenLength) {
            if (page === 0) {
                offset = 0;
            } else {
                offset = 20 + (_itemWidth - 10) * page + (page - 1) * 20;
            }
        }

        this._scrollTo({ offset, animated: true });
    }

    _scrollTo = ({ offset, animated, nofix }) => {
        if (this.scrollView) {
            this.scrollView.scrollTo({ y: 0, x: offset, animated });
            // Fix bug #50
            if (!nofix && Platform.OS === 'android' && !animated) {
                this.scrollView.scrollTo({ y: 0, x: offset, animated: true });
            }
        }
    }

    _setCurrentPage = (currentPage) => {
        this.setState({ currentPage: currentPage });
    }

    _onScroll = (event) => {
        const currentOffset = event.nativeEvent.contentOffset.x;
        // console.log('onScroll x:', currentOffset);

        if (this.offsetList.length >= 1024) {
            // init
            let tmp = [];
            tmp[0] = this.offsetList[this.offsetList.length - 2];
            tmp[1] = this.offsetList[this.offsetList.length - 1];

            this.offsetList = tmp;
        }

        this.offsetList.push(currentOffset);
    }

    getPrevOffset() {
        if (this.offsetList.length === 0) {
            return this.getPageOffset(this.currentPage);
        }

        if (this.offsetList.length === 1) {
            // return this.offsetList[0];
            return this.getPageOffset(this.currentPage);
        }

        if (this.offsetList.length === 2) {
            /*
            let a = this.offsetList[0];
            let b = this.offsetList[1];
            let c = (a + b) / 2;
            return c;
            */
            return this.getPageOffset(this.currentPage);
        }

        let a = this.offsetList[this.offsetList.length - 3];
        let b = this.offsetList[this.offsetList.length - 2];
        let c = this.offsetList[this.offsetList.length - 1];
        let d = (a + b + c) / 3;

        return d;
    }


    moveToPage(index) {
        // ToDo
        console.log('Carousel.moveToPage', index);
        this._placeCritical(index);
    }

    /*
    _onMomentumScrollEnd = (event) => {
        Vibration.vibrate(1);
    }
    */
}
