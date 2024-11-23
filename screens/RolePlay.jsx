import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Background from './Background';
import RNFS from 'react-native-fs';
import {TextInput} from 'react-native-gesture-handler';
import {ScrollView} from 'react-native-gesture-handler';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import {OPENAI_KEY} from '@env';

function RolePlay() {
  const navigation = useNavigation();
  const [textInputValue, setTextInputValue] = useState(''); // State to store the text input value
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [hasRoles, setHasRoles] = useState(false);
  const [roleDallee, setRoleDallee] = useState('');
  const [runDalle, setRunDalle] = useState(false);
  const [getRoles, setGetRoles] = useState(false);
  const [roles, setRoles] = useState([]);
  const [componentKey, setComponentKey] = useState(0);
  const [email, setEmail] = useState('');

  const route = useRoute();
  let emailHolder = route.params?.email;

  useEffect(() => {
    const fetchDataCourse = async () => {
      const comfValue = await AsyncStorage.getItem('COMFLANGUAGE');
      const tarValue = await AsyncStorage.getItem('TARGETLANGUAGE');
      const level = await AsyncStorage.getItem('LEVEL');
      const emailAsync = await AsyncStorage.getItem('may');
      setComfortableLang(comfValue);
      setTargetLanguage(tarValue);
      setLevel(level);
      setEmail(emailAsync);
    };
    fetchDataCourse();
  }, []);

  // Use useFocusEffect to call fetchData when the component comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRoles();
      return () => {
        console.log('Cleanup on blur');
      };
    }, [fetchRoles, componentKey]),
  );

  // Function to fetch roles
  const fetchRoles = useCallback(async () => {
    const comfValue = await AsyncStorage.getItem('COMFLANGUAGE');
    const tarValue = await AsyncStorage.getItem('TARGETLANGUAGE');
    const level = await AsyncStorage.getItem('LEVEL');
    const emailAsync = await AsyncStorage.getItem('may');
    setComfortableLang(comfValue);
    setTargetLanguage(tarValue);
    setLevel(level);
    setEmail(emailAsync);
    const formData = new FormData();
    formData.append('email', await AsyncStorage.getItem('may'));
    try {
      const rolesResponse = await fetch(`http://3.7.217.207/getRoles`, {
        method: 'POST',
        body: formData,
      });
      const rolesData = await rolesResponse.json(); // Parse the JSON response
      console.log('Fetched roles data:', rolesData.roles);
      setRoles(rolesData.roles);
      setHasRoles(rolesData.roles && rolesData.roles.length > 0);
      setTextInputValue('');
    } catch (error) {
      console.error(error);
    }
    setGetRoles(false);
  }, []);

  // Function to handle button press
  const handlePress = (rolePlayScenario, gender) => {
    // Navigate to RolePlayConversation and pass the rolePlayType
    navigation.navigate('RolePlayConversation', {
      rolePlayScenario,
      email,
      gender,
    });
  };

  const addRoles = async role => {
    setRoleDallee(role);
    let gender = 'unknown';
    let apiKey = `${OPENAI_KEY}`;
    const prompt = `If text inside triple tildes is not specifying a person, or an occupation, or a job title or a profession
                    like student, grandma, astronaut, postwoman, policeofficer etc generate json output-> result: no, otherwise result: yes.
                    Find the gender of the person after analysing the text inside triple tildes, if gender not sure output gender as unknown
                    or output gender -> male or female.
                    ~~~ ${role} ~~~`;
    const data = {
      model: 'gpt-4o-mini',
      messages: [{role: 'system', content: prompt}],
      response_format: {type: 'json_object'},
    };
    try {
      const response = await fetch(
        `https://api.openai.com/v1/chat/completions`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );
      const responseData = await response.json();
      const messageContent = JSON.parse(
        responseData.choices[0].message.content,
      );
      if (messageContent.result === 'yes') {
        gender = messageContent.gender; // Assign gender based on the response
      } else {
        Alert.alert('Invalid Input, The input does not specify a valid role.');
        setTextInputValue('');
        setRoleDallee('');
        return;
      }
    } catch (error) {
      console.error(error);
    }
    const formData = new FormData();
    formData.append('role', role);
    formData.append('email', await AsyncStorage.getItem('may'));
    formData.append('gender', gender);
    try {
      const rolesResponse = await fetch(`http://3.7.217.207/addRole`, {
        method: 'POST',
        body: formData,
      });
      setHasRoles(true);
    } catch (error) {
      console.error(error);
    }
    setTextInputValue('');
    setRunDalle(true);
    setGetRoles(true);
    // Force re-render by updating the key
    setComponentKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    const runDalle = async () => {
      let apiKey = `${OPENAI_KEY}`;
      if (roleDallee !== '') {
        const dataDalle = {
          model: 'dall-e-2',
          prompt: `${roleDallee}, comic art with color, standing alone smiling`,
          n: 1,
          size: '256x256',
        };
        try {
          console.log('in dallee');
          const response = await fetch(
            `https://api.openai.com/v1/images/generations`,
            {
              method: 'POST',
              body: JSON.stringify(dataDalle),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );
          const jsonResponse = await response.json();

          // Adjusted to match the provided response structure
          if (
            jsonResponse &&
            jsonResponse.data &&
            jsonResponse.data.length > 0
          ) {
            const image_url = jsonResponse.data[0].url; // Correctly accessing the first image URL
            const customFileName = `${roleDallee}.png`;
            console.log('test:', roleDallee);
            // const customFileName = `aklsdfl.png`;
            const localImagePath = await downloadImage(
              image_url,
              customFileName,
            );
            console.log('Local image path:', localImagePath);
          } else {
            console.log('No image data found in response');
          }
        } catch (error) {
          console.error(error);
        }
        setRoleDallee('');
        setRunDalle(false);
      }
    };
    runDalle();
  }, [runDalle]);

  async function downloadImage(imageUrl, customFileName) {
    console.log('in download');
    try {
      // If a custom file name is not provided, extract the file name from the URL.
      const fileName =
        customFileName || imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: path,
      }).promise;

      console.log('Image has been downloaded to:', path);
      setGetRoles(true);
      return path;
    } catch (error) {
      console.error('Error downloading the image:', error);
      return null;
    }
  }
  function getImagePathForRole(roleName) {
    const fileName = `${roleName}.png`;
    const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    return `file://${path}`; // Prepend with file:// to get a valid file URI
  }
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    // backgroundStyle: {
    //   backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    // },
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      marginTop: 20,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'white',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingTop: 35,
      paddingLeft: 20,
    },
    normalButtonText: {
      color: colorScheme === 'light' ? 'white' : 'white',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingLeft: 5,
    },
    displayText: {
      color: colorScheme === 'light' ? 'black' : 'white',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    textSection: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 275,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'black' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? 'lightgray' : 'white',
      marginBottom: 5,
      fontSize: 20,
      alignItems: 'center',
    },
    roleImage: {
      width: 100, // Example width
      height: 100, // Example height
      resizeMode: 'contain', // Adjust as needed
      borderRadius: 20,
    },
  });

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <Background />
      <ScrollView style={{height: '100%'}}>
        <View style={{alignSelf: 'center', width: 275, height: '100%'}}>
          {/* Map over the roles to create buttons */}
          {/* <ScrollView> */}
          {roles &&
            roles.map((role, index) => (
              <TouchableOpacity
                id="roles"
                key={index}
                style={styles.button}
                onPress={() => handlePress(role.role_name, role.gender)}>
                <View style={{flexDirection: 'row'}}>
                  <Image
                    source={{uri: getImagePathForRole(role.role_name)}}
                    style={styles.roleImage}
                  />
                  <Text style={styles.buttonText}>{role.role_name} →</Text>
                </View>
              </TouchableOpacity>
            ))}

          <View
            style={{
              justifyContent: 'center',
              paddingVertical: 15,
              alignItems: 'center',
            }}>
            <View
              style={{
                backgroundColor: '#5A75CC',
                borderRadius: 10,
                padding: 5,
              }}>
              {hasRoles ? (
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                  Add more characters below like Librarian, Accountant etc. :
                </Text>
              ) : (
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                  Give your own character you want to talk with like Restaurant
                  waiter, Shopping assistant, Bartender etc:
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: 'row', // Align items horizontally
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 15,
                paddingBottom: 100,
              }}>
              <TextInput
                style={{
                  height: 60,
                  borderColor: '#A6B4F2',
                  borderWidth: 1,
                  width: 180,
                  backgroundColor: '#A6B4F2',
                  borderRadius: 10,
                  marginRight: 10, // Add some space between TextInput and Button
                  color: 'white',
                }}
                onChangeText={text => setTextInputValue(text)} // Update state on text change
                value={textInputValue} // Set TextInput value from state
                placeholder="Enter text here"></TextInput>
              <TouchableOpacity style={styles.button}>
                <Text
                  style={styles.normalButtonText}
                  onPress={() => addRoles(textInputValue)}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default RolePlay;
