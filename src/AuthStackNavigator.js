import { createStackNavigator } from 'react-navigation';
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';

import AuthMain from './AuthMain';
import SignUpWithEmail from './SignUpWithEmail';
import SignUpWithMobile from './SignUpWithMobile';


export default createStackNavigator(
    {
        authMain: {
            screen: AuthMain
        },

        email: {
            screen: SignUpWithEmail
        },

        mobile: {
            screen: SignUpWithMobile
        }
    },
    {
        mode: 'card',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false,
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forHorizontal
        })
    }
);
