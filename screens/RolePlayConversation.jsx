import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  Platform,
  StyleSheet,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';
import RNFS from 'react-native-fs';
import Background, {homeStyle} from './Background';
import Imagepath from '../screens/assets/ImagePath';
import {OPENAI_KEY} from '@env';
import {ScrollView} from 'react-native-gesture-handler';
import base64 from 'react-native-base64';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  interpolate,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const audioRecorderPlayer = new AudioRecorderPlayer();

const RolePlayConversation = () => {
  const [scenario, setScenario] = useState('');
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [savedUri, setSavedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [rolePlayResult, setRolePlayResult] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [voiceInterface, setVoiceInterface] = useState('');
  const [transcription, setTranscription] = useState('');
  const [stopProcessFinished, setStopProcessFinished] = useState(false);
  const [stopClicked, setStopClicked] = useState(false);
  const [targetLanguageWhisper, setTargetLanguageWhisper] = useState('');
  const [history, setHistory] = useState('');
  const [playingAnim, setPlayingAnim] = useState(false);

  const route = useRoute(); // Get the route object
  let emailHolder = route.params?.emailHolder;
  let role = route.params?.rolePlayScenario;
  let gender = route.params?.gender;

  useEffect(() => {
    if (route.params?.rolePlayScenario) {
      setScenario(route.params.rolePlayScenario);
    }
  }, [route.params]);

 // Fetch data logic wrapped inside useCallback to avoid infinite loops
 const fetchData = useCallback(async () => {
  try {
    // If userData also requires the email as a query parameter
    const userDataUrl = `http://3.7.217.207/userData?param=${encodeURIComponent(
      await AsyncStorage.getItem('may'),
    )}`;
    const response = await fetch(userDataUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const userData = await response.json();
    setComfortableLang(userData[0]);
    setTargetLanguage(userData[1]);
    console.log(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}, []);
// Use useFocusEffect to call fetchData when the component comes into focus
useFocusEffect(
  useCallback(() => {
    fetchData();
    // Optional: Return a cleanup function if necessary
    return () => {
      // Cleanup tasks if needed
      console.log('Cleanup on blur');
    };
  }, [fetchData]),
);

useEffect(() => {
  const playFirst = async () => {
    if (gender === 'female') {
      playAudio(require('../screens/assets/hello_female.mp3'));
      setVoiceInterface('nova');
    } else {
      console.log('playing male');
      playAudio(require('../screens/assets/hello.mp3'));
      setVoiceInterface('alloy');
    }
  };
  playFirst();
}, []);

useEffect(() => {
  const setLangs = async () => {
  const level = await AsyncStorage.getItem('LEVEL');
      if (targetLanguage === 'English') {
        setTargetLanguageWhisper('en');
      } else if (targetLanguage === 'German') {
        setTargetLanguageWhisper('de');
      } else if (targetLanguage === 'French') {
        setTargetLanguageWhisper('fr');
      } else if (targetLanguage === 'Spanish') {
        setTargetLanguageWhisper('es');
      } else if (targetLanguage === 'Dutch') {
        setTargetLanguageWhisper('nl');
      } else if (targetLanguage === 'Italian') {
        setTargetLanguageWhisper('it');
      } else if (targetLanguage === 'Arabic') {
        setTargetLanguageWhisper('ar');
      } else if (targetLanguage === 'Hindi') {
        setTargetLanguageWhisper('hi');
      } else if (targetLanguage === 'Chinese') {
        setTargetLanguageWhisper('cn');
      }
      setLevel(level);
      }
      setLangs();
}, [targetLanguage]);

  useEffect(() => {
    // Define the fetchChat function inside the useEffect
    const fetchData = async () => {
      const formData = new FormData();
      formData.append('role', role);
      formData.append('email', await AsyncStorage.getItem('may'));
      try {
        const rolePlayResponse = await fetch(`http://3.7.217.207/rolePlayData`, {
          method: 'POST',
          body: formData,
        });
        const textData = await rolePlayResponse.json();
        console.log('exchanges:', textData);
        setRolePlayResult(textData);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };
  
    // Call fetchChat here, ensuring that the above checks are in place.
    fetchData();
  }, [role]); // Depend on role and emailValue to re-run
  
  
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
  const loadingText = `Thinking${'.'.repeat(loadingDots)}`; // Create loading text with dots

  const startRecording = async () => {
    setTranscription('');
    setHasVoiceInput(true);
    try {
      if (audioRecorderPlayer.isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      const path = Platform.select({
        ios: 'roleRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/roleRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setIsRecording(true);
      setSavedUri(result);
    } catch (error) {
      console.log(error);
    }
  };
  
  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setRecordSecs(0);
      setIsRecording(false);
      const formData = new FormData();
      formData.append('model', 'whisper-1');
      if (Platform.OS === 'ios') {
        if (savedUri) {
          formData.append('language', targetLanguageWhisper);
          formData.append('file', {
            uri: `file://${savedUri}`,
            type: 'audio/m4a',
            name: 'recording.m4a',
          });
        }
      } else if (Platform.OS === 'android') {
        if (savedUri) {
          formData.append('language', targetLanguageWhisper);
          formData.append('file', {
            uri: `file://${savedUri}`,
            type: 'audio/mp4',
            name: 'recording.mp4',
          });
        }
      }
      let apiKey = `${OPENAI_KEY}`;
      if (savedUri && transcription === '') {
        const fileExists = await RNFS.exists(savedUri);
        if (!fileExists) {
          setIsRecording(false);
          return;
        }
        try {
          const comfAudioResponse = await fetchWithTimeout(
            `https://api.openai.com/v1/audio/transcriptions`,
            {
              method: 'POST',
              body: formData,
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'multipart/form-data',
              },
            },
            6000, // Timeout in milliseconds (e.g., 10000ms = 10 seconds)
          );
          if (!comfAudioResponse.ok) {
            throw new Error(`HTTP error! status: ${comfAudioResponse.status}`);
          }
          const comfResult = await comfAudioResponse.json();
          console.log('comf transcription data:', comfResult.text);
          setTranscription(comfResult.text);
        } catch (error) {
          console.error('An error occurred:', error);
          setPlayingAnim(false);
          setIsLoading(false);
          if (error.message === 'Request timed out') {
            Alert.alert(
              'Timeout',
              'The request timed out. Please try again later.',
            );
          } else {
            Alert.alert('Error', 'An error occurred. Please try again later.');
          }
        }
        const rolePlayCred = new FormData();
        rolePlayCred.append('role', role);
        rolePlayCred.append('email', await AsyncStorage.getItem('may'));
        try {
          const rolePlayResponse = await fetch(
            `http://3.7.217.207/rolePlayHis`,
            {
              method: 'POST',
              body: rolePlayCred,
            },
          );
          const textData = await rolePlayResponse.json();
          console.log('history:', textData);
          setHistory(textData);
        } catch (error) {
          console.error('Error fetching chat data:', error);
        }
        setIsRecording(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handlePress = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.log(error);
    } finally {
      setStopProcessFinished(true);
    }
  };
  useEffect(() => {
    if (stopProcessFinished && hasVoiceInput) {
      startAnimation();
      console.log('has voiceiput', hasVoiceInput);
      console.log('stopProcessFinished', stopProcessFinished);
      sendGenerateAudioRequest();
    } else if (stopProcessFinished && !hasVoiceInput) {
      setPlayingAnim(false);
      console.log('has voiceiput', hasVoiceInput);
      console.log('stopProcessFinished', stopProcessFinished);
      Alert.alert('There is no input data');
      setStopProcessFinished(false);
    }
  }, [stopProcessFinished]);
  
  const sendGenerateAudioRequest = async () => {
    setIsLoading(true);
    setHasVoiceInput(false);
    setPlayingAnim(true);
    let apiKey = `${OPENAI_KEY}`;

    console.log('in prompt');
    const prompt = `The user wants to do a roleplay conversation. You are or your character is ${role}. 
    This is the history ${history}. The input from the user will be inside triple tildes. Respond to 
    the text in ${targetLanguage} with strict regards to the role. Also correct the grammar mistakes.
        ~~~ ${transcription} ~~~`;
    const data = {
      model: 'gpt-4o-mini',
      messages: [{role: 'system', content: prompt}],
    };
    try {
      const response = await fetchWithTimeout(
        `https://api.openai.com/v1/chat/completions`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
        6000, // 10 seconds timeout
      );
      const responseData = await response.json();
      console.log('chat response: ', responseData.choices[0].message.content);
      if (savedUri) {
        const responseMain = responseData.choices[0].message.content;
        console.log('tts!');
        callTTS(responseMain, voiceInterface || 'alloy');
        const chatWholeData =
          'User: ' + transcription + '  You: ' + responseMain;
        try {
          const chatData = new FormData();
          chatData.append('email', await AsyncStorage.getItem('may'));
          chatData.append('tarInput', transcription);
          chatData.append('llmResp', responseMain);
          chatData.append('chatWhole', chatWholeData);
          chatData.append('role', role);
          const response = await fetch(`http://3.7.217.207/rolePlaySave`, {
            method: 'POST',
            body: chatData,
          });
          const dataHolder = await response.json();
        } catch (error) {
          console.error(error);
        }
      }
      const roleplayCred = new FormData();
      roleplayCred.append('role', role);
      roleplayCred.append('email', await AsyncStorage.getItem('may'));
      try {
        const rolePlayResponse = await fetch(
          `http://3.7.217.207/rolePlayData`,
          {
            method: 'POST',
            body: roleplayCred,
          },
        );
        const textData = await rolePlayResponse.json();
        console.log('exchanges:', textData);
        setRolePlayResult(textData);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    } catch (error) {
      console.error(error);
      setPlayingAnim(false);
      setIsLoading(false);
      if (error.message === 'Request timed out') {
        Alert.alert(
          'Timeout',
          'The request timed out. Please try again later.',
        );
      } else {
        Alert.alert('Error', 'An error occurred. Please try again later.');
      }
    }
    setIsLoading(false);
    setIsRecording(false);
    setSavedUri(null);
    setTranscription('');
    setStopProcessFinished(false);
    setStopClicked(false);
  };
  const callTTS = async (text, voice) => {
    // Check if voice is null or undefined and set a default voice
    console.log('voice', voice);
    let apiKey = `${OPENAI_KEY}`;
    const speechFile = `${RNFS.DocumentDirectoryPath}/speech.mp3`;
    const speechData = {
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: 0.9,
    };
    try {
      const audioResponse = await fetchWithTimeout(
        `https://api.openai.com/v1/audio/speech`,
        {
          method: 'POST',
          body: JSON.stringify(speechData),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
        6000, // Timeout in milliseconds (e.g., 10000ms = 10 seconds)
      );
      if (!audioResponse.ok) {
        throw new Error(`HTTP error! status: ${audioResponse.status}`);
      }
      const arrayBuffer = await audioResponse.arrayBuffer();
      const base64String = base64.encodeFromByteArray(
        new Uint8Array(arrayBuffer),
      );
      await RNFS.writeFile(speechFile, base64String, 'base64');
      console.log('File saved at:', speechFile);
      playAudio(speechFile);
    } catch (error) {
      console.error('An error occurred:', error);
      setPlayingAnim(false);
      setIsLoading(false);
      if (error.message === 'Request timed out') {
        Alert.alert(
          'Timeout',
          'The request timed out. Please try again later.',
        );
      } else {
        Alert.alert('Error', 'An error occurred. Please try again later.');
      }
    }
  };

  const playAudio = filePathOrModule => {
    // Release the previous sound if one exists
    if (sound) {
      sound.release();
    }
    // Check if the input is a number, which indicates a required module, otherwise, it's a file path
    const isModule = typeof filePathOrModule === 'number';
    let soundInstance;
    if (isModule) {
      soundInstance = new Sound(filePathOrModule, error => {
        if (error) {
          console.error('Error loading sound:', error);
          return;
        }
        playSound(soundInstance);
      });
    } else {
      // For file paths, an empty string as the second argument specifies the main bundle but it's mostly relevant for iOS.
      soundInstance = new Sound(filePathOrModule, '', error => {
        if (error) {
          console.error('Error loading sound:', error);
          return;
        }
        playSound(soundInstance);
      });
    }
    // Function to play the sound after successful loading
    const playSound = soundObj => {
      soundObj.play(success => {
        if (!success) {
          console.error('Error playing sound');
        } else {
          setPlayingAnim(false);
          setIsLoading(false);
          console.log('Sound played successfully');
        }
        soundObj.release(); // Release the audio player resource after playing
      });
    };
    // Optionally keep the sound instance to manage or stop it later
    setSound(soundInstance);
  };

  const colorScheme = Appearance.getColorScheme();
  let imageSource;
  if (colorScheme === 'light') {
    imageSource = Imagepath.icArrowDark;
  } else if (colorScheme === 'dark') {
    imageSource = Imagepath.icArrowDark;
  }
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 10,
      paddingTop: 10,
      borderRadius: 5,
      marginTop: 3,
      height: 100,
      zIndex: 1,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    chatSectionCon: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      alignSelf: 'flex-start',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      color: colorScheme === 'light' ? 'white' : 'black',
      marginBottom: 5,
    },
    chatSectionResp: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      marginBottom: 5,
    },
    responseButton: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'white', // Set the background color to black
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
      height: 50,
      borderRadius: 50,
      marginTop: 10,
    },
    chatView: {
      paddingVertical: 10,
      borderRadius: 10,
      paddingBottom: 100,
    },
    concatenatedChat: {
      color: colorScheme === 'light' ? 'white' : 'black',
    },
    chatResponse: {
      color: colorScheme === 'light' ? 'white' : 'black',
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
  function fetchWithTimeout(url, options, timeout = 6000) {
    return new Promise((resolve, reject) => {
      // Set timeout timer
      const timer = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeout);

      fetch(url, options)
        .then(response => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
  const animation = useSharedValue(0); // 0: start, 1: end

  const blockStyle1 = useAnimatedStyle(() => {
    const translateX = interpolate(animation.value, [0, 1], [0, 0]); // Move to the right
    const borderRadius = interpolate(animation.value, [0, 1], [10, 50]);
    const height = interpolate(animation.value, [0, 1], [70, 100]); // Interpolate height from 60 to 100
    const opacity = interpolate(animation.value, [0, 1], [1, 0]); // Fades out
    return {
      transform: [{translateX}],
      borderRadius,
      width: 115, // You can adjust this as needed
      height, // Use interpolated height
      opacity: opacity,
    };
  });

  const startAnimation = () => {
    animation.value = withTiming(1, {duration: 1000, easing: Easing.linear});
  };
  const gifStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animation.value, [0, 1], [0, 1]); // Fade in the GIF
    return {
      opacity,
      position: 'absolute',
      width: 100, // Set the GIF size
      height: 100,
      borderRadius: 50,
      alignSelf: 'center',
      transform: [{translateY: 10}], // Adjust position if needed
    };
  });

  // Reset animation function to move back to initial state
  const resetAnimation = () => {
    animation.value = withTiming(0, {duration: 1000}); // Animate back or set directly to 0
  };
  // useEffect hook to listen for isLoading state changes
  useEffect(() => {
    if (!playingAnim) {
      resetAnimation(); // Call reset when isLoading is false
    }
  }, [playingAnim]); // Depend on isLoading
  const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);
  const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <Background />
      <View style={{paddingHorizontal: 5, paddingTop: 5}}>
        <View style={{height: '100%'}}>
          {/* Render your UI elements here */}
          <View style={homeStyle.topRectangle}>
            <Text
              style={{
                alignSelf: 'center',
                fontWeight: 'bold',
                color: 'white',
                fontSize: 20,
              }}>
              {role}
            </Text>
            <AnimatedTouchableOpacity
              id="tarButton"
              style={[styles.button, blockStyle1]}
              onPress={() => {
                isRecording ? stopRecording() : startRecording();
              }}>
              <Text style={styles.buttonText}>
                {isRecording
                  ? `Stop`
                  : `Speak in ${targetLanguage}`}
              </Text>
            </AnimatedTouchableOpacity>
            {animation.value === 1 && ( // Adjust this condition based on your exact requirements
              <AnimatedFastImage
                source={require('../screens/assets/maroon.gif')} // Adjust path as necessary
                style={gifStyle}
              />
            )}
            <View style={{alignSelf: 'center', width: 60}}>
              <TouchableOpacity
                id="respButton"
                style={[
                  styles.responseButton,
                  playingAnim ? {display: 'none'} : {},
                ]}
                onPress={handlePress}>
                <Image source={imageSource} style={{width: 50, height: 50}} />
              </TouchableOpacity>
            </View>
          </View>
          {isLoading && (
            // Show loading text or spinner while waiting for the response
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}
          <View style={styles.chatView}>
            <ScrollView style={{height: '80%'}}>
              <View>
                {rolePlayResult &&
                  rolePlayResult.rolePlayData.map((item, index) => (
                    <View key={index}>
                      <View style={styles.chatSectionCon}>
                        <Text style={styles.concatenatedChat}>{item.user}</Text>
                      </View>
                      <View style={styles.chatSectionResp}>
                        <Text style={styles.chatResponse}>{item.response}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RolePlayConversation;
