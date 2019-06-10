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

    static getJoinedDate(timestamp) { // 'Joined in September 26, 2018'
        const date = new Date(timestamp);
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();

        let _month = '';
        switch (m) {
            case 0: _month = 'January'; break;
            case 1: _month = 'February'; break;
            case 2: _month = 'March'; break;
            case 3: _month = 'April'; break;
            case 4: _month = 'May'; break;
            case 5: _month = 'June'; break;
            case 6: _month = 'July'; break;
            case 7: _month = 'August'; break;
            case 8: _month = 'September'; break;
            case 9: _month = 'October'; break;
            case 10: _month = 'November'; break;
            case 11: _month = 'December'; break;
        }

        return 'Joined in ' + _month + ' ' + d.toString() + ', ' + y.toString();
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

    static getBirthdayText(date) { // '03111982' -> '03 NOV 1982'
        const _day = date.substring(0, 2);
        const month = parseInt(date.substring(2, 4)) - 1;
        const _year = date.substring(4, 8);

        let _month = '';
        switch (month) {
            case 0: _month = 'JAN'; break;
            case 1: _month = 'FEB'; break;
            case 2: _month = 'MAR'; break;
            case 3: _month = 'APR'; break;
            case 4: _month = 'MAY'; break;
            case 5: _month = 'JUN'; break;
            case 6: _month = 'JUL'; break;
            case 7: _month = 'AUG'; break;
            case 8: _month = 'SEP'; break;
            case 9: _month = 'OCT'; break;
            case 10: _month = 'NOV'; break;
            case 11: _month = 'DEC'; break;
        }

        const text = _day + ' ' + _month + ' ' + _year;

        return text;
    }

    static getDate(date) { // '03111982' -> new Date(1982, 11, 3)
        const day = parseInt(date.substring(0, 2));
        const month = parseInt(date.substring(2, 4)) - 1;
        const year = parseInt(date.substring(4, 8));

        return new Date(year, month, day);
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

    /*
    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    */

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

    static async getPlaceId(input, key, callback) { // get city
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;

            if (request.status === 200) {
                const responseJSON = JSON.parse(request.responseText);

                // console.log('responseJSON', responseJSON);

                if (typeof responseJSON.results !== 'undefined') {
                    console.log('getPlaceId pre results', responseJSON.results);

                    let results = null;
                    const filter1 = ["colloquial_area", "locality", "political"];
                    results = Util._filterResultsByTypes(responseJSON.results, filter1);

                    if (results.length === 0) {
                        const filter2 = ["locality", "political"];
                        results = Util._filterResultsByTypes(responseJSON.results, filter2);
                    }

                    if (results.length === 0) {
                        const filter3 = ['locality', 'administrative_area_level_3'];
                        results = Util._filterResultsByTypes(responseJSON.results, filter3);
                    }

                    if (results.length === 0) {
                        const filter4 = ['street_address'];
                        results = Util._filterResultsByTypes(responseJSON.results, filter4);
                    }

                    // console.log('getPlaceId after results', results);

                    let result = null;
                    if (results.length === 0) {
                        // this should never happen
                        console.log('Util.getPlaceId', 'this should never happen!!!');

                        // just use the origin
                        result = responseJSON.results[0];
                    } else {
                        result = results[0]; // select the first one
                    }

                    callback(result);
                }

                if (typeof responseJSON.error_message !== 'undefined') {
                    console.log('getPlaceId (google places autocomplete)' + responseJSON.error_message);
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
        if (types.length === 0) return unfilteredResults; // never happen

        const results = [];

        for (let i = 0; i < unfilteredResults.length; i++) {
            let found = true;

            for (let j = 0; j < types.length; j++) {
                if (unfilteredResults[i].types.indexOf(types[j]) === -1) {
                    found = false;
                    break;
                }
            }

            if (found === true) {
                results.push(unfilteredResults[i]);
                break;
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

    static getCountyCode(country) {
        let code = null;

        const array = [
            {
                code: "AF",
                name: "Afghanistan"
            },
            {
                code: "AX",
                name: "Aland Islands"
            },
            {
                code: "AL",
                name: "Albania"
            },
            {
                code: "DZ",
                name: "Algeria"
            },
            {
                code: "AS",
                name: "American Samoa"
            },
            {
                code: "AD",
                name: "Andorra"
            },
            {
                code: "AO",
                name: "Angola"
            },
            {
                code: "AI",
                name: "Anguilla"
            },
            {
                code: "AQ",
                name: "Antarctica"
            },
            {
                code: "AG",
                name: "Antigua and Barbuda"
            },
            {
                code: "AR",
                name: "Argentina"
            },
            {
                code: "AM",
                name: "Armenia"
            },
            {
                code: "AW",
                name: "Aruba"
            },
            {
                code: "AU",
                name: "Australia"
            },
            {
                code: "AT",
                name: "Austria"
            },
            {
                code: "AZ",
                name: "Azerbaijan"
            },

            {
                code: "BS",
                name: "Bahamas"
            },
            {
                code: "BH",
                name: "Bahrain"
            },
            {
                code: "BD",
                name: "Bangladesh"
            },
            {
                code: "BB",
                name: "Barbados"
            },
            {
                code: "BY",
                name: "Belarus"
            },
            {
                code: "BE",
                name: "Belgium"
            },
            {
                code: "BZ",
                name: "Belize"
            },
            {
                code: "BJ",
                name: "Benin"
            },
            {
                code: "BM",
                name: "Bermuda"
            },
            {
                code: "BT",
                name: "Bhutan"
            },
            {
                code: "BO",
                name: "Bolivia, Plurinational State of"
            },
            {
                code: "BQ",
                name: "Bonaire, Sint Eustatius and Saba"
            },
            {
                code: "BA",
                name: "Bosnia and Herzegovina"
            },
            {
                code: "BW",
                name: "Botswana"
            },
            {
                code: "BV",
                name: "Bouvet Island"
            },
            {
                code: "BR",
                name: "Brazil"
            },
            {
                code: "IO",
                name: "British Indian Ocean Territory"
            },
            {
                code: "BN",
                name: "Brunei Darussalam"
            },
            {
                code: "BG",
                name: "Bulgaria"
            },
            {
                code: "BF",
                name: "Burkina Faso"
            },
            {
                code: "BI",
                name: "Burundi"
            },

            {
                code: "KH",
                name: "Cambodia"
            },
            {
                code: "CM",
                name: "Cameroon"
            },
            {
                code: "CA",
                name: "Canada"
            },
            {
                code: "CV",
                name: "Cape Verde"
            },
            {
                code: "KY",
                name: "Cayman Islands"
            },
            {
                code: "CF",
                name: "Central African Republic"
            },
            {
                code: "TD",
                name: "Chad"
            },
            {
                code: "CL",
                name: "Chile"
            },
            {
                code: "CN",
                name: "China"
            },
            {
                code: "CX",
                name: "Christmas Island"
            },
            {
                code: "CC",
                name: "Cocos (Keeling) Islands"
            },
            {
                code: "CO",
                name: "Colombia"
            },
            {
                code: "KM",
                name: "Comoros"
            },
            {
                code: "CG",
                name: "Congo"
            },
            {
                code: "CD",
                name: "Congo, the Democratic Republic of the"
            },
            {
                code: "CK",
                name: "Cook Islands"
            },
            {
                code: "CR",
                name: "Costa Rica"
            },
            {
                code: "CI",
                name: "Côte d'Ivoire"
            },
            {
                code: "HR",
                name: "Croatia"
            },
            {
                code: "CU",
                name: "Cuba"
            },
            {
                code: "CW",
                name: "Curaçao"
            },
            {
                code: "CY",
                name: "Cyprus"
            },
            {
                code: "CZ",
                name: "Czech Republic"
            },

            {
                code: "DK",
                name: "Denmark"
            },
            {
                code: "DJ",
                name: "Djibouti"
            },
            {
                code: "DM",
                name: "Dominica"
            },
            {
                code: "DO",
                name: "Dominican Republic"
            },

            {
                code: "EC",
                name: "Ecuador"
            },
            {
                code: "EG",
                name: "Egypt"
            },
            {
                code: "SV",
                name: "El Salvador"
            },
            {
                code: "GQ",
                name: "Equatorial Guinea"
            },
            {
                code: "ER",
                name: "Eritrea"
            },
            {
                code: "EE",
                name: "Estonia"
            },
            {
                code: "ET",
                name: "Ethiopia"
            },

            {
                code: "FK",
                name: "Falkland Islands (Malvinas)"
            },
            {
                code: "FO",
                name: "Faroe Islands"
            },
            {
                code: "FJ",
                name: "Fiji"
            },
            {
                code: "FI",
                name: "Finland"
            },
            {
                code: "FR",
                name: "France"
            },
            {
                code: "GF",
                name: "French Guiana"
            },
            {
                code: "PF",
                name: "French Polynesia"
            },
            {
                code: "TF",
                name: "French Southern Territories"
            },

            {
                code: "GA",
                name: "Gabon"
            },
            {
                code: "GM",
                name: "Gambia"
            },
            {
                code: "GE",
                name: "Georgia"
            },
            {
                code: "DE",
                name: "Germany"
            },
            {
                code: "GH",
                name: "Ghana"
            },
            {
                code: "GI",
                name: "Gibraltar"
            },
            {
                code: "GR",
                name: "Greece"
            },
            {
                code: "GL",
                name: "Greenland"
            },
            {
                code: "GD",
                name: "Grenada"
            },
            {
                code: "GP",
                name: "Guadeloupe"
            },
            {
                code: "GU",
                name: "Guam"
            },
            {
                code: "GT",
                name: "Guatemala"
            },
            {
                code: "GG",
                name: "Guernsey"
            },
            {
                code: "GN",
                name: "Guinea"
            },
            {
                code: "GW",
                name: "Guinea-Bissau"
            },
            {
                code: "GY",
                name: "Guyana"
            },

            {
                code: "HT",
                name: "Haiti"
            },
            {
                code: "HM",
                name: "Heard Island and McDonald Islands"
            },
            {
                code: "VA",
                name: "Holy See (Vatican City State)"
            },
            {
                code: "HN",
                name: "Honduras"
            },
            {
                code: "HK",
                name: "Hong Kong"
            },
            {
                code: "HU",
                name: "Hungary"
            },

            {
                code: "IS",
                name: "Iceland"
            },
            {
                code: "IN",
                name: "India"
            },
            {
                code: "ID",
                name: "Indonesia"
            },
            {
                code: "IR",
                name: "Iran, Islamic Republic of"
            },
            {
                code: "IQ",
                name: "Iraq"
            },
            {
                code: "IE",
                name: "Ireland"
            },
            {
                code: "IM",
                name: "Isle of Man"
            },
            {
                code: "IL",
                name: "Israel"
            },
            {
                code: "IT",
                name: "Italy"
            },

            {
                code: "JM",
                name: "Jamaica"
            },
            {
                code: "JP",
                name: "Japan"
            },
            {
                code: "JE",
                name: "Jersey"
            },
            {
                code: "JO",
                name: "Jordan"
            },

            {
                code: "KZ",
                name: "Kazakhstan"
            },
            {
                code: "KE",
                name: "Kenya"
            },
            {
                code: "KI",
                name: "Kiribati"
            },
            {
                code: "KP",
                name: "Korea, Democratic People's Republic of"
            },
            {
                code: "KR",
                name: "Korea, Republic of"
            },
            {
                code: "KW",
                name: "Kuwait"
            },
            {
                code: "KG",
                name: "Kyrgyzstan"
            },

            {
                code: "LA",
                name: "Lao People's Democratic Republic"
            },
            {
                code: "LV",
                name: "Latvia"
            },
            {
                code: "LB",
                name: "Lebanon"
            },
            {
                code: "LS",
                name: "Lesotho"
            },
            {
                code: "LR",
                name: "Liberia"
            },
            {
                code: "LY",
                name: "Libya"
            },
            {
                code: "LI",
                name: "Liechtenstein"
            },
            {
                code: "LT",
                name: "Lithuania"
            },
            {
                code: "LU",
                name: "Luxembourg"
            },

            {
                code: "MO",
                name: "Macao"
            },
            {
                code: "MK",
                name: "Macedonia, the Former Yugoslav Republic of"
            },
            {
                code: "MG",
                name: "Madagascar"
            },
            {
                code: "MW",
                name: "Malawi"
            },
            {
                code: "MY",
                name: "Malaysia"
            },
            {
                code: "MV",
                name: "Maldives"
            },
            {
                code: "ML",
                name: "Mali"
            },
            {
                code: "MT",
                name: "Malta"
            },
            {
                code: "MH",
                name: "Marshall Islands"
            },
            {
                code: "MQ",
                name: "Martinique"
            },
            {
                code: "MR",
                name: "Mauritania"
            },
            {
                code: "MU",
                name: "Mauritius"
            },
            {
                code: "YT",
                name: "Mayotte"
            },
            {
                code: "MX",
                name: "Mexico"
            },
            {
                code: "FM",
                name: "Micronesia, Federated States of"
            },
            {
                code: "MD",
                name: "Moldova, Republic of"
            },
            {
                code: "MC",
                name: "Monaco"
            },
            {
                code: "MN",
                name: "Mongolia"
            },
            {
                code: "ME",
                name: "Montenegro"
            },
            {
                code: "MS",
                name: "Montserrat"
            },
            {
                code: "MA",
                name: "Morocco"
            },
            {
                code: "MZ",
                name: "Mozambique"
            },
            {
                code: "MM",
                name: "Myanmar"
            },

            {
                code: "NA",
                name: "Namibia"
            },
            {
                code: "NR",
                name: "Nauru"
            },
            {
                code: "NP",
                name: "Nepal"
            },
            {
                code: "NL",
                name: "Netherlands"
            },
            {
                code: "NC",
                name: "New Caledonia"
            },
            {
                code: "NZ",
                name: "New Zealand"
            },
            {
                code: "NI",
                name: "Nicaragua"
            },
            {
                code: "NE",
                name: "Niger"
            },
            {
                code: "NG",
                name: "Nigeria"
            },
            {
                code: "NU",
                name: "Niue"
            },
            {
                code: "NF",
                name: "Norfolk Island"
            },
            {
                code: "MP",
                name: "Northern Mariana Islands"
            },
            {
                code: "NO",
                name: "Norway"
            },

            {
                code: "OM",
                name: "Oman"
            },

            {
                code: "PK",
                name: "Pakistan"
            },
            {
                code: "PW",
                name: "Palau"
            },
            {
                code: "PS",
                name: "Palestine, State of"
            },
            {
                code: "PA",
                name: "Panama"
            },
            {
                code: "PG",
                name: "Papua New Guinea"
            },
            {
                code: "PY",
                name: "Paraguay"
            },
            {
                code: "PE",
                name: "Peru"
            },
            {
                code: "PH",
                name: "Philippines"
            },
            {
                code: "PN",
                name: "Pitcairn"
            },
            {
                code: "PL",
                name: "Poland"
            },
            {
                code: "PT",
                name: "Portugal"
            },
            {
                code: "PR",
                name: "Puerto Rico"
            },

            {
                code: "QA",
                name: "Qatar"
            },

            {
                code: "RE",
                name: "Réunion"
            },
            {
                code: "RO",
                name: "Romania"
            },
            {
                code: "RU",
                name: "Russian Federation"
            },
            {
                code: "RW",
                name: "Rwanda"
            },

            {
                code: "BL",
                name: "Saint Barthélemy"
            },
            {
                code: "SH",
                name: "Saint Helena, Ascension and Tristan da Cunha"
            },
            {
                code: "KN",
                name: "Saint Kitts and Nevis"
            },
            {
                code: "LC",
                name: "Saint Lucia"
            },
            {
                code: "MF",
                name: "Saint Martin (French part)"
            },
            {
                code: "PM",
                name: "Saint Pierre and Miquelon"
            },
            {
                code: "VC",
                name: "Saint Vincent and the Grenadines"
            },
            {
                code: "WS",
                name: "Samoa"
            },
            {
                code: "SM",
                name: "San Marino"
            },
            {
                code: "ST",
                name: "Sao Tome and Principe"
            },
            {
                code: "SA",
                name: "Saudi Arabia"
            },
            {
                code: "SN",
                name: "Senegal"
            },
            {
                code: "RS",
                name: "Serbia"
            },
            {
                code: "SC",
                name: "Seychelles"
            },
            {
                code: "SL",
                name: "Sierra Leone"
            },
            {
                code: "SG",
                name: "Singapore"
            },
            {
                code: "SX",
                name: "Sint Maarten (Dutch part)"
            },
            {
                code: "SK",
                name: "Slovakia"
            },
            {
                code: "SI",
                name: "Slovenia"
            },
            {
                code: "SB",
                name: "Solomon Islands"
            },
            {
                code: "SO",
                name: "Somalia"
            },
            {
                code: "ZA",
                name: "South Africa"
            },
            {
                code: "GS",
                name: "South Georgia and the South Sandwich Islands"
            },
            {
                code: "SS",
                name: "South Sudan"
            },
            {
                code: "ES",
                name: "Spain"
            },
            {
                code: "LK",
                name: "Sri Lanka"
            },
            {
                code: "SD",
                name: "Sudan"
            },
            {
                code: "SR",
                name: "Suriname"
            },
            {
                code: "SJ",
                name: "Svalbard and Jan Mayen"
            },
            {
                code: "SZ",
                name: "Swaziland"
            },
            {
                code: "SE",
                name: "Sweden"
            },
            {
                code: "CH",
                name: "Switzerland"
            },
            {
                code: "SY",
                name: "Syrian Arab Republic"
            },

            {
                code: "TW",
                name: "Taiwan, Province of China"
            },
            {
                code: "TJ",
                name: "Tajikistan"
            },
            {
                code: "TZ",
                name: "Tanzania, United Republic of"
            },
            {
                code: "TH",
                name: "Thailand"
            },
            {
                code: "TL",
                name: "Timor-Leste"
            },
            {
                code: "TG",
                name: "Togo"
            },
            {
                code: "TK",
                name: "Tokelau"
            },
            {
                code: "TO",
                name: "Tonga"
            },
            {
                code: "TT",
                name: "Trinidad and Tobago"
            },
            {
                code: "TN",
                name: "Tunisia"
            },
            {
                code: "TR",
                name: "Turkey"
            },
            {
                code: "TM",
                name: "Turkmenistan"
            },
            {
                code: "TC",
                name: "Turks and Caicos Islands"
            },
            {
                code: "TV",
                name: "Tuvalu"
            },

            {
                code: "UG",
                name: "Uganda"
            },
            {
                code: "UA",
                name: "Ukraine"
            },
            {
                code: "AE",
                name: "United Arab Emirates"
            },
            {
                code: "GB",
                name: "United Kingdom"
            },
            {
                code: "US",
                name: "United States"
            },
            {
                code: "UM",
                name: "United States Minor Outlying Islands"
            },
            {
                code: "UY",
                name: "Uruguay"
            },
            {
                code: "UZ",
                name: "Uzbekistan"
            },

            {
                code: "VU",
                name: "Vanuatu"
            },
            {
                code: "VE",
                name: "Venezuela, Bolivarian Republic of"
            },
            {
                code: "VN",
                name: "Viet Nam"
            },
            {
                code: "VG",
                name: "Virgin Islands, British"
            },
            {
                code: "VI",
                name: "Virgin Islands, U.S."
            },

            {
                code: "WF",
                name: "Wallis and Futuna"
            },
            {
                code: "EH",
                name: "Western Sahara"
            },

            {
                code: "YE",
                name: "Yemen"
            },

            {
                code: "ZM",
                name: "Zambia"
            },
            {
                code: "ZW",
                name: "Zimbabwe"
            }
        ];

        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            if (item.name === country) {
                code = item.code;
                break;
            }
        }

        return code;
    }

    /*
    static isSameDay(date1, date2) {
        const y1 = date1.getFullYear();
        const d1 = date1.getDate();

        const y2 = date2.getFullYear();
        const d2 = date2.getDate();

        if (y1 !== y2) return false;
        if (d1 !== d2) return false;

        return true;
    }
    */

    static getDistance(location1, location2) {
        // location1
        // location1.longitude, location1.latitude

        // location2
        // {"timestamp":1557984891181,"mocked":false,"coords":{"heading":0,"longitude":127.024578,"speed":0,"altitude":101.0999984741211,"latitude":37.4652717,"accuracy":17.857999801635742}}

        let distance = '? km away';

        if (!location2) return distance;

        let lat1, lon1, lat2, lon2, unit;
        lat1 = location1.latitude;
        lon1 = location1.longitude;
        lat2 = location2.coords.latitude;
        lon2 = location2.coords.longitude;
        unit = "K";

        /*
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit === "K") {
            dist = dist * 1.609344;
            distance = dist + ' km away';
        } else if (unit === "M") {
            dist = dist * 0.8684;
            distance = dist + ' m away';
        }
        */

        var R = 6371; // Radius of the earth in km
        var dLat = Util.deg2rad(lat2 - lat1);
        var dLon = Util.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Util.deg2rad(lat1)) * Math.cos(Util.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km

        distance = d.toFixed(0).toString() + ' km away';

        if (distance === '0 km away') {
            distance = 'less than a kilometer away';
        }

        return distance;
    }

    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    static getFacebookProvider(providers) {
        if (!providers) return null;

        if (providers.length === 0) return null;

        let facebook = null;

        for (let i = 0; i < providers.length; i++) {
            const provider = providers[i];

            if (provider.providerId === "facebook.com") {
                facebook = provider;
                break;
            }
        }

        return facebook;
    }

    static getDarkColor() {
        var letters = '456789'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 6)];
        }

        return color;
    }

    static getAvatarName(name) {
        if (!name || name.length === 0) return null;

        let avatarName = '';

        let words = name.split(' ');
        if (words.length === 1) {
            avatarName = name;
        } else {
            for (let i = 0; i < words.length; i++) {
                avatarName += words[i][0];
            }
        }

        return avatarName;
    }
}
