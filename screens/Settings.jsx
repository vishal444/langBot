import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Appearance, Alert} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Linking} from 'react-native';
import Background from './Background';
import {AppContext} from '../App';

const targetLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
];
const comfortableLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
];
const level = [
  {label: 'Beginner', value: 'Beginner'},
  {label: 'Intermediate', value: 'Intermediate'},
  {label: 'Proficient', value: 'Proficient'},
];
const voice = [
  {label: 'Male', value: 'alloy'},
  {label: 'Female', value: 'nova'},
];
const Settings = () => {
  const {learnGrammarClicked, setLearnGrammarClicked} = useContext(AppContext);
  const {makeConversationClicked, setMakeConversationClicked} =
    useContext(AppContext);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState(null);
  const [selectedComfLanguage, setSelectedComfLanguage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null); // Initialize with a default value
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [isLoading, setIsLoading] = useState(false);
  
  const route = useRoute();
  let emailHolder = route.params?.email;

  const navigation = useNavigation();

  const toggleClick = () => {
    if (learnGrammarClicked) {
      setLearnGrammarClicked(false);
      setMakeConversationClicked(true);
      // Alert.alert('Done');
      navigation.navigate('Landing'); // Navigate to the Home screen, which contains the bottom tabs navigator
      navigation.navigate('Talk with AI');
    } else {
      setLearnGrammarClicked(true);
      setMakeConversationClicked(false);
      // Alert.alert('Done');
      navigation.navigate('Landing'); // Navigate to the Home screen, which contains the bottom tabs navigator
      navigation.navigate('Talk with AI');
    }
  };

  const handleOkButtonPress = async () => {
    if (
      selectedComfLanguage === null &&
      selectedTargetLanguage === null &&
      selectedLevel === null &&
      selectedVoice === null
    ) {
      // Display an alert if all values are null
      Alert.alert('Please select at least one setting before saving.');
      return;
    }
    const formData = new FormData();
    if (selectedComfLanguage !== null) {
      formData.append('comfLang', selectedComfLanguage);
    }
    if (selectedTargetLanguage !== null) {
      formData.append('targetLang', selectedTargetLanguage);
    }
    if (selectedLevel !== null) {
      formData.append('level', selectedLevel);
    }
    if (selectedVoice !== null) {
      formData.append('voice', selectedVoice);
    }
    formData.append('email', await AsyncStorage.getItem('may'));

    // Assuming this code is inside an async function or a component's lifecycle method
    try {
      const response = await fetch('http://3.7.217.207/userData', {
        method: 'PUT',
        body: formData,
      });

      if (response.status === 200) {
        if (selectedComfLanguage !== null) {
          await AsyncStorage.setItem('COMFLANGUAGE', `${selectedComfLanguage}`);
        }
        if (selectedTargetLanguage !== null) {
          await AsyncStorage.setItem(
            'TARGETLANGUAGE',
            `${selectedTargetLanguage}`,
          );
        }
        if (selectedTargetLanguage !== null) {
          await AsyncStorage.setItem('LEVEL', `${selectedLevel}`);
        }
        if (selectedVoice !== null) {
          await AsyncStorage.setItem('VOICE', `${selectedVoice}`);
        }
        Alert.alert('Data saved successfully');
      } else {
        // Handle login error, if any
        Alert.alert('Settings update failed');
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error('Request failed:', error.message);
    }
    setSelectedComfLanguage(null);
    setSelectedTargetLanguage(null);
    setSelectedLevel(null);
    setSelectedVoice(null);
  };
  useEffect(() => {
    let interval;
    if (isLoading) {
      // Start the interval when loading is true
      interval = setInterval(() => {
        setLoadingDots(prevDots => (prevDots % 3) + 1); // Cycle through 1, 2, 3
      }, 1000);
    } else {
      // Clear the interval when loading is false
      clearInterval(interval);
    }

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [isLoading]);
  const loadingText = `Deleting${'.'.repeat(loadingDots)}`; // Create loading text with dots

  const pressSignOut = async () => {
    await AsyncStorage.setItem('bioMetric', 'no');
    await AsyncStorage.removeItem('may');
    navigation.navigate('Login');
  };

  const pressDelete = () => {
    // Show confirmation dialog
    Alert.alert(
      'Confirm Deletion', // Title of the alert
      'Are you sure you want to delete your account? This action cannot be undone.', // Message
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'), // Do nothing on cancel
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          onPress: async () => {
            setIsLoading(true);
            // User confirmed deletion, proceed with account deletion logic
            const deleteFormData = new FormData();
            deleteFormData.append('email', await AsyncStorage.getItem('may'));
            try {
              const response = await fetch('http://3.7.217.207/delete', {
                method: 'POST',
                body: deleteFormData,
              });
              if (response.ok) {
                setIsLoading(false);
                navigation.navigate('Login');
                await AsyncStorage.removeItem('may');
              } else {
                setIsLoading(false);
                Alert.alert('Failed to delete account');
              }
            } catch (error) {
              console.error('Request failed:', error.message);
              Alert.alert('Error', 'Failed to delete account due to an error.');
            }
          },
        },
      ],
      {cancelable: false}, // Prevent dismiss by tapping outside of the alert box
    );
  };

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
      height: '100%',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    displayText: {
      color: colorScheme === 'light' ? 'black' : 'black',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
    },
    outerContainer: {
      paddingHorizontal: 20,
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
      // marginVertical: 5,
      marginBottom: 5,
    },
    container: {
      paddingHorizontal: 20,
      // paddingVertical: 2,
      borderRadius: 10, // Add borderRadius for the container
      backgroundColor: colorScheme === 'light' ? '#A6B4F2' : '#A6B4F2',
      // marginVertical: 5,
      marginBottom: 5,
    },
    internalContainer: {
      paddingHorizontal: 10,
      // paddingVertical: 2,
      borderRadius: 10, // Add borderRadius for the container
      backgroundColor: colorScheme === 'light' ? 'gray' : 'gray',
      // marginVertical: 5,
      marginBottom: 5,
      paddingVertical: 10,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'lightgrey' : 'lightgrey',
      alignSelf: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15,
    },
  });

  const privacyPolicyUrl =
    'https://vishal444.github.io/business_pages/privacy_policy.html';

  const handlePrivacyPolicyLinkPress = () => {
    Linking.openURL(privacyPolicyUrl).catch(err =>
      console.error('Error opening URL:', err),
    );
  };

  const termsAndConditions =
    'https://vishal444.github.io/business_pages/terms_of_service.html';
  const handleTermsAndConditionsLinkPress = () => {
    Linking.openURL(termsAndConditions).catch(err =>
      console.error('Error opening Terms and Conditions URL:', err),
    );
  };

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <View style={styles.outerContainer}>
        <Background />
        <ScrollView
          style={{paddingTop: 10}}
          contentContainerStyle={{paddingBottom: 120}}>
          <View style={styles.internalContainer}>
            <View
              style={{paddingHorizontal: 5, paddingBottom: 5, paddingTop: 10}}>
              <View style={styles.container}>
                <Text style={[styles.displayText, {paddingVertical: 20}]}>
                  Change your comfortable language
                </Text>
                <Dropdown
                  data={comfortableLang}
                  search
                  searchPlaceholder="Search"
                  labelField="label"
                  valueField="value"
                  placeholder="Select language"
                  value={selectedComfLanguage}
                  onChange={item => setSelectedComfLanguage(item.value)}
                  itemTextStyle={{
                    color: colorScheme === 'light' ? 'black' : 'black',
                  }}
                />
              </View>
            </View>
            <View style={{paddingHorizontal: 5, paddingBottom: 5}}>
              <View style={styles.container}>
                <Text style={[styles.displayText, {paddingVertical: 20}]}>
                  Change the language you want to learn
                </Text>
                <Dropdown
                  data={targetLang}
                  search
                  searchPlaceholder="Search"
                  labelField="label"
                  valueField="value"
                  placeholder="Select language"
                  value={selectedTargetLanguage}
                  onChange={item => setSelectedTargetLanguage(item.value)}
                  itemTextStyle={{
                    color: colorScheme === 'light' ? 'black' : 'black',
                  }}
                />
              </View>
            </View>
            <View style={{paddingHorizontal: 5, paddingBottom: 5}}>
              <View style={styles.container}>
                <Text style={[styles.displayText, {paddingVertical: 20}]}>
                  Change your current proficiency level
                </Text>
                <Dropdown
                  data={level}
                  search
                  searchPlaceholder="Search"
                  labelField="label"
                  valueField="value"
                  placeholder="Select proficiency level"
                  value={selectedLevel}
                  onChange={item => setSelectedLevel(item.value)}
                  itemTextStyle={{
                    color: colorScheme === 'light' ? 'black' : 'black',
                  }}
                />
              </View>
            </View>
            <View style={{paddingHorizontal: 5}}>
              <View style={styles.container}>
                <Text style={styles.displayText}>
                  Change your preferred voice
                </Text>
                <Dropdown
                  data={voice}
                  search
                  searchPlaceholder="Search"
                  labelField="label"
                  valueField="value"
                  placeholder="Select voice"
                  value={selectedVoice}
                  onChange={item => setSelectedVoice(item.value)}
                  itemTextStyle={{
                    color: colorScheme === 'light' ? 'black' : 'black',
                  }}
                />
              </View>
            </View>
            <View style={{alignSelf: 'center', width: 150}}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleOkButtonPress}>
                <Text style={styles.buttonText}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.internalContainer}>
            <TouchableOpacity onPress={toggleClick}>
              <Text style={styles.buttonText}>
                {learnGrammarClicked
                  ? 'Change to Conversation Mode'
                  : 'Change to Grammar Learning Mode'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.internalContainer}>
            <TouchableOpacity onPress={pressSignOut}>
              <Text
                style={{
                  color: 'blue',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
          {isLoading && (
            // Show loading text or spinner while waiting for the response
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}
          <View style={styles.internalContainer}>
            <TouchableOpacity onPress={pressDelete}>
              <Text
                style={{
                  color: '#B53115',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.internalContainer}>
            <Text style={{fontSize: 10, paddingTop: 20}}>
              Your account is subject to the app's{' '}
              <Text
                style={{color: 'blue'}}
                onPress={handleTermsAndConditionsLinkPress}>
                Terms and Conditions
              </Text>
              {' and '}
              <Text
                style={{color: 'blue'}}
                onPress={handlePrivacyPolicyLinkPress}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
