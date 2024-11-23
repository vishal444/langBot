import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginRegistration() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Added name state
  const [errorMessage, setErrorMessage] = useState('');
  const [existingEmail, setExistingEmail] = useState(null);

  const navigation = useNavigation(); // Get navigation object

  useEffect(() => {
    const checkLoginExists = async () => {
      try {
        const value = await AsyncStorage.getItem('may');
        setExistingEmail(value);
      } catch (error) {
        console.error(error);
      }
    };
    checkLoginExists();
  }, []);
  
  useEffect(() => {
    const checkAuthentication = async () => {
      if (existingEmail && existingEmail.trim() !== '') {
        navigation.navigate('Landing', {
          existingEmail,
        });
      }
    };
    checkAuthentication();
  }, [existingEmail]);

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    },
    input: {
      width: '100%',
      height: 40,
      borderColor: '#3359DC',
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 10,
      paddingLeft: 10,
      color: colorScheme === 'light' ? 'black' : 'white', // Change text color to black
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC', // Change background color to black
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    toggleButton: {
      color: colorScheme === 'light' ? '#3359DC' : 'white', // Change text color to black
      marginTop: 20,
    },
    errorMessage: {
      color: 'red',
      marginTop: 10,
    },
  });

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };
  const toGuestPage = () => {
    navigation.navigate('GuestPage');
  };
  const handleSubmit = async () => {
    // Handle login or registration logic here
    if (isLogin) {
      try {
        console.log('form data:', email, password);
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await fetch('http://3.7.217.207/login', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log('response', data);
        if (response.status === 200) {
          await AsyncStorage.setItem('bioMetric', 'yes');
          await AsyncStorage.setItem('may', `${email}`);
          // Redirect to Landing screen after successful login
          navigation.navigate('Landing', {
            email,
          });
        } else {
          // Handle non-200 status codes here
          if(response.status === 401){
            setErrorMessage('Please enter correct email / password!')
          } else {
            setErrorMessage('An error occurred while logging in. Please try again.');
          }
          console.error('Server responded with status code: ', response.status);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const formData = new FormData();
        formData.append('name', name); // Include name in the form data
        formData.append('email', email);
        formData.append('password', password);

        const response = await fetch('http://3.7.217.207/register', {
          method: 'POST',
          body: formData,
        }).catch(e => {
          console.error(e);
          Alert.alert(`${e}`);
        });

        if (!response) {
          return;
        }
        const data = await response.json();
        console.log('response', data);
        if (response.status === 200) {
          // Store bioMetric value
          await AsyncStorage.setItem('bioMetric', 'yes');
          await AsyncStorage.setItem('may', `${email}`);
          // Redirect to Start screen after successful registration
          navigation.navigate('Start', {
            email,
          });
        } else {
          // Handle registration error, if any
          setErrorMessage(`Registration failed. Please try again. ${data.message}`);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {!isLogin && ( // Only show the name input for registration
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
      </TouchableOpacity>
      <Text style={styles.toggleButton} onPress={handleToggle}>
        {isLogin
          ? "Don't have an account? Register"
          : 'Already have an account? Login'}
      </Text>
      <Text style={styles.toggleButton} onPress={toGuestPage}>
        Use as guest !!
      </Text>
      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
}