import React from 'react';
import moment from "moment";
import Qs from 'qs';

const id = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);


export default class Util extends React.Component {

    static uid(): string {
        // a685d8a3-4ec0-4d5d-b334-1146865e7b95
        return `${id()}${id()}-${id()}-${id()}-${id()}-${id()}${id()}${id()}`;
    }

    static getImageType(ext) {
        switch (ext.toLowerCase()) {
            case 'gif':
                return 'image/gif';

            case 'png':
                return 'image/png';

            case 'jpg':
                // return 'image/jpg';
                return 'image/jpeg';

            case 'jpeg':
                return 'image/jpeg';

            case 'bmp':
                return 'image/bmp';

            default:
                return '';
        }
    }

    static isImage(ext) {
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'png':
                //etc
                return true;
        }

        return false;
    }

    static reverseSnapshot(snapshot) {
        let reversed = [];

        snapshot.forEach(child => {
            reversed.unshift(child);
        });

        return reversed;
    }

    static getTime(timestamp) {
        let time;

        const today = moment();
        const yesterday = moment().subtract(1, 'day');

        if (moment(timestamp).isSame(today, 'day')) {
            time = moment(timestamp).format('h:mm a');
        } else if (moment(timestamp).isSame(yesterday, 'day')) {
            time = 'Yesterday';
        } else {
            time = moment(timestamp).fromNow();

            if (time === 'a day ago') time = 'Yesterday';
        }

        return time;
    }

    static getRandomNumber() {
        const max = Number.MIN_SAFE_INTEGER;
        const min = Number.MAX_SAFE_INTEGER;

        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static getBirthday(date) {
        let birthday = 'DDMMYYYY';

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        let _day = '';
        if (day < 10) {
            _day = '0' + day.toString();
        } else {
            _day = day.toString();
        }

        let _month = '';
        switch (month) {
            case 0: _month = '01'; break;
            case 1: _month = '02'; break;
            case 2: _month = '03'; break;
            case 3: _month = '04'; break;
            case 4: _month = '05'; break;
            case 5: _month = '06'; break;
            case 6: _month = '07'; break;
            case 7: _month = '08'; break;
            case 8: _month = '09'; break;
            case 9: _month = '10'; break;
            case 10: _month = '11'; break;
            case 11: _month = '12'; break;
        }

        birthday = _day + _month + year.toString();

        return birthday;
    }

    static getBust(breats) {
        let bust = '';

        const words = breats.split(' ');

        bust = words[0];

        return bust;
    }

    static getHeight(height) {
        let value = 0; // number

        const words = height.split(' ');

        value = parseInt(words[0]);

        return value;
    }

    static getWeight(weight) {
        let value = 0; // number

        const words = weight.split(' ');

        value = parseInt(words[0]);

        return value;
    }

    static getAge(birthday) { // 'DDMMYYYY'
        let age = 0;

        const dold = parseInt(birthday.substring(0, 2));
        const mold = parseInt(birthday.substring(2, 4));
        const yold = parseInt(birthday.substring(4, 8));

        const now = new Date();
        const ynew = now.getFullYear();
        const mnew = now.getMonth();
        const dnew = now.getDate();

        let years = (ynew - yold);
        if (mnew < mold || mnew == mold && dnew < dold) {
            years--;
        }

        age = years;

        return age;
    }

    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    static isFederation(code) {
        let value = false;
        switch (code) {
            case 'AR':
            case 'AU':
            case 'AT':
            case 'BE':
            case 'BA':
            case 'BR':
            case 'CA':
            case 'KM':
            case 'ET':
            case 'DE':
            case 'IN':
            case 'IQ':
            case 'MY':
            case 'MX':
            case 'FM':
            case 'NP':
            case 'NG':
            case 'PK':
            case 'RU':
            case 'KN':
            case 'SO':
            case 'SS':
            case 'SD':
            case 'CH':
            case 'AE':
            case 'US':
            case 'VE':
                value = true;
                break;
        }

        return value;
    }

    static async getPlaceId(input, key, callback) {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;

            if (request.status === 200) {
                const responseJSON = JSON.parse(request.responseText);

                // console.log('responseJSON', responseJSON);

                // if (typeof responseJSON.predictions !== 'undefined') {
                if (typeof responseJSON.results !== 'undefined') {
                    /*
                    const results = responseJSON.predictions; // array
                    console.log('getPlaceId predictions', results);
                    const result = results[0]; // map object
                    console.log('getPlaceId array 0', result);

                    callback(result);
                    */

                    let result = null;

                    // console.log('getPlaceId pre results', responseJSON.results);
                    const filter = ['locality', 'administrative_area_level_3'];
                    const results = Util._filterResultsByTypes(responseJSON.results, filter);
                    console.log('getPlaceId after results', results);

                    // add 'street_address' filter
                    if (results.length != 0) {
                        result = results[0];
                    } else {
                        const filter2 = ['street_address'];
                        const results2 = Util._filterResultsByTypes(responseJSON.results, filter2);

                        if (results2.length != 0) {
                            result = results2[0];
                        } else {
                            // ToDo: just use the origin
                            result = responseJSON.results[0];
                        }
                    }

                    callback(result);
                }

                if (typeof responseJSON.error_message !== 'undefined') {
                    console.warn('getPlaceId (google places autocomplete)' + responseJSON.error_message);
                }
            }
        };

        // request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURIComponent(input) + '&' + Qs.stringify(query));
        const latitude = input.lat;
        const longitude = input.lng;
        const url = 'https://maps.googleapis.com/maps/api/geocode/json?' + Qs.stringify({
            latlng: latitude + ',' + longitude,
            key: key
            // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
        });
        request.open('GET', url);
        request.send();

        // get detail
        /*
        request.open('GET', 'https://maps.googleapis.com/maps/api/place/details/json?' + Qs.stringify({
            key: this.props.query.key,
            placeid: rowData.place_id,
            language: this.props.query.language
        }));

        request.send();
        */
    }

    static _filterResultsByTypes = (unfilteredResults, types) => {
        if (types.length === 0) return unfilteredResults;

        const results = [];
        for (let i = 0; i < unfilteredResults.length; i++) {
            let found = false;

            for (let j = 0; j < types.length; j++) {
                if (unfilteredResults[i].types.indexOf(types[j]) !== -1) {
                    found = true;
                    break;
                }
            }

            if (found === true) {
                results.push(unfilteredResults[i]);
            }
        }

        return results;
    }

    static numberWithCommas(value) {
        let len, point, str;

        const num = value.toString();

        point = num.length % 3;
        len = num.length;

        str = num.substring(0, point);
        while (point < len) {
            if (str != "") str += ",";
            str += num.substring(point, point + 3);
            point += 3;
        }

        return str;
    }
}
