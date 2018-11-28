import { createStackNavigator } from 'react-navigation';
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';

// import Home from './Home';
import Explore from './Explore';
import Detail from './Detail';


export default createStackNavigator(
    {
        home: {
            // screen: Home
            screen: Explore
        },
        detail: {
            screen: Detail
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
