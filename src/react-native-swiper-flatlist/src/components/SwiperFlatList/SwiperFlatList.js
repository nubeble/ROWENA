import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';

import Pagination from '../Pagination';

const MILLISECONDS = 1000;
const FIRST_INDEX = 0;
const ITEM_VISIBLE_PERCENT_THRESHOLD = 60;

const DIRECTION_LEFT = 100;
const DIRECTION_RIGHT = 200;

let autoplay_direction = DIRECTION_RIGHT;

const SwiperFlatList = React.forwardRef(
    (
        {
            pageIndexFontSize,
            vertical,
            children,
            data,
            renderItem,
            renderAll,
            index,
            // Pagination
            showPagination,
            PaginationComponent,
            paginationActiveColor,
            paginationDefaultColor,
            paginationStyle,
            paginationStyleItem,
            // Autoplay
            autoplayDelay,
            autoplay,
            autoplayLoop,
            // autoplayInvertDirection,
            // Functions
            onChangeIndex,
            onMomentumScrollEnd,
            onViewableItemsChanged,
            viewabilityConfig,
            ...props
        },
        ref,
    ) => {
        let _data;
        let _renderItem;

        if (children) {
            // github.com/gusgard/react-native-swiper-flatlist/issues/40
            _data = Array.isArray(children) ? children : [children];
            _renderItem = ({ item }) => item;
        } else if (data) {
            _data = data;
            _renderItem = renderItem;
        }
        const size = _data.length;
        // Items to render in the initial batch.
        const _initialNumToRender = renderAll ? size : 1;
        const [paginationIndex, setPaginationIndex] = React.useState(index);
        const [prevIndex, setPrevIndex] = React.useState(index);
        const [paginationIndexes, setPaginationIndexes] = React.useState({ index, prevIndex: index });
        const [ignoreOnMomentumScrollEnd, setIgnoreOnMomentumScrollEnd] = React.useState(false);
        const flatListElement = React.useRef(null);

        const _onChangeIndex = React.useCallback(
            ({ index: _index, prevIndex: _prevIndex }) => {
                onChangeIndex ?.({ index: _index, prevIndex: _prevIndex });
            },
            [onChangeIndex],
        );

        const _scrollToIndex = params => {
            if (typeof params !== 'object') {
                console.error(
                    'Expected an object for "scrollToIndex", for example: scrollToIndex({ index: 1, animated: true })',
                );
                // NOTE: remove in future versions.
                return;
            }

            const { index: indexToScroll, animated = true } = params;
            const newParams = { animated, index: indexToScroll };

            setPaginationIndexes(prevState => {
                setIgnoreOnMomentumScrollEnd(true);
                return { index: indexToScroll, prevIndex: prevState.index };
            });
            // When execute "scrollToIndex", we ignore the method "onMomentumScrollEnd"
            // because it not working on Android
            // https://github.com/facebook/react-native/issues/21718
            flatListElement ?.current ?.scrollToIndex(newParams);
        };

        React.useEffect(() => {
            const next = {
                index: paginationIndexes.index,
                prevIndex: paginationIndexes.prevIndex,
            };
            if (paginationIndex !== next.index) {
                setPaginationIndex(next.index);
            }
            if (prevIndex !== next.prevIndex) {
                setPrevIndex(next.prevIndex);
            }
            _onChangeIndex({ index: next.index, prevIndex: next.prevIndex });
            // only consider "paginationIndexes"
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [paginationIndexes]);

        React.useImperativeHandle(ref, () => ({
            scrollToIndex: (...args) => {
                _scrollToIndex(...args);
            },
            getCurrentIndex: () => paginationIndex,
            getPrevIndex: () => prevIndex,
            goToLastIndex: () => {
                _scrollToIndex({ index: size - 1 });
            },
            goToFirstIndex: () => {
                _scrollToIndex({ index: FIRST_INDEX });
            },
        }));

        React.useEffect(() => {
            // if current index is the last
            // const isLastIndexEnd = autoplayInvertDirection ? paginationIndex === FIRST_INDEX : paginationIndex === _data.length - 1;
            const isLastIndexEnd = autoplay_direction === DIRECTION_LEFT ? paginationIndex === 0 : paginationIndex === _data.length - 1;

            // autoplay && if current index is not the last
            // const shouldContinueWithAutoplay = autoplay && !isLastIndexEnd;
            const shouldContinueWithAutoplay = autoplay;

            let autoplayTimer;
            // if (shouldContinueWithAutoplay || autoplayLoop) {
            if (shouldContinueWithAutoplay) {
                autoplayTimer = setTimeout(() => {
                    // const nextIncrement = autoplayInvertDirection ? -1 : +1;

                    let nextIncrement;
                    if (autoplay_direction === DIRECTION_RIGHT) {

                        if (isLastIndexEnd) {
                            nextIncrement = -1;
                            autoplay_direction = DIRECTION_LEFT;
                        } else {
                            nextIncrement = 1;
                        }

                    } else { // DIRECTION_LEFT

                        if (isLastIndexEnd) {
                            nextIncrement = 1;
                            autoplay_direction = DIRECTION_RIGHT;
                        } else {
                            nextIncrement = -1;
                        }

                    }


                    /*
                    let nextIndex = (paginationIndex + nextIncrement) % _data.length;
                    if (autoplayInvertDirection && nextIndex < FIRST_INDEX) {
                        nextIndex = _data.length - 1;
                    }
                    */
                    let nextIndex = paginationIndex + nextIncrement;
                    // console.log('nextIndex', nextIndex);

                    // When reach the end disable animated
                    // _scrollToIndex({ index: nextIndex, animated: !isLastIndexEnd });
                    _scrollToIndex({ index: nextIndex, animated: true });
                }, autoplayDelay * MILLISECONDS);
            }
            // https://upmostly.com/tutorials/settimeout-in-react-components-using-hooks
            return () => clearTimeout(autoplayTimer);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [paginationIndex]);
        const _onMomentumScrollEnd = e => {
            // NOTE: Method not executed when call "flatListElement?.current?.scrollToIndex"
            if (ignoreOnMomentumScrollEnd) {
                setIgnoreOnMomentumScrollEnd(false);
                return;
            }

            onMomentumScrollEnd ?.({ index: paginationIndex }, e);

            _onChangeIndex({ index: paginationIndex, prevIndex });
        };

        const _onViewableItemsChanged = React.useMemo(
            () => params => {
                const { changed } = params;
                const newItem = changed ?.[FIRST_INDEX];
                if (newItem !== undefined) {
                    const nextIndex = newItem.index;
                    if (newItem.isViewable) {
                        setPaginationIndex(nextIndex);
                    } else {
                        setPrevIndex(nextIndex);
                    }
                }
                onViewableItemsChanged ?.(params);
            },
            [],
        );

        const flatListProps = {
            ref: flatListElement,
            keyExtractor: (_item, _index) => _index.toString(),
            horizontal: !vertical,
            showsHorizontalScrollIndicator: false,
            showsVerticalScrollIndicator: false,
            pagingEnabled: true,
            ...props,
            onMomentumScrollEnd: _onMomentumScrollEnd,
            onScrollToIndexFailed: info =>
                setTimeout(() => _scrollToIndex({ index: info.index, animated: false })),
            data: _data,
            renderItem: _renderItem,
            initialNumToRender: _initialNumToRender,
            initialScrollIndex: index, // used with onScrollToIndexFailed
            viewabilityConfig: {
                // https://facebook.github.io/react-native/docs/flatlist#minimumviewtime
                minimumViewTime: 200,
                itemVisiblePercentThreshold: ITEM_VISIBLE_PERCENT_THRESHOLD,
                ...viewabilityConfig,
            },
            onViewableItemsChanged: _onViewableItemsChanged,
            // debug: true, // for debug
        };

        const paginationProps = {
            size,
            paginationIndex: paginationIndex,
            scrollToIndex: _scrollToIndex,
            paginationActiveColor,
            paginationDefaultColor,
            paginationStyle,
            paginationStyleItem,
        };


        let top = 3;
        let right = 6;
        if (pageIndexFontSize > 10) {
            top = 4;
            right = 8;
        }

        const number = (paginationIndex + 1) + ' / ' + _data.length;

        return (
            <React.Fragment>
                {/*
                <View style={{
                    zIndex: 1000,
                    backgroundColor: "rgba(61, 61, 61, 0.6)",
                    position: 'absolute',
                    top: 5, right: 5,
                    borderRadius: 100, // make it max 
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{
                        paddingHorizontal: 6,
                        paddingTop: 3,
                        paddingBottom: 4,
                        fontSize: 12,
                        // lineHeight:12,
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)',
                        // fontFamily: "Chewy-Regular"
                    }}>{number}</Text>
                </View>
                */}
                <View style={{
                    zIndex: 1000,
                    // backgroundColor: "rgba(61, 61, 61, 0.6)",
                    position: 'absolute',
                    // top: 3, right: 6,
                    top, right,

                    // borderRadius: 100, // make it max 
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{
                        // paddingHorizontal: 6,
                        // paddingTop: 3,
                        // paddingBottom: 4,
                        // fontSize: 10,
                        fontSize: pageIndexFontSize,
                        // lineHeight:12,
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)',
                        // fontFamily: "Chewy-Regular"


                        textShadowColor: 'black',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 1
                    }}>{number}</Text>
                </View>

                <FlatList {...flatListProps} />

                {showPagination && <PaginationComponent {...paginationProps} />}
            </React.Fragment>
        );
    },
);

SwiperFlatList.propTypes = {
    pageIndexFontSize: PropTypes.number,
    data: PropTypes.array,
    vertical: PropTypes.bool,
    index: PropTypes.number,
    renderAll: PropTypes.bool,
    renderItem: PropTypes.func,
    // Only is allowed children or data not both
    children(props, propName) {
        const { data } = props;
        if (!props[propName] && !data) {
            return new Error('Invalid props, `data` or `children` is required');
        }
        if (data && data.length !== 0 && !props.renderItem) {
            return new Error('Invalid props, `renderItem` is required');
        }
        return undefined;
    },
    onChangeIndex: PropTypes.func,

    // Pagination
    showPagination: PropTypes.bool,
    PaginationComponent: PropTypes.func,
    paginationActiveColor: Pagination.propTypes.paginationActiveColor,
    paginationDefaultColor: Pagination.propTypes.paginationDefaultColor,
    paginationStyle: Pagination.propTypes.paginationStyle,
    paginationStyleItem: Pagination.propTypes.paginationStyleItem,

    // Autoplay
    autoplayDelay: PropTypes.number,
    autoplay: PropTypes.bool,
    // autoplayInvertDirection: PropTypes.bool,
    autoplayLoop: PropTypes.bool,

    // Optionals
    onMomentumScrollEnd: PropTypes.func,
    onViewableItemsChanged: PropTypes.func,
    viewabilityConfig: PropTypes.object,
};

SwiperFlatList.defaultProps = {
    pageIndexFontSize: 10,
    index: FIRST_INDEX,
    data: [],
    autoplayDelay: 3,
    // autoplayInvertDirection: false,
    autoplayLoop: false,
    autoplay: false,
    showPagination: false,
    vertical: false,
    renderAll: false,
    PaginationComponent: Pagination,
    onChangeIndex: undefined,
    // Optionals
    onMomentumScrollEnd: undefined,
    onViewableItemsChanged: undefined,
    viewabilityConfig: {},
};

export default SwiperFlatList;
