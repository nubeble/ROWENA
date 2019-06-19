export const getAlphabet = () => {
    let data =
    /*
    {
        A:
            [{ name: 'Afghanistan', code: '+93' },
            { name: 'Aland Islands', code: '+358' },
            { name: 'Albania', code: '+355' },
            { name: 'Algeria', code: '+213' },
            { name: 'American Samoa', code: '+1684' },
            { name: 'Andorra', code: '+376' },
            { name: 'Angola', code: '+244' },
            { name: 'Anguilla', code: '+1264' },
            { name: 'Antarctica', code: '+672' },
            { name: 'Antigua and Barbuda', code: '+1268' },
            { name: 'Argentina', code: '+54' },
            { name: 'Armenia', code: '+374' },
            { name: 'Aruba', code: '+297' },
            { name: 'Australia', code: '+61' },
            { name: 'Austria', code: '+43' },
            { name: 'Azerbaijan', code: '+994' }],
        B:
            [{ name: 'Bahamas', code: '+1242' },
            { name: 'Bahrain', code: '+973' },
            { name: 'Bangladesh', code: '+880' },
            { name: 'Barbados', code: '+1246' },
            { name: 'Belarus', code: '+375' },
            { name: 'Belgium', code: '+32' },
            { name: 'Belize', code: '+501' },
            { name: 'Benin', code: '+229' },
            { name: 'Bermuda', code: '+1441' },
            { name: 'Bhutan', code: '+975' },
            { name: 'Bolivia, Plurinational State of', code: '+591' },
            { name: 'Bosnia and Herzegovina', code: '+387' },
            { name: 'Botswana', code: '+267' },
            { name: 'Brazil', code: '+55' },
            { name: 'British Indian Ocean Territory', code: '+246' },
            { name: 'Brunei Darussalam', code: '+673' },
            { name: 'Bulgaria', code: '+359' },
            { name: 'Burkina Faso', code: '+226' },
            { name: 'Burundi', code: '+257' }],
        C:
            [{ name: 'Cambodia', code: '+855' },
            { name: 'Cameroon', code: '+237' },
            { name: 'Canada', code: '+1' },
            { name: 'Cape Verde', code: '+238' },
            { name: 'Cayman Islands', code: '+ 345' },
            { name: 'Central African Republic', code: '+236' },
            { name: 'Chad', code: '+235' },
            { name: 'Chile', code: '+56' },
            { name: 'China', code: '+86' },
            { name: 'Christmas Island', code: '+61' },
            { name: 'Cocos (Keeling) Islands', code: '+61' },
            { name: 'Colombia', code: '+57' },
            { name: 'Comoros', code: '+269' },
            { name: 'Congo', code: '+242' },
            {
                name: 'Congo, The Democratic Republic of the Congo',
                code: '+243'
            },
            { name: 'Cook Islands', code: '+682' },
            { name: 'Costa Rica', code: '+506' },
            { name: 'Cote d\'Ivoire', code: '+225' },
            { name: 'Croatia', code: '+385' },
            { name: 'Cuba', code: '+53' },
            { name: 'Cyprus', code: '+357' },
            { name: 'Czech Republic', code: '+420' }],
        D:
            [{ name: 'Denmark', code: '+45' },
            { name: 'Djibouti', code: '+253' },
            { name: 'Dominica', code: '+1767' },
            { name: 'Dominican Republic', code: '+1849' }],
        E:
            [{ name: 'Ecuador', code: '+593' },
            { name: 'Egypt', code: '+20' },
            { name: 'El Salvador', code: '+503' },
            { name: 'Equatorial Guinea', code: '+240' },
            { name: 'Eritrea', code: '+291' },
            { name: 'Estonia', code: '+372' },
            { name: 'Ethiopia', code: '+251' }],
        F:
            [{ name: 'Falkland Islands (Malvinas)', code: '+500' },
            { name: 'Faroe Islands', code: '+298' },
            { name: 'Fiji', code: '+679' },
            { name: 'Finland', code: '+358' },
            { name: 'France', code: '+33' },
            { name: 'French Guiana', code: '+594' },
            { name: 'French Polynesia', code: '+689' }],
        G:
            [{ name: 'Gabon', code: '+241' },
            { name: 'Gambia', code: '+220' },
            { name: 'Georgia', code: '+995' },
            { name: 'Germany', code: '+49' },
            { name: 'Ghana', code: '+233' },
            { name: 'Gibraltar', code: '+350' },
            { name: 'Greece', code: '+30' },
            { name: 'Greenland', code: '+299' },
            { name: 'Grenada', code: '+1473' },
            { name: 'Guadeloupe', code: '+590' },
            { name: 'Guam', code: '+1671' },
            { name: 'Guatemala', code: '+502' },
            { name: 'Guernsey', code: '+44' },
            { name: 'Guinea', code: '+224' },
            { name: 'Guinea-Bissau', code: '+245' },
            { name: 'Guyana', code: '+595' }],
        H:
            [{ name: 'Haiti', code: '+509' },
            { name: 'Holy See (Vatican City State)', code: '+379' },
            { name: 'Honduras', code: '+504' },
            { name: 'Hong Kong', code: '+852' },
            { name: 'Hungary', code: '+36' }],
        I:
            [{ name: 'Iceland', code: '+354' },
            { name: 'India', code: '+91' },
            { name: 'Indonesia', code: '+62' },
            { name: 'Iran, Islamic Republic of Persian Gulf', code: '+98' },
            { name: 'Iraq', code: '+964' },
            { name: 'Ireland', code: '+353' },
            { name: 'Isle of Man', code: '+44' },
            { name: 'Israel', code: '+972' },
            { name: 'Italy', code: '+39' }],
        J:
            [{ name: 'Jamaica', code: '+1876' },
            { name: 'Japan', code: '+81' },
            { name: 'Jersey', code: '+44' },
            { name: 'Jordan', code: '+962' }],
        K:
            [{ name: 'Kazakhstan', code: '+77' },
            { name: 'Kenya', code: '+254' },
            { name: 'Kiribati', code: '+686' },
            {
                name: 'Korea, Democratic People\'s Republic of Korea',
                code: '+850'
            },
            { name: 'Korea, Republic of South Korea', code: '+82' },
            { name: 'Kuwait', code: '+965' },
            { name: 'Kyrgyzstan', code: '+996' }],
        L:
            [{ name: 'Laos', code: '+856' },
            { name: 'Latvia', code: '+371' },
            { name: 'Lebanon', code: '+961' },
            { name: 'Lesotho', code: '+266' },
            { name: 'Liberia', code: '+231' },
            { name: 'Libyan Arab Jamahiriya', code: '+218' },
            { name: 'Liechtenstein', code: '+423' },
            { name: 'Lithuania', code: '+370' },
            { name: 'Luxembourg', code: '+352' }],
        M:
            [{ name: 'Macau', code: '+853' },
            { name: 'Macedonia', code: '+389' },
            { name: 'Madagascar', code: '+261' },
            { name: 'Malawi', code: '+265' },
            { name: 'Malaysia', code: '+60' },
            { name: 'Maldives', code: '+960' },
            { name: 'Mali', code: '+223' },
            { name: 'Malta', code: '+356' },
            { name: 'Marshall Islands', code: '+692' },
            { name: 'Martinique', code: '+596' },
            { name: 'Mauritania', code: '+222' },
            { name: 'Mauritius', code: '+230' },
            { name: 'Mayotte', code: '+262' },
            { name: 'Mexico', code: '+52' },
            {
                name: 'Micronesia, Federated States of Micronesia',
                code: '+691'
            },
            { name: 'Moldova', code: '+373' },
            { name: 'Monaco', code: '+377' },
            { name: 'Mongolia', code: '+976' },
            { name: 'Montenegro', code: '+382' },
            { name: 'Montserrat', code: '+1664' },
            { name: 'Morocco', code: '+212' },
            { name: 'Mozambique', code: '+258' },
            { name: 'Myanmar', code: '+95' }],
        N:
            [{ name: 'Namibia', code: '+264' },
            { name: 'Nauru', code: '+674' },
            { name: 'Nepal', code: '+977' },
            { name: 'Netherlands', code: '+31' },
            { name: 'Netherlands Antilles', code: '+599' },
            { name: 'New Caledonia', code: '+687' },
            { name: 'New Zealand', code: '+64' },
            { name: 'Nicaragua', code: '+505' },
            { name: 'Niger', code: '+227' },
            { name: 'Nigeria', code: '+234' },
            { name: 'Niue', code: '+683' },
            { name: 'Norfolk Island', code: '+672' },
            { name: 'Northern Mariana Islands', code: '+1670' },
            { name: 'Norway', code: '+47' }],
        O: [{ name: 'Oman', code: '+968' }],
        P:
            [{ name: 'Pakistan', code: '+92' },
            { name: 'Palau', code: '+680' },
            { name: 'Palestinian Territory, Occupied', code: '+970' },
            { name: 'Panama', code: '+507' },
            { name: 'Papua New Guinea', code: '+675' },
            { name: 'Paraguay', code: '+595' },
            { name: 'Peru', code: '+51' },
            { name: 'Philippines', code: '+63' },
            { name: 'Pitcairn', code: '+872' },
            { name: 'Poland', code: '+48' },
            { name: 'Portugal', code: '+351' },
            { name: 'Puerto Rico', code: '+1939' }],
        Q: [{ name: 'Qatar', code: '+974' }],
        R:
            [{ name: 'Romania', code: '+40' },
            { name: 'Russia', code: '+7' },
            { name: 'Rwanda', code: '+250' },
            { name: 'Reunion', code: '+262' }],
        S:
            [{ name: 'Saint Barthelemy', code: '+590' },
            {
                name: 'Saint Helena, Ascension and Tristan Da Cunha',
                code: '+290'
            },
            { name: 'Saint Kitts and Nevis', code: '+1869' },
            { name: 'Saint Lucia', code: '+1758' },
            { name: 'Saint Martin', code: '+590' },
            { name: 'Saint Pierre and Miquelon', code: '+508' },
            { name: 'Saint Vincent and the Grenadines', code: '+1784' },
            { name: 'Samoa', code: '+685' },
            { name: 'San Marino', code: '+378' },
            { name: 'Sao Tome and Principe', code: '+239' },
            { name: 'Saudi Arabia', code: '+966' },
            { name: 'Senegal', code: '+221' },
            { name: 'Serbia', code: '+381' },
            { name: 'Seychelles', code: '+248' },
            { name: 'Sierra Leone', code: '+232' },
            { name: 'Singapore', code: '+65' },
            { name: 'Slovakia', code: '+421' },
            { name: 'Slovenia', code: '+386' },
            { name: 'Solomon Islands', code: '+677' },
            { name: 'Somalia', code: '+252' },
            { name: 'South Africa', code: '+27' },
            { name: 'South Sudan', code: '+211' },
            {
                name: 'South Georgia and the South Sandwich Islands',
                code: '+500'
            },
            { name: 'Spain', code: '+34' },
            { name: 'Sri Lanka', code: '+94' },
            { name: 'Sudan', code: '+249' },
            { name: 'Suriname', code: '+597' },
            { name: 'Svalbard and Jan Mayen', code: '+47' },
            { name: 'Swaziland', code: '+268' },
            { name: 'Sweden', code: '+46' },
            { name: 'Switzerland', code: '+41' },
            { name: 'Syrian Arab Republic', code: '+963' }],
        T:
            [{ name: 'Taiwan', code: '+886' },
            { name: 'Tajikistan', code: '+992' },
            { name: 'Tanzania, United Republic of Tanzania', code: '+255' },
            { name: 'Thailand', code: '+66' },
            { name: 'Timor-Leste', code: '+670' },
            { name: 'Togo', code: '+228' },
            { name: 'Tokelau', code: '+690' },
            { name: 'Tonga', code: '+676' },
            { name: 'Trinidad and Tobago', code: '+1868' },
            { name: 'Tunisia', code: '+216' },
            { name: 'Turkey', code: '+90' },
            { name: 'Turkmenistan', code: '+993' },
            { name: 'Turks and Caicos Islands', code: '+1649' },
            { name: 'Tuvalu', code: '+688' }],
        U:
            [{ name: 'Uganda', code: '+256' },
            { name: 'Ukraine', code: '+380' },
            { name: 'United Arab Emirates', code: '+971' },
            { name: 'United Kingdom', code: '+44' },
            { name: 'United States', code: '+1' },
            { name: 'Uruguay', code: '+598' },
            { name: 'Uzbekistan', code: '+998' }],
        V:
            [{ name: 'Vanuatu', code: '+678' },
            {
                name: 'Venezuela, Bolivarian Republic of Venezuela',
                code: '+58'
            },
            { name: 'Vietnam', code: '+84' },
            { name: 'Virgin Islands, British', code: '+1284' },
            { name: 'Virgin Islands, U.S.', code: '+1340' }],
        W: [{ name: 'Wallis and Futuna', code: '+681' }],
        Y: [{ name: 'Yemen', code: '+967' }],
        Z:
            [{ name: 'Zambia', code: '+260' },
            { name: 'Zimbabwe', code: '+263' }]
    };
    */
    {
        A: [
            {
                dial: '+93',
                code: "AF",
                name: "Afghanistan"
            },
            {
                dial: '+358',
                code: "AX",
                // name: "Åland Islands"
                name: "Aland Islands"
            },
            {
                dial: '+355',
                code: "AL",
                name: "Albania"
            },
            {
                dial: '+213',
                code: "DZ",
                name: "Algeria"
            },
            {
                dial: '+1684',
                code: "AS",
                name: "American Samoa"
            },
            {
                dial: '+376',
                code: "AD",
                name: "Andorra"
            },
            {
                dial: '+244',
                code: "AO",
                name: "Angola"
            },
            {
                dial: '+1264',
                code: "AI",
                name: "Anguilla"
            },
            {
                dial: '+672',
                code: "AQ",
                name: "Antarctica"
            },
            {
                dial: '+1',
                code: "AG",
                name: "Antigua and Barbuda"
            },
            {
                dial: '+54',
                code: "AR",
                name: "Argentina"
            },
            {
                dial: '+374',
                code: "AM",
                name: "Armenia"
            },
            {
                dial: '+297',
                code: "AW",
                name: "Aruba"
            },
            {
                dial: '+61',
                code: "AU",
                name: "Australia"
            },
            {
                dial: '+43',
                code: "AT",
                name: "Austria"
            },
            {
                dial: '+994',
                code: "AZ",
                name: "Azerbaijan"
            }
        ],

        B: [
            {
                dial: '+1242',
                code: "BS",
                name: "Bahamas"
            },
            {
                dial: '+973',
                code: "BH",
                name: "Bahrain"
            },
            {
                dial: '+880',
                code: "BD",
                name: "Bangladesh"
            },
            {
                dial: '+1246',
                code: "BB",
                name: "Barbados"
            },
            {
                dial: '+375',
                code: "BY",
                name: "Belarus"
            },
            {
                dial: '+32',
                code: "BE",
                name: "Belgium"
            },
            {
                dial: '+501',
                code: "BZ",
                name: "Belize"
            },
            {
                dial: '+229',
                code: "BJ",
                name: "Benin"
            },
            {
                dial: '+1441',
                code: "BM",
                name: "Bermuda"
            },
            {
                dial: '+975',
                code: "BT",
                name: "Bhutan"
            },
            {
                dial: '+591',
                code: "BO",
                name: "Bolivia, Plurinational State of"
            },
            {
                dial: '+599',
                code: "BQ",
                name: "Bonaire, Sint Eustatius and Saba"
            },
            {
                dial: '+387',
                code: "BA",
                name: "Bosnia and Herzegovina"
            },
            {
                dial: '+267',
                code: "BW",
                name: "Botswana"
            },
            {
                dial: '+47',
                code: "BV",
                name: "Bouvet Island"
            },
            {
                dial: '+55',
                code: "BR",
                name: "Brazil"
            },
            {
                dial: '+246',
                code: "IO",
                name: "British Indian Ocean Territory"
            },
            {
                dial: '+673',
                code: "BN",
                name: "Brunei Darussalam"
            },
            {
                dial: '+359',
                code: "BG",
                name: "Bulgaria"
            },
            {
                dial: '+226',
                code: "BF",
                name: "Burkina Faso"
            },
            {
                dial: '+257',
                code: "BI",
                name: "Burundi"
            }
        ],
        C: [
            {
                dial: '+855',
                code: "KH",
                name: "Cambodia"
            },
            {
                dial: '+237',
                code: "CM",
                name: "Cameroon"
            },
            {
                dial: '+1',
                code: "CA",
                name: "Canada"
            },
            {
                dial: '+238',
                code: "CV",
                name: "Cape Verde"
            },
            {
                dial: '+ 345',
                code: "KY",
                name: "Cayman Islands"
            },
            {
                dial: '+236',
                code: "CF",
                name: "Central African Republic"
            },
            {
                dial: '+235',
                code: "TD",
                name: "Chad"
            },
            {
                dial: '+56',
                code: "CL",
                name: "Chile"
            },
            {
                dial: '+86',
                code: "CN",
                name: "China"
            },
            {
                dial: '+61',
                code: "CX",
                name: "Christmas Island"
            },
            {
                dial: '+61',
                code: "CC",
                name: "Cocos (Keeling) Islands"
            },
            {
                dial: '+57',
                code: "CO",
                name: "Colombia"
            },
            {
                dial: '+269',
                code: "KM",
                name: "Comoros"
            },
            {
                dial: '+242',
                code: "CG",
                name: "Congo"
            },
            {
                dial: '+243',
                code: "CD",
                name: "Congo, the Democratic Republic of the"
            },
            {
                dial: '+682',
                code: "CK",
                name: "Cook Islands"
            },
            {
                dial: '+506',
                code: "CR",
                name: "Costa Rica"
            },
            {
                dial: '+225',
                code: "CI",
                // name: "Côte d'Ivoire"
                name: "Cote d\'Ivoire"
            },
            {
                dial: '+385',
                code: "HR",
                name: "Croatia"
            },
            {
                dial: '+53',
                code: "CU",
                name: "Cuba"
            },
            {
                dial: '+599',
                code: "CW",
                // name: "Curaçao"
                name: "Curacao"
            },
            {
                dial: '+357',
                code: "CY",
                name: "Cyprus"
            },
            {
                dial: '+420',
                code: "CZ",
                name: "Czech Republic"
            }
        ],
        D: [
            {
                dial: '+45',
                code: "DK",
                name: "Denmark"
            },
            {
                dial: '+253',
                code: "DJ",
                name: "Djibouti"
            },
            {
                dial: '+1767',
                code: "DM",
                name: "Dominica"
            },
            {
                dial: '+1849',
                code: "DO",
                name: "Dominican Republic"
            }
        ],
        E: [
            {
                dial: '+593',
                code: "EC",
                name: "Ecuador"
            },
            {
                dial: '+20',
                code: "EG",
                name: "Egypt"
            },
            {
                dial: '+503',
                code: "SV",
                name: "El Salvador"
            },
            {
                dial: '+240',
                code: "GQ",
                name: "Equatorial Guinea"
            },
            {
                dial: '+291',
                code: "ER",
                name: "Eritrea"
            },
            {
                dial: '+372',
                code: "EE",
                name: "Estonia"
            },
            {
                dial: '+251',
                code: "ET",
                name: "Ethiopia"
            }
        ],
        F: [
            {
                dial: '+500',
                code: "FK",
                name: "Falkland Islands (Malvinas)"
            },
            {
                dial: '+298',
                code: "FO",
                name: "Faroe Islands"
            },
            {
                dial: '+679',
                code: "FJ",
                name: "Fiji"
            },
            {
                dial: '+358',
                code: "FI",
                name: "Finland"
            },
            {
                dial: '+33',
                code: "FR",
                name: "France"
            },
            {
                dial: '+594',
                code: "GF",
                name: "French Guiana"
            },
            {
                dial: '+689',
                code: "PF",
                name: "French Polynesia"
            },
            {
                dial: '+262',
                code: "TF",
                name: "French Southern Territories"
            }
        ],
        G: [
            {
                dial: '+241',
                code: "GA",
                name: "Gabon"
            },
            {
                dial: '+220',
                code: "GM",
                name: "Gambia"
            },
            {
                dial: '+995',
                code: "GE",
                name: "Georgia"
            },
            {
                dial: '+49',
                code: "DE",
                name: "Germany"
            },
            {
                dial: '+233',
                code: "GH",
                name: "Ghana"
            },
            {
                dial: '+350',
                code: "GI",
                name: "Gibraltar"
            },
            {
                dial: '+30',
                code: "GR",
                name: "Greece"
            },
            {
                dial: '+299',
                code: "GL",
                name: "Greenland"
            },
            {
                dial: '+1473',
                code: "GD",
                name: "Grenada"
            },
            {
                dial: '+590',
                code: "GP",
                name: "Guadeloupe"
            },
            {
                dial: '+1671',
                code: "GU",
                name: "Guam"
            },
            {
                dial: '+502',
                code: "GT",
                name: "Guatemala"
            },
            {
                dial: '+44',
                code: "GG",
                name: "Guernsey"
            },
            {
                dial: '+224',
                code: "GN",
                name: "Guinea"
            },
            {
                dial: '+245',
                code: "GW",
                name: "Guinea-Bissau"
            },
            {
                dial: '+595',
                code: "GY",
                name: "Guyana"
            }
        ],
        H: [
            {
                dial: '+509',
                code: "HT",
                name: "Haiti"
            },
            {
                dial: '+0',
                code: "HM",
                name: "Heard Island and McDonald Islands"
            },
            {
                dial: '+379',
                code: "VA",
                name: "Holy See (Vatican City State)"
            },
            {
                dial: '+504',
                code: "HN",
                name: "Honduras"
            },
            {
                dial: '+852',
                code: "HK",
                name: "Hong Kong"
            },
            {
                dial: '+36',
                code: "HU",
                name: "Hungary"
            }
        ],
        I: [
            {
                dial: '+354',
                code: "IS",
                name: "Iceland"
            },
            {
                dial: '+91',
                code: "IN",
                name: "India"
            },
            {
                dial: '+62',
                code: "ID",
                name: "Indonesia"
            },
            {
                dial: '+98',
                code: "IR",
                name: "Iran, Islamic Republic of"
            },
            {
                dial: '+964',
                code: "IQ",
                name: "Iraq"
            },
            {
                dial: '+353',
                code: "IE",
                name: "Ireland"
            },
            {
                dial: '+44',
                code: "IM",
                name: "Isle of Man"
            },
            {
                dial: '+972',
                code: "IL",
                name: "Israel"
            },
            {
                dial: '+39',
                code: "IT",
                name: "Italy"
            }
        ],
        J: [
            {
                dial: '+1876',
                code: "JM",
                name: "Jamaica"
            },
            {
                dial: '+81',
                code: "JP",
                name: "Japan"
            },
            {
                dial: '+44',
                code: "JE",
                name: "Jersey"
            },
            {
                dial: '+962',
                code: "JO",
                name: "Jordan"
            }
        ],
        K: [
            {
                dial: '+77',
                code: "KZ",
                name: "Kazakhstan"
            },
            {
                dial: '+254',
                code: "KE",
                name: "Kenya"
            },
            {
                dial: '+686',
                code: "KI",
                name: "Kiribati"
            },
            {
                dial: '+850',
                code: "KP",
                name: "Korea, Democratic People's Republic of"
            },
            {
                dial: '+82',
                code: "KR",
                name: "Korea, Republic of"
            },
            {
                dial: '+965',
                code: "KW",
                name: "Kuwait"
            },
            {
                dial: '+996',
                code: "KG",
                name: "Kyrgyzstan"
            }
        ],
        L: [
            {
                dial: '+856',
                code: "LA",
                name: "Lao People's Democratic Republic"
            },
            {
                dial: '+371',
                code: "LV",
                name: "Latvia"
            },
            {
                dial: '+961',
                code: "LB",
                name: "Lebanon"
            },
            {
                dial: '+266',
                code: "LS",
                name: "Lesotho"
            },
            {
                dial: '+231',
                code: "LR",
                name: "Liberia"
            },
            {
                dial: '+218',
                code: "LY",
                name: "Libya"
            },
            {
                dial: '+423',
                code: "LI",
                name: "Liechtenstein"
            },
            {
                dial: '+370',
                code: "LT",
                name: "Lithuania"
            },
            {
                dial: '+352',
                code: "LU",
                name: "Luxembourg"
            }
        ],
        M: [
            {
                dial: '+853',
                code: "MO",
                name: "Macau"
            },
            {
                dial: '+389',
                code: "MK",
                name: "Macedonia, the Former Yugoslav Republic of"
            },
            {
                dial: '+261',
                code: "MG",
                name: "Madagascar"
            },
            {
                dial: '+265',
                code: "MW",
                name: "Malawi"
            },
            {
                dial: '+60',
                code: "MY",
                name: "Malaysia"
            },
            {
                dial: '+960',
                code: "MV",
                name: "Maldives"
            },
            {
                dial: '+223',
                code: "ML",
                name: "Mali"
            },
            {
                dial: '+356',
                code: "MT",
                name: "Malta"
            },
            {
                dial: '+692',
                code: "MH",
                name: "Marshall Islands"
            },
            {
                dial: '+596',
                code: "MQ",
                name: "Martinique"
            },
            {
                dial: '+222',
                code: "MR",
                name: "Mauritania"
            },
            {
                dial: '+230',
                code: "MU",
                name: "Mauritius"
            },
            {
                dial: '+262',
                code: "YT",
                name: "Mayotte"
            },
            {
                dial: '+52',
                code: "MX",
                name: "Mexico"
            },
            {
                dial: '+691',
                code: "FM",
                name: "Micronesia, Federated States of"
            },
            {
                dial: '+373',
                code: "MD",
                name: "Moldova, Republic of"
            },
            {
                dial: '+377',
                code: "MC",
                name: "Monaco"
            },
            {
                dial: '+976',
                code: "MN",
                name: "Mongolia"
            },
            {
                dial: '+382',
                code: "ME",
                name: "Montenegro"
            },
            {
                dial: '+1664',
                code: "MS",
                name: "Montserrat"
            },
            {
                dial: '+212',
                code: "MA",
                name: "Morocco"
            },
            {
                dial: '+258',
                code: "MZ",
                name: "Mozambique"
            },
            {
                dial: '+95',
                code: "MM",
                name: "Myanmar"
            }
        ],
        N: [
            {
                dial: '+264',
                code: "NA",
                name: "Namibia"
            },
            {
                dial: '+674',
                code: "NR",
                name: "Nauru"
            },
            {
                dial: '+977',
                code: "NP",
                name: "Nepal"
            },
            {
                dial: '+31',
                code: "NL",
                name: "Netherlands"
            },
            {
                dial: '+687',
                code: "NC",
                name: "New Caledonia"
            },
            {
                dial: '+64',
                code: "NZ",
                name: "New Zealand"
            },
            {
                dial: '+505',
                code: "NI",
                name: "Nicaragua"
            },
            {
                dial: '+227',
                code: "NE",
                name: "Niger"
            },
            {
                dial: '+234',
                code: "NG",
                name: "Nigeria"
            },
            {
                dial: '+683',
                code: "NU",
                name: "Niue"
            },
            {
                dial: '+672',
                code: "NF",
                name: "Norfolk Island"
            },
            {
                dial: '+1670',
                code: "MP",
                name: "Northern Mariana Islands"
            },
            {
                dial: '+47',
                code: "NO",
                name: "Norway"
            }
        ],
        O: [
            {
                dial: '+968',
                code: "OM",
                name: "Oman"
            }
        ],
        P: [
            {
                dial: '+92',
                code: "PK",
                name: "Pakistan"
            },
            {
                dial: '+680',
                code: "PW",
                name: "Palau"
            },
            {
                dial: '+970',
                code: "PS",
                name: "Palestine, State of"
            },
            {
                dial: '+507',
                code: "PA",
                name: "Panama"
            },
            {
                dial: '+675',
                code: "PG",
                name: "Papua New Guinea"
            },
            {
                dial: '+595',
                code: "PY",
                name: "Paraguay"
            },
            {
                dial: '+51',
                code: "PE",
                name: "Peru"
            },
            {
                dial: '+63',
                code: "PH",
                name: "Philippines"
            },
            {
                dial: '+872',
                code: "PN",
                name: "Pitcairn"
            },
            {
                dial: '+48',
                code: "PL",
                name: "Poland"
            },
            {
                dial: '+351',
                code: "PT",
                name: "Portugal"
            },
            {
                dial: '+1939',
                code: "PR",
                name: "Puerto Rico"
            }
        ],
        Q: [
            {
                dial: '+974',
                code: "QA",
                name: "Qatar"
            }
        ],
        R: [
            {
                dial: '+262',
                code: "RE",
                // name: "Réunion"
                name: "Reunion"
            },
            {
                dial: '+40',
                code: "RO",
                name: "Romania"
            },
            {
                dial: '+7',
                code: "RU",
                name: "Russian Federation"
            },
            {
                dial: '+250',
                code: "RW",
                name: "Rwanda"
            }
        ],
        S: [
            {
                dial: '+590',
                code: "BL",
                name: "Saint Barthélemy"
            },
            {
                dial: '+290',
                code: "SH",
                name: "Saint Helena, Ascension and Tristan da Cunha"
            },
            {
                dial: '+1869',
                code: "KN",
                name: "Saint Kitts and Nevis"
            },
            {
                dial: '+1758',
                code: "LC",
                name: "Saint Lucia"
            },
            {
                dial: '+590',
                code: "MF",
                name: "Saint Martin (French part)"
            },
            {
                dial: '+508',
                code: "PM",
                name: "Saint Pierre and Miquelon"
            },
            {
                dial: '+1784',
                code: "VC",
                name: "Saint Vincent and the Grenadines"
            },
            {
                dial: '+685',
                code: "WS",
                name: "Samoa"
            },
            {
                dial: '+378',
                code: "SM",
                name: "San Marino"
            },
            {
                dial: '+239',
                code: "ST",
                name: "Sao Tome and Principe"
            },
            {
                dial: '+966',
                code: "SA",
                name: "Saudi Arabia"
            },
            {
                dial: '+221',
                code: "SN",
                name: "Senegal"
            },
            {
                dial: '+381',
                code: "RS",
                name: "Serbia"
            },
            {
                dial: '+248',
                code: "SC",
                name: "Seychelles"
            },
            {
                dial: '+232',
                code: "SL",
                name: "Sierra Leone"
            },
            {
                dial: '+65',
                code: "SG",
                name: "Singapore"
            },
            {
                dial: '+1',
                code: "SX",
                name: "Sint Maarten (Dutch part)"
            },
            {
                dial: '+421',
                code: "SK",
                name: "Slovakia"
            },
            {
                dial: '+386',
                code: "SI",
                name: "Slovenia"
            },
            {
                dial: '+677',
                code: "SB",
                name: "Solomon Islands"
            },
            {
                dial: '+252',
                code: "SO",
                name: "Somalia"
            },
            {
                dial: '+27',
                code: "ZA",
                name: "South Africa"
            },
            {
                dial: '+500',
                code: "GS",
                name: "South Georgia and the South Sandwich Islands"
            },
            {
                dial: '+211',
                code: "SS",
                name: "South Sudan"
            },
            {
                dial: '+34',
                code: "ES",
                name: "Spain"
            },
            {
                dial: '+94',
                code: "LK",
                name: "Sri Lanka"
            },
            {
                dial: '+249',
                code: "SD",
                name: "Sudan"
            },
            {
                dial: '+597',
                code: "SR",
                name: "Suriname"
            },
            {
                dial: '+47',
                code: "SJ",
                name: "Svalbard and Jan Mayen"
            },
            {
                dial: '+268',
                code: "SZ",
                name: "Swaziland"
            },
            {
                dial: '+46',
                code: "SE",
                name: "Sweden"
            },
            {
                dial: '+41',
                code: "CH",
                name: "Switzerland"
            },
            {
                dial: '+963',
                code: "SY",
                name: "Syrian Arab Republic"
            }
        ],
        T: [
            {
                dial: '+886',
                code: "TW",
                name: "Taiwan, Province of China"
            },
            {
                dial: '+992',
                code: "TJ",
                name: "Tajikistan"
            },
            {
                dial: '+255',
                code: "TZ",
                name: "Tanzania, United Republic of"
            },
            {
                dial: '+66',
                code: "TH",
                name: "Thailand"
            },
            {
                dial: '+670',
                code: "TL",
                name: "Timor-Leste"
            },
            {
                dial: '+228',
                code: "TG",
                name: "Togo"
            },
            {
                dial: '+690',
                code: "TK",
                name: "Tokelau"
            },
            {
                dial: '+676',
                code: "TO",
                name: "Tonga"
            },
            {
                dial: '+1868',
                code: "TT",
                name: "Trinidad and Tobago"
            },
            {
                dial: '+216',
                code: "TN",
                name: "Tunisia"
            },
            {
                dial: '+90',
                code: "TR",
                name: "Turkey"
            },
            {
                dial: '+993',
                code: "TM",
                name: "Turkmenistan"
            },
            {
                dial: '+1649',
                code: "TC",
                name: "Turks and Caicos Islands"
            },
            {
                dial: '+688',
                code: "TV",
                name: "Tuvalu"
            }
        ],
        U: [
            {
                dial: '+256',
                code: "UG",
                name: "Uganda"
            },
            {
                dial: '+380',
                code: "UA",
                name: "Ukraine"
            },
            {
                dial: '+971',
                code: "AE",
                name: "United Arab Emirates"
            },
            {
                dial: '+44',
                code: "GB",
                name: "United Kingdom"
            },
            {
                dial: '+1',
                code: "US",
                name: "United States"
            },
            {
                dial: '+246',
                code: "UM",
                name: "United States Minor Outlying Islands"
            },
            {
                dial: '+598',
                code: "UY",
                name: "Uruguay"
            },
            {
                dial: '+998',
                code: "UZ",
                name: "Uzbekistan"
            }
        ],
        V: [
            {
                dial: '+678',
                code: "VU",
                name: "Vanuatu"
            },
            {
                dial: '+58',
                code: "VE",
                name: "Venezuela, Bolivarian Republic of"
            },
            {
                dial: '+84',
                code: "VN",
                name: "Viet Nam"
            },
            {
                dial: '+1284',
                code: "VG",
                name: "Virgin Islands, British"
            },
            {
                dial: '+1340',
                code: "VI",
                name: "Virgin Islands, U.S."
            }
        ],
        W: [
            {
                dial: '+681',
                code: "WF",
                name: "Wallis and Futuna"
            },
            {
                dial: '+212',
                code: "EH",
                name: "Western Sahara"
            }
        ],
        // X: [],
        Y: [
            {
                dial: '+967',
                code: "YE",
                name: "Yemen"
            }
        ],
        Z: [
            {
                dial: '+260',
                code: "ZM",
                name: "Zambia"
            },
            {
                dial: '+263',
                code: "ZW",
                name: "Zimbabwe"
            }
        ]
    };

    return data;
}
