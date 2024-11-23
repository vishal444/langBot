import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import Chat from '../screens/Chat';
import Course from '../screens/Course';
import Settings from '../screens/Settings';
import Imagepath from '../screens/assets/ImagePath';
import RolePlay from './RolePlay';
import {StyleSheet, Platform} from 'react-native';

// Create a bottom tab navigator
const Tab = createBottomTabNavigator();

// Home screen component with bottom tabs
function Home() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;
  const isIOS = Platform.OS === 'ios';
  const styles = StyleSheet.create({
    tabBar: {
      // golden -> #fae318 
      backgroundColor: '#7F86F2', // Background color of the tab bar
      borderTopColor: 'transparent', // Border top color
      // Add more styling as needed
      borderRadius: isIOS ?25:15,          // Rounded edges for the tab bar
      borderTopWidth: 0,         // Optional: remove the border top
      position: 'absolute',      // Needed to ensure the rounded corners are visible
      bottom: isIOS ? 30 : 3,                // Spacing from the bottom
      left: 2,                  // Spacing from the left
      right: 2,                 // Spacing from the right
      height: isIOS ? 80:60,                // Height of the tab bar
      elevation: 3,              // Shadow for Android
      shadowOpacity: 0.3,        // Shadow for iOS
      shadowRadius: 20,          // Shadow blur radius
      shadowOffset: { width: 0, height: 2 },
    },
    tabBarLabelStyle: {
      fontWeight: 'bold', // Add this line to make the label text bold
      fontSize: 12,       // You can adjust the font size if needed
      // paddingTop: 20,
      // marginTop: isIOS ?40:0,
    },
    tabBarIconStyle: {
      // marginTop: isIOS ? 80:0, // Adjust the marginTop value as needed
    },
    // Any other custom styles
  });
  
  return (
    <Tab.Navigator  screenOptions={{
      tabBarActiveTintColor: 'white', // Color of the tab when active
      tabBarInactiveTintColor: 'black',   // Color of the tab when inactive
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabelStyle, 
      tabBarShowLabel: true,  
      tabBarHideOnKeyboard: true,       // Whether to show tab labels or not
      tabBarLabelPosition: 'below-icon'
    }}>
      <Tab.Screen
        name="Talk with AI"
        component={Chat}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image style={styles.tabBarIconStyle} source={Imagepath.icChatBot}/>
          )
        }}}
      />
      <Tab.Screen
        name="RolePlay"
        component={RolePlay}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image style={styles.tabBarIconStyle} source={Imagepath.icChat}/>
          )
        }}}
      />
      <Tab.Screen
        name="Course"
        component={Course}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image style={styles.tabBarIconStyle} source={Imagepath.icCourse}/>
          )
        }}}
      />
       <Tab.Screen
        name="Settings"
        component={Settings}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image style={styles.tabBarIconStyle} source={Imagepath.icSettings}/>
          )
        }}}
      />
    </Tab.Navigator>
  );
}

export default Home;
