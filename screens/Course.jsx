import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import {Appearance} from 'react-native';
import {SafeAreaView, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView} from 'react-native-gesture-handler';
import {Dimensions} from 'react-native';
import {OPENAI_KEY} from '@env';
import Progress from './Progress';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Course = () => {
  const [savedUri, setSavedUri] = useState(null);
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [voiceInterface, setVoiceInterface] = useState('');
  const [sound, setSound] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [endOfcourse, setEndOfCourse] = useState(false);
  const [isStart, setIsStart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [chapterTopics, setChapterTopics] = useState([]);
  const [progressResponse, setProgressResponse] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [noCourseAvailable, setNoCourseAvailable] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [targetLanguageWhisper, setTargetLanguageWhisper] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [stopProcessFinished, setStopProcessFinished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');

  const route = useRoute();
  let emailHolder = route.params?.email;

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
    const fetchDataCourse = async () => {
      const level = await AsyncStorage.getItem('LEVEL');
      const voice = await AsyncStorage.getItem('VOICE');
      if (targetLanguage === 'English'){
        setTargetLanguageWhisper('en');
      } else if(targetLanguage === 'German') {
        setTargetLanguageWhisper('de');
      } else if(targetLanguage === 'French'){
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
      setVoiceInterface(voice);
      setDataLoaded(true);
    };
    fetchDataCourse();
  },[targetLanguage]);     // dont put [] coz this should run everytime a language has been changed

  useEffect(() => {
    if (!targetLanguage || !dataLoaded) return; // Only proceed if targetLanguage is not null and data is loaded

    const getCourseDetails = async () => {
      const formData = new FormData();
      formData.append('tarLang', targetLanguage);
      formData.append('email', await AsyncStorage.getItem('may'));
      try {
        const response = await fetch(`http://3.7.217.207/getCourseDetails`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setChapterTopics(data);
        console.log('chpa:', chapterTopics);
      } catch (error) {
        console.error(error);
        setNoCourseAvailable(true);
      }
    };

    getCourseDetails();
  }, [targetLanguage, dataLoaded]);

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

  const loadingText = `Preparing${'.'.repeat(loadingDots)}`; // Create loading text with dots
  

  const startRecording = async () => {
    try {
      if (audioRecorderPlayer.isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      const path = Platform.select({
        ios: 'courseRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/courseRecording.mp4`,
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
      setRecordSecs(0);
      setIsRecording(false);
      setHasVoiceInput(true);
      const formData = new FormData();
      formData.append('model', 'whisper-1');
      if (Platform.OS === 'ios') {
        if (savedUri) {
          formData.append('language', targetLanguageWhisper);
          formData.append('file', {
            uri: `file://${savedUri}`,
            type: 'audio/m4a',
            name: 'courseRecording.m4a',
          });
        }
      } else if (Platform.OS === 'android') {
        if (savedUri) {
          formData.append('language', targetLanguageWhisper);
          formData.append('file', {
            uri: `file://${savedUri}`,
            type: 'audio/mp4',
            name: 'courseRecording.mp4',
          });
        }
      }
      let apiKey = `${OPENAI_KEY}`;
      if (savedUri && transcription === '') {
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
            6000 // Timeout in milliseconds (e.g., 10000ms = 10 seconds)
          );
          if (!comfAudioResponse.ok) {
            throw new Error(`HTTP error! status: ${comfAudioResponse.status}`);
          }
          const comfResult = await comfAudioResponse.json();
          console.log('comf transcription data:', comfResult.text);
          setTranscription(comfResult.text);
        } catch (error) {
          console.error('An error occurred:', error);
          if (error.message === 'Request timed out') {
            Alert.alert('Timeout', 'The request timed out. Please try again later.');
          } else {
            Alert.alert('Error', 'An error occurred. Please try again later.');
          }
        }
        setIsRecording(false);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setStopProcessFinished(true);
    }
  };

  useEffect(() => {
    if (transcription) {
      sendGenerateAudioRequest();
    }
  }, [transcription]);

  const sendGenerateAudioRequest = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('tarLang', targetLanguage);
    formData.append('comfLang', comfortableLang);
    formData.append('email', await AsyncStorage.getItem('may'));
    formData.append('level', langlevel);
    formData.append('voice', voiceInterface);
    formData.append('comfResult', transcription);
    try {
      const audioResponse = await fetch(`http://3.7.217.207/teach_course`, {
        method: 'POST',
        body: formData,
      });
      const data = await audioResponse.json();
      if (data.llm_status === 'failed') {
        setIsLoading(false);
        Alert.alert(
          'Due to high demand we are facing some issue, please try again with a new recording',
        );
        return;
      }

      setResponseText(data.content);
      setProgressResponse(data.progress);
      if (data.endOfCourse === 'yes') {
        setEndOfCourse(true);
      }
      if (data.start === 'no') {
        setIsStart(false);
        setShowNext(true);
      }
      const audioData = data.audio;
      if (data.audio != null) {
        const audioFilePath = await saveAudioToLocalFile(audioData);
        if (audioFilePath) {
          playAudio(audioFilePath);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
    setIsRecording(false);
    setSavedUri(null);
  };
  const saveAudioToLocalFile = async base64Data => {
    const audioFilePath = `${RNFS.CachesDirectoryPath}/courseAudio.wav`;

    try {
      await RNFS.writeFile(audioFilePath, base64Data, 'base64');
      return audioFilePath;
    } catch (error) {
      console.error('Error saving audio to local file:', error);
      return null;
    }
  };
  const playAudio = async filePath => {
    if (sound) {
      sound.release();
    }
    const newSound = new Sound(filePath, '', async error => {
      if (error) {
        console.error('Error loading sound:', error);
      } else {
        console.log('Sound loaded successfully');

        newSound.play(async success => {
          if (!success) {
            console.error('Error playing sound');
          } else {
            console.log('Sound played successfully');
          }
          newSound.release();
        });
      }
    });
    setSound(newSound);
  };
  const goToNext = () => {
    sendGenerateAudioRequest();
  };
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
  const colorScheme = Appearance.getColorScheme();
  const screenWidth = Dimensions.get('window').width;
  const isIOS = Platform.OS === 'ios';
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    buttonLeft: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      borderRadius: 5,
    },
    buttonRight: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      // paddingHorizontal: 20,
      paddingVertical: 10,
      alignSelf: 'flex-end',
      borderRadius: 5,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
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
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'lightgrey' : 'lightgrey',
      alignSelf: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15,
    },
    textSection: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 275,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? '#7F86F2' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'black' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      marginBottom: 5,
      fontSize: 20,
      alignItems: 'center',
    },
    textDisplay: {
      color: colorScheme === 'light' ? 'white' : 'black',
      paddingLeft: 35,
    },
    image: {
      flex: 1,
      // justifyContent: 'center',
      width: screenWidth,
    },
  });

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      {/* <Background/> */}

      <View style={{height: '100%'}}>
        <View style={{alignSelf: 'center', paddingTop: 5}}>
          {isStart === true && chapterTopics.length > 0 && (
            // The Start button will only render if isStart is true and chapterTopics is not empty
            <TouchableOpacity style={styles.button} onPress={goToNext}>
              <Text style={styles.buttonText}>Start the course</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading && (
          // Show loading text or spinner while waiting for the response
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}

        <ScrollView>
          <Progress
            chapters={chapterTopics}
            response={responseText}
            progressResp={progressResponse}
            targetLanguage={targetLanguage}
            comfortableLang={comfortableLang}
          />
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            paddingBottom: isIOS ? 112 : 64,
            justifyContent: 'space-around',
            backgroundColor: 'transparent',
          }}>
          {showNext && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                isRecording ? stopRecording() : startRecording();
              }}>
              <Text style={styles.buttonText}>
                {isRecording
                  ? `Stop Recording ${comfortableLang}`
                  : `Ask a doubt ${comfortableLang}`}
              </Text>
            </TouchableOpacity>
          )}
          {showNext && ( // Conditionally render Next button
            <TouchableOpacity style={styles.button} onPress={goToNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Course;