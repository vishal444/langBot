import 'react-native-gesture-handler';
import React, {createContext, useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import Start from './screens/Start';
import LoginRegistration from './screens/LoginRegistration';
import Home from './screens/Home';
import RolePlayConversation from './screens/RolePlayConversation';
import GuestPage from './screens/GuestPage';

// Create Context
export const AppContext = createContext();

function App() {
  const Stack = createStackNavigator();
  const [learnGrammarClicked, setLearnGrammarClicked] = useState(false);
  const [makeConversationClicked, setMakeConversationClicked] = useState(false);

  return (
    <SafeAreaProvider>
      <AppContext.Provider
        value={{
          learnGrammarClicked,
          setLearnGrammarClicked,
          makeConversationClicked,
          setMakeConversationClicked,
        }}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerBackTitleVisible: false, // This hides the back title globally
            }}>
            <Stack.Screen
              name="Login"
              component={LoginRegistration}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="Start"
              component={Start}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="Landing"
              component={Home}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="GuestPage"
              component={GuestPage}
              options={{
                headerShown: false,
                headerLeft: () => null,
                headerTitle: () => null,
              }}
            />
            <Stack.Screen
              name="RolePlayConversation"
              component={RolePlayConversation}
              options={{
                headerShown: true,
                headerLeft: undefined,
                headerTitle: 'Role Play',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}

export default App;
