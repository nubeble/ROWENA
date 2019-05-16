import React from 'react';
import {
    View,
    // Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    PixelRatio,
    LayoutAnimation
} from 'react-native';
import { getAlphabet } from './data';
import AlphabetListView from 'react-native-alphabetlistview';
import Search from 'react-native-search-box';
import _ from 'lodash';
import { Text, Theme } from '../../rnff/src/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Cons } from '../../Globals';


export default class CountryCodeList extends React.Component {
    constructor(props) {
        super(props)
        this.renderCell = this.renderCell.bind(this)
        this.renderSectionItem = this.renderSectionItem.bind(this)
        this.renderSectionHeader = this.renderSectionHeader.bind(this)

        this.state = {
            data: this.props.data ? this.props.data : getAlphabet(),
            query: '',
            clearButtonDisplayed: false
        }
    }

    componentDidMount() {
        // Consider: move to onFocus
        setTimeout(() => {
            !this.closed && this.refs.textInput && this.refs.textInput.focus();
        }, Cons.buttonTimeoutLong);
    }

    componentWillUnmount() {
        this.closed = true;
    }

    render() {
        return (
            <View style={styles.container}>
                {/*
                <Search
                    afterCancel={this.clearQuery}
                    afterDelete={this.clearQuery}
                    onChangeText={this.props.onSearch ? this.props.onSearch : this.onChangeText}
                    backgroundColor={this.props.headerBackground}
                    titleCancelColor={'rgb(0, 0, 0)'}
                    tintColorSearch={'rgb(0, 0, 0)'}
                    inputStyle={styles.searchInput}
                    {...this.props.searchProps}
                />
                */}
                <View
                    style={styles.textInputContainer}
                >
                    <TextInput
                        style={styles.textInput}
                        ref="textInput"
                        multiline={false}
                        // keyboardType={Platform.OS === "android" ? 'visible-password' : 'default'}
                        // returnKeyType={this.props.returnKeyType}
                        // keyboardAppearance={'dark'}
                        underlineColorAndroid={'transparent'}
                        autoCorrect={false}
                        autoCapitalize="words"
                        selectionColor={Theme.color.selection}
                        autoFocus={false}
                        value={this.state.query}
                        placeholder={'Select your country'}
                        placeholderTextColor={Theme.color.placeholder}
                        onChangeText={this.onChangeText}
                        // onSubmitEditing={this.props.onSubmitEditing}
                        clearButtonMode={'never'}
                    />
                    {this.renderClearButton()}
                </View>
                <AlphabetListView
                    keyboardShouldPersistTaps={'handled'}
                    enableEmptySections={true}
                    data={this.state.data}
                    cell={this.renderCell}
                    sectionListItem={this.renderSectionItem}
                    sectionHeader={this.renderSectionHeader}
                    cellHeight={this.props.cellHeight}
                    sectionHeaderHeight={this.props.sectionHeaderHeight}
                    {...this.props.alphabetListProps}
                />
            </View>
        )
    }

    filterData = _.debounce(() => {
        const initialData = this.props.data || getAlphabet();
        let data = JSON.parse(JSON.stringify(initialData));
        Object.keys(data).map((key) => {
            data[key] = data[key].filter((el) => {
                // return el.name.toLowerCase().includes(this.state.query.toLowerCase()) || el.code.includes(this.state.query)
                return el.name.toLowerCase().includes(this.state.query.toLowerCase())
            })

            if (data[key].length === 0) {
                delete (data[key])
            }
        });

        this.setState({ data });
    }, 450)

    clearQuery = () => {
        this.onChangeText('')
    }

    onChangeText = (query) => {
        this.setState({ query })
        this.filterData()


        if (query.length >= 1) {
            !this.closed && this.setState({ clearButtonDisplayed: true });
        } else {
            !this.closed && this.setState({ clearButtonDisplayed: false });
        }
    }

    renderSectionHeader(rowData) {
        if (this.props.renderSectionHeader) {
            return this.props.renderSectionHeader(rowData)
        }

        return (
            <View style={[
                styles.sectionHeader,
                this.props.sectionHeaderStyle,
                { backgroundColor: this.props.headerBackground, height: this.props.sectionHeaderHeight - 1 }
            ]}>
                <Text style={[styles.sectionHeaderText, this.props.sectionHeaderTextStyle]}>{rowData.title}</Text>
            </View>
        )
    }

    renderSectionItem(rowData) {
        if (this.props.renderSectionItem) {
            return this.props.renderSectionItem(rowData)
        }

        return (
            <Text style={[styles.sectionItemText, this.props.sectionItemTextStyle]}>{rowData.title}</Text>
        )
    }

    renderCell(rowData) {
        if (this.props.renderCell) {
            return this.props.renderCell(rowData)
        }

        return (
            <View>
                <TouchableOpacity
                    onPress={() => { this.props.onClickCell(rowData.item) }}
                    style={[styles.cell, this.props.cellStyle, { height: this.props.cellHeight - 0.5 }]}>
                    <Text numberOfLines={1} style={[styles.cellTitle, this.props.cellTitleStyle]}>{rowData.item.name}</Text>

                    {/*
                    <Text style={[styles.cellLabel, this.props.cellLabelStyle]}>{rowData.item.code}</Text>
                    */}
                    <Text style={[styles.cellLabel, this.props.cellLabelStyle]}>{rowData.item.dial}</Text>
                </TouchableOpacity>
                <View style={styles.separator} />
            </View>
        )
    }

    renderClearButton() {
        if (this.state.clearButtonDisplayed) {
            return (
                <TouchableOpacity
                    style={{ position: 'absolute', right: 30, top: 18, alignSelf: 'baseline' }}
                    onPress={() => {
                        this.clearQuery();
                        /*
                        if (this.refs.textInput) {
                            // !this.closed && this.setState({ query: '', clearButtonDisplayed: false });
                        }
                        */
                    }}
                >
                    <Ionicons name='ios-close-circle' color="grey" size={20} />
                </TouchableOpacity>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
        // marginTop: 63,
        flex: 1
    },
    sectionHeader: {
        justifyContent: 'center',
        top: -1,
        paddingLeft: 20,
    },
    sectionHeaderText: {
        justifyContent: 'center',
        fontSize: 16,
        color: 'rgb(0,0,0)'
    },
    sectionItemText: {
        color: 'rgb(153, 205, 55)',
        fontSize: 12,
    },
    cell: {
        paddingLeft: 20,
        paddingRight: 31,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    separator: {
        backgroundColor: 'rgb(0, 0, 0)',
        height: 0.5,
        opacity: 0.05,
        marginLeft: 20,
        marginRight: 25,
    },
    cellTitle: {
        fontSize: 16,
        flex: 1,
        paddingRight: 10,
        color: 'rgb(0, 0, 0)',
    },
    cellLabel: {
        fontSize: 16,
        color: 'rgb(0, 0, 0)',
    },
    searchInput: {
        backgroundColor: 'white'
    },

    textInputContainer: {
        height: 52,
        // backgroundColor: '#C9C9CE',
        // borderTopColor: '#7e7e7e',
        // borderBottomColor: '#b5b5b5',
        borderTopWidth: 1 / PixelRatio.get(),
        borderBottomWidth: 1 / PixelRatio.get(),
        flexDirection: 'row',

        backgroundColor: 'transparent',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    textInput: {
        marginTop: 8,
        marginLeft: 8,
        marginRight: 42,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: 'transparent',

        // width: '100%',
        flex: 1,
        height: 40,
        fontSize: 24,
        color: "white",
        fontFamily: "Roboto-Regular"
    }
});

CountryCodeList.defaultProps = {
    headerBackground: 'rgb(245, 245, 245)',
    cellHeight: 44.5,
    sectionHeaderHeight: 30,
    onClickCell: () => { }
};

// module.exports = CountryCodeList;
