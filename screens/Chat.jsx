import React, {useState, useContext, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Appearance,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView} from 'react-native-gesture-handler';
import {OPENAI_KEY} from '@env';
import Imagepath from '../screens/assets/ImagePath';
import Background, {homeStyle} from './Background';
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
import {AppContext} from '../App';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Chat = () => {
  const {learnGrammarClicked, setLearnGrammarClicked} = useContext(AppContext);
  const {makeConversationClicked, setMakeConversationClicked} =
    useContext(AppContext);
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [isComfRecording, setComfRecording] = useState(false);
  const [isTarRecording, setTarRecording] = useState(false);
  const [comfTranscription, setComfTranscription] = useState('');
  const [tarTranscription, setTarTranscription] = useState('');
  const [sound, setSound] = useState(null);
  const [savedComfUri, setSavedComfUri] = useState(null);
  const [savedTarUri, setSavedTarUri] = useState(null);
  const [chatResult, setChatResult] = useState('');
  const [comfortableLang, setComfortableLang] = useState('');
  const [comfortableWhisper, setComfortableWhisper] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageWhisper, setTargetLanguageWhisper] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAnim, setPlayingAnim] = useState(false);
  const [langlevel, setLevel] = useState('');
  const [voiceInterface, setVoiceInterface] = useState('');
  const [userHistory, setUserHistory] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [stopProcessFinished, setStopProcessFinished] = useState(false);
  const [grammarTopic, setGrammarTopic] = useState('');
  const [grammarHist, setHistResult] = useState('');
  const [componentKey, setComponentKey] = useState(0);

  const route = useRoute();
  let emailHolder = route.params?.email;

  const handleLearnGrammarClick = () => {
    setLearnGrammarClicked(true);
  };

  const handleMakeConversationClick = () => {
    setMakeConversationClicked(true);
  };

  // Fetch data logic wrapped inside useCallback to avoid infinite loops
  const fetchUserData = useCallback(async () => {
    const formData = new FormData();
    formData.append('email', await AsyncStorage.getItem('may'));
    try {
      const chatDataRec = await fetch(`http://3.7.217.207/chatData`, {
        method: 'POST',
        body: formData,
      });
      const textData = await chatDataRec.json();
      setChatResult(textData);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
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

    const grammarHist = new FormData();
    grammarHist.append('email', await AsyncStorage.getItem('may'));
    try {
      const chatDataRec = await fetch(`http://3.7.217.207/getGrammarHis`, {
        method: 'POST',
        body: grammarHist,
      });
      const textData = await chatDataRec.json();
      setHistResult(textData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Use useFocusEffect to call fetchData when the component comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      // Optional: Return a cleanup function if necessary
      return () => {
        // Cleanup tasks if needed
        console.log('Cleanup on blur');
      };
    }, [fetchUserData]),
  );

  useEffect(() => {
    const getLesson = async () => {
      const grammarLessonCred = new FormData();
      grammarLessonCred.append('email', await AsyncStorage.getItem('may'));
      grammarLessonCred.append(
        'targetLang',
        await AsyncStorage.getItem('TARGETLANGUAGE'),
      );
      try {
        const response = await fetch(`http://3.7.217.207/grammarLesson`, {
          method: 'POST',
          body: grammarLessonCred,
        });
        const grammarData = await response.json();
        // Access the next topic name from the response
        const nextTopic = grammarData.next_topic_name;
        setGrammarTopic(nextTopic);
        // await AsyncStorage.setItem('crnTpc', nextTopic);
      } catch (error) {
        console.error(error);
      }
    };
    getLesson();
  }, [learnGrammarClicked]);

  useEffect(() => {
    const fetchData = async () => {
      const level = await AsyncStorage.getItem('LEVEL');
      const voice = await AsyncStorage.getItem('VOICE');
      if (comfortableLang === 'English') {
        setComfortableWhisper('en');
      } else if (comfortableLang === 'German') {
        setComfortableWhisper('de');
      } else if (comfortableLang === 'French') {
        setComfortableWhisper('fr');
      } else if (comfortableLang === 'Spanish') {
        setComfortableWhisper('es');
      } else if (comfortableLang === 'Dutch') {
        setComfortableWhisper('nl');
      } else if (comfortableLang === 'Italian') {
        setComfortableWhisper('it');
      } else if (comfortableLang === 'Arabic') {
        setComfortableWhisper('ar');
      } else if (comfortableLang === 'Hindi') {
        setComfortableWhisper('hi');
      } else if (comfortableLang === 'Chinese') {
        setComfortableWhisper('cn');
      }
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
      setVoiceInterface(voice);
    };
    fetchData();
  }, [comfortableLang, targetLanguage]);

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

  const startComfRecording = async () => {
    setComfRecording(true);
    setComfTranscription('');
    setHasVoiceInput(true);
    try {
      const path = Platform.select({
        ios: 'comfRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/comfRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setSavedComfUri(result);
    } catch (error) {
      console.log(error);
    }
  };

  const startTarRecording = async () => {
    setTarRecording(true);
    setHasVoiceInput(true);
    setComfRecording(false);
    setTarTranscription('');
    try {
      const path = Platform.select({
        ios: 'tarRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/tarRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setSavedTarUri(result);
    } catch (error) {
      console.log(error);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setComfRecording(false);
      setTarRecording(false);
      let formData = new FormData();
      formData.append('model', 'whisper-1');
      if (Platform.OS === 'ios') {
        if (savedComfUri) {
          formData.append('language', comfortableWhisper);
          // console.log('uri', savedComfUri);
          formData.append('file', {
            uri: `file://${savedComfUri}`,
            type: 'audio/m4a',
            name: 'comfRecording.m4a',
          });
        }
        if (savedTarUri) {
          formData.append('language', targetLanguageWhisper);
          formData.append('file', {
            uri: `file://${savedTarUri}`,
            type: 'audio/m4a',
            name: 'tarRecording.m4a',
          });
        }
      } else if (Platform.OS === 'android') {
        if (savedComfUri) {
          formData.append('language', comfortableWhisper);
          // console.log('uri', savedComfUri);
          formData.append('file', {
            uri: `file://${savedComfUri}`,
            type: 'audio/mp4',
            name: 'comfRecording.mp4',
          });
        }
        if (savedTarUri) {
          formData.append('language', targetLanguageWhisper);
          // console.log('uri', savedTarUri);
          formData.append('file', {
            uri: `file://${savedTarUri}`,
            type: 'audio/mp4',
            name: 'tarRecording.mp4',
          });
        }
      }

      let apiKey = `${OPENAI_KEY}`;

      if (savedComfUri && comfTranscription === '') {
        const fileExists = await RNFS.exists(savedComfUri);
        if (!fileExists) {
          setComfRecording(false);
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
          // console.log('comf transcription data:', comfResult.text);
          setComfTranscription(comfResult.text);
        } catch (error) {
          console.error('An error occurred:', error);
          if (error.message === 'Request timed out') {
            Alert.alert(
              'Timeout',
              'The request timed out. Please try again later.',
            );
          } else {
            Alert.alert('Error', 'An error occurred. Please try again later.');
          }
        }
        setComfRecording(false);
      }
      if (savedTarUri && tarTranscription === '') {
        const tarFileExists = await RNFS.exists(savedTarUri);
        if (!tarFileExists) {
          setTarRecording(false);
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
          const tarResult = await comfAudioResponse.json();
          // console.log('comf transcription data:', tarResult.text);
          setTarTranscription(tarResult.text);
        } catch (error) {
          console.error('An error occurred:', error);
          if (error.message === 'Request timed out') {
            Alert.alert(
              'Timeout',
              'The request timed out. Please try again later.',
            );
          } else {
            Alert.alert('Error', 'An error occurred. Please try again later.');
          }
        }
        setTarRecording(false);
      }
      formData = new FormData();

      if (learnGrammarClicked) {
        const grammarHist = new FormData();
        grammarHist.append('email', await AsyncStorage.getItem('may'));
        try {
          const chatDataRec = await fetch(
            `http://3.7.217.207/getGrammarHis`,
            {
              method: 'POST',
              body: grammarHist,
            },
          );
          const textData = await chatDataRec.json();
          setHistResult(textData);
          // console.log('grammar : ', textData);
        } catch (error) {
          console.error(error);
        }
      } else if (makeConversationClicked) {
        try {
          const response = await fetch('http://3.7.217.207/chathistory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: await AsyncStorage.getItem('may'),
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          // console.log('history data:', data);
          setUserHistory(data.chatHistory);
        } catch (error) {
          console.error('Error fetching chat history:', error.message);
        }
      }
      setRecordSecs(0);
      setComfRecording(false);
      setTarRecording(false);
    } catch (error) {
      console.log(error);
    }
    console.log('in stop reacording end')
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
  const goToNextTopic = async () => {
    console.log('in go to next ');
    const nextGramCred = new FormData();
    nextGramCred.append('email', await AsyncStorage.getItem('may'));
    nextGramCred.append('currentTopic', grammarTopic);
    try {
      const histData = await fetch(`http://3.7.217.207/setNextGramSection`, {
        method: 'POST',
        body: nextGramCred,
      });
    } catch (error) {
      console.error(error);
    } finally {
      const grammarLessonCred = new FormData();
      grammarLessonCred.append('email', await AsyncStorage.getItem('may'));
      grammarLessonCred.append(
        'targetLang',
        await AsyncStorage.getItem('TARGETLANGUAGE'),
      );
      try {
        const response = await fetch(`http://3.7.217.207/grammarLesson`, {
          method: 'POST',
          body: grammarLessonCred,
        });
        const grammarData = await response.json();
        // Access the next topic name from the response
        const nextTopic = grammarData.next_topic_name;
        setGrammarTopic(nextTopic);
        // await AsyncStorage.setItem('crnTpc', nextTopic);
        // Force re-render by updating the key
        setComponentKey(prevKey => prevKey + 1);
      } catch (error) {
        console.error(error);
      }
    }
  };
  const fetchDataFromLLM = async prompt => {
    const apiKey = `${OPENAI_KEY}`;
    const data = {
      model: 'gpt-4o-mini',
      messages: [{role: 'system', content: prompt}],
      response_format: {type: 'json_object'},
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
        8000, // 8 seconds timeout
      );
      const responseData = await response.json();
      return responseData; // Return the response data
    } catch (error) {
      console.error('Error fetching data from OpenAI:', error);
      throw error; // Rethrow the error
    }
  };

  useEffect(() => {
    if (stopProcessFinished && hasVoiceInput) {
      startAnimation();
      fetchAndPlayAudio();
    } else if (stopProcessFinished && !hasVoiceInput) {
      setPlayingAnim(false);
      Alert.alert('There is no input data');
      setStopProcessFinished(false);
    }
  }, [stopProcessFinished]);

  const fetchAndPlayAudio = async () => {
    console.log('in fetech and play stat')
    if (learnGrammarClicked) {
      setIsLoading(true);
      setPlayingAnim(true);
      setHasVoiceInput(false);

      console.log('in prompt');
      let prompt;

      prompt = `Given a user's input enclosed in triple tildes, generate a JSON object with 
                two keys: 'LectureContent' and 'Response'. The 'LectureContent' key should contain an explanation about
                ${grammarTopic}. If the text inside triple tildes contains question or doubt from the user, The 'Response' key should contain respose it.  
      {
        'LectureContent': 'The present tense is a grammatical tense whose principal function is to locate a situation or event in the present time. The present tense is used for actions in a time happening now.',
        'Reponse': 'Im good. How are you ?'
      }
        ~~~${comfTranscription}${tarTranscription}~~~ `;
      // console.log('prompt:', prompt);
      try {
        const responseData = await fetchDataFromLLM(prompt);
        const messageContent = JSON.parse(
          responseData.choices[0].message.content,
        );
        const lecture = messageContent.LectureContent;
        const useResponse = messageContent.Response;
        const userInput = comfTranscription + tarTranscription;
        // console.log('chat response', responseData.choices[0].message);

        callTTS(lecture + useResponse, voiceInterface || 'alloy');
        const grammarData = new FormData();
        grammarData.append('email', await AsyncStorage.getItem('may'));
        grammarData.append('data', lecture + useResponse);
        grammarData.append('userInput', userInput);
        grammarData.append('currentTopic', grammarTopic);
        try {
          const histData = await fetch(`http://3.7.217.207/grammarHisSave`, {
            method: 'POST',
            body: grammarData,
          });
        } catch (error) {
          console.error(error);
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setPlayingAnim(false);
        if (error.message === 'Request timed out') {
          Alert.alert(
            'Timeout',
            'The request timed out. Please try again later.',
          );
        } else {
          Alert.alert('Error', 'An error occurred. Please try again later.');
        }
      }

      const grammarHist = new FormData();
      grammarHist.append('email', await AsyncStorage.getItem('may'));
      try {
        const chatDataRec = await fetch(`http://3.7.217.207/getGrammarHis`, {
          method: 'POST',
          body: grammarHist,
        });
        const textData = await chatDataRec.json();
        setHistResult(textData);
        // console.log('grammar : ', textData);
      } catch (error) {
        console.error(error);
      }
      console.log('passed !!');
      setSavedComfUri(null);
      setIsLoading(false);
      setSavedTarUri(null);
      setComfRecording(false);
      setTarRecording(false);
      setTarTranscription('');
      setComfTranscription('');
      setStopProcessFinished(false);
    } else if (makeConversationClicked) {
      setIsLoading(true);
      setPlayingAnim(true);
      setHasVoiceInput(false);

      let apiKey = `${OPENAI_KEY}`;

      console.log('in prompt');
      let prompt;
      if (!savedTarUri) {
        console.log('in first');
        console.log('input', comfTranscription);
        prompt = `Your name is Tookee. User wants to have a conversation with you. The previous history of your chat with the user will be
        given inside triple asterisks. The input from the user for you to analyse will be inside the triple back ticks.
        I want you to generate a json response with two keys: advice and content. The following is a sample json
        output and instruction is also given inside it for each of the key's value on how the output should be like.
        For the advice json value, correct the grammar mistakes of the text in UserInput in ${targetLanguage} 
        if there are any, if not keep it empty.-> {
            "advice": " ",
            "content": "After analysis of the user's input and his intention, make a reply to the user in response to what the user asked. Just give the reply part in two sentences. And then a question back to the user related to the context and what he asked."
        }
        *** ${userHistory} ***   \`\`\`UserInput: ${comfTranscription}${tarTranscription} \`\`\`  `;
      } else {
        console.log('in second');
        prompt = `Your name is Tookee. User wants to learn ${targetLanguage}. His current level in ${targetLanguage} is ${langlevel}.
        He is comfortable in ${comfortableLang}. Depending on his current level, respond.
        If his level is beginner, start with simple greetings, how to do self-introduction, etc.
        Use scenarios from everyday life that he might encounter. For example, ordering food in a restaurant,
        asking for directions, etc. Inside the triple tildes, the user's input, which is in his comfortable language, i.e., 
        ${comfortableLang} will be given and his intention.In the triple back ticks, the user's input in the language he 
        intends to study, i.e., ${targetLanguage}.I want you to engage with the user.
        The previous history of your chat with the user will be given inside triple asterisks.
        I want you to generate a json response with four keys: aaa, bbb and ccc. Do not mention anything about 
        the triple backticks in the output.
        The following is a sample json output and instruction is also given inside it for each key's value
        on how the output should be like -> {
            "aaa": "Correct the grammar mistakes of ${targetLanguage} if there are any for the text inside triple backticks and explain it in ${comfortableLang}. Only generate the explanation part. Do not mention anything about triple backticks in the output.",
            "bbb": "After analysis of the user's intention in the text inside triple tildes and backticks. Give the correct usage of the text inside triple backticks which the user was trying to say, and strictly in ${targetLanguage}. Give just the corrected sentence.",
            "ccc": "After analysis of the user's intention in the text inside triple tildes and backticks which are intended towards you, give response to it and ask a question back as if the user was talking to you, related to the context in ${targetLanguage}.Don't give any text in ${comfortableLang} or inside (), in the response.",
        }
        *** ${userHistory} ***  ~~~ ${comfTranscription} ~~~  \`\`\` ${tarTranscription} \`\`\` `;
      }

      const data = {
        model: 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt}],
        response_format: {type: 'json_object'},
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
        const messageContent = JSON.parse(
          responseData.choices[0].message.content,
        );
        // console.log('chat response', responseData.choices[0].message);
        let chatDisplay;
        let chatWholeData;
        if (!savedTarUri) {
          const advice = messageContent.advice;
          const responseMain = messageContent.content;
          if (advice.length > 1) {
            //both advice and content
            const text = 'Advice:' + advice + '.Response:' + responseMain;
            callTTS(responseMain, voiceInterface || 'alloy');
            chatDisplay =
              'Advice: ' + advice + '\n' + 'Response: ' + responseMain;
            chatWholeData =
              'User: ' + comfTranscription + '  You: ' + advice + responseMain;
          } else {
            // only content
            callTTS(responseMain, voiceInterface || 'alloy');
            chatDisplay = responseMain;
            chatWholeData =
              'User: ' + comfTranscription + '  You: ' + responseMain;
          }
          try {
            const chatData = new FormData();
            chatData.append('chat_display', chatDisplay);
            chatData.append('chat_whole', chatWholeData);
            chatData.append('comfInput', comfTranscription);
            chatData.append('tarInput', tarTranscription);
            chatData.append('email', await AsyncStorage.getItem('may'));
            const response = await fetch(`http://3.7.217.207/chatSave`, {
              method: 'POST',
              body: chatData,
            });
            const dataHolder = await response.json();
          } catch (error) {
            console.error(error);
          }
        } else {
          // send to backend advice + correct usage + response + error
          const advice = messageContent.aaa;
          const correction = messageContent.bbb;
          const response = messageContent.ccc;

          const text =
            'Advice:' +
            advice +
            'Correct Usage:' +
            correction +
            'Response:' +
            response;
          callTTS(response, voiceInterface || 'alloy');
          chatDisplay =
            'Advice: ' +
            advice +
            '\n' +
            'Correct Usage: ' +
            correction +
            '\n' +
            'Response: ' +
            response;
          chatWholeData =
            'User: {' +
            comfTranscription +
            tarTranscription +
            '}  You: ' +
            '{ advice: ' +
            advice +
            ' Correction :' +
            correction +
            'Response: ' +
            response +
            '}';
          try {
            const chatData = new FormData();
            chatData.append('chat_display', chatDisplay);
            chatData.append('chat_whole', chatWholeData);
            chatData.append('comfInput', comfTranscription);
            chatData.append('tarInput', tarTranscription);
            chatData.append('email', await AsyncStorage.getItem('may'));
            const response = await fetch(`http://3.7.217.207/chatSave`, {
              method: 'POST',
              body: chatData,
            });
            const holder = await response.json();
          } catch (error) {
            console.error(error);
          }
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setPlayingAnim(false);
        if (error.message === 'Request timed out') {
          Alert.alert(
            'Timeout',
            'The request timed out. Please try again later.',
          );
        } else {
          Alert.alert('Error', 'An error occurred. Please try again later.');
        }
      }
      console.log('passed !!');
      const chatList = new FormData();
      chatList.append('email', await AsyncStorage.getItem('may'));
      try {
        const chatDataRec = await fetch(`http://3.7.217.207/chatData`, {
          method: 'POST',
          body: chatList,
        });
        const textData = await chatDataRec.json();
        setChatResult(textData);
      } catch (error) {
        console.error(error);
      }

      setSavedComfUri(null);
      setIsLoading(false);
      setSavedTarUri(null);
      setComfRecording(false);
      setTarRecording(false);
      setTarTranscription('');
      setComfTranscription('');
      setStopProcessFinished(false);
    }
  };

  const playAudio = async (filePath, callback) => {
    console.log('Attempting to play sound:', filePath);
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
            setIsLoading(false);
            setPlayingAnim(false);
            console.log('Sound played successfully');

            if (callback && typeof callback === 'function') {
              callback(); // Execute the callback function
            }
          }
          newSound.release();
        });
      }
    });
    setSound(newSound);
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
        10000, // Timeout in milliseconds (e.g., 10000ms = 10 seconds)
      );
      if (!audioResponse.ok) {
        throw new Error(`HTTP error! status: ${audioResponse.status}`);
      }
      const arrayBuffer = await audioResponse.arrayBuffer();
      const base64String = base64.encodeFromByteArray(
        new Uint8Array(arrayBuffer),
      );
      await RNFS.writeFile(speechFile, base64String, 'base64');
      // console.log('File saved at:', speechFile);
      playAudio(speechFile);
    } catch (error) {
      console.error('An error occurred:', error);
      setIsLoading(false);
      setPlayingAnim(false);
      if (error.message === 'Request timed out') {
        Alert.alert(
          'Timeout',
          'The request timed out. Please try again later.',
        );
      } else {
        Alert.alert('Error', 'tttAn error occurred. Please try again later.');
      }
    }
  };
  const colorScheme = Appearance.getColorScheme();
  let imageSource;
  if (colorScheme === 'light') {
    imageSource = Imagepath.icArrowDark;
  } else if (colorScheme === 'dark') {
    imageSource = Imagepath.icArrowDark; // replace with your dark image
  }
  const styles = StyleSheet.create({
    // backgroundStyle: {
    //   backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    // },
    topRectangle: {
      width: '100%',
      height: learnGrammarClicked ? 190 : 160,
      backgroundColor: '#A6B4F2',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
    },
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white', // Set the background color to black
      paddingHorizontal: 5,
      paddingVertical: 5,
      borderRadius: 5,
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
    comfButton: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 20,
      marginRight: 10, // Add margin between buttons
      zIndex: 1,
    },

    tarButton: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 20,
      zIndex: 1,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black', // Set text color to white
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    chatSectionCon: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? '#7F86F2' : 'white', // Set the border color
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
      borderColor: colorScheme === 'light' ? '#7F86F2' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      marginBottom: 5,
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
    pulsingCircle: {
      width: 100,
      height: 100,
      backgroundColor: 'blue',
      borderRadius: 50,
    },
    internalContainer: {
      paddingHorizontal: 10,
      // paddingVertical: 2,
      borderRadius: 10, // Add borderRadius for the container
      backgroundColor: colorScheme === 'light' ? 'white' : 'white',
      // marginVertical: 5,
      marginBottom: 5,
      paddingVertical: 10,
    },
    firstContainer: {
      paddingTop: 100,
      alignItems: 'center',
      borderRadius: 10,
      // backgroundColor: colorScheme === 'light' ? 'lightgrey' : 'lightgrey',
      alignSelf: 'center',
      height: '100%',
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
  const isLanguagesDifferent = comfortableLang !== targetLanguage;
  const translateXParams = isLanguagesDifferent ? [0, 55] : [0, 5]; // Example adjustment

  const blockStyle1 = useAnimatedStyle(() => {
    const translateX = interpolate(animation.value, [0, 1], translateXParams); // Move to the right
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

  const blockStyle2 = useAnimatedStyle(() => {
    const translateX = interpolate(animation.value, [0, 1], [0, -55]); // Move to the left
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
  // const startAnimation = () => {
  //   animation.value = withTiming(1, {duration: 1000});
  // };
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
  const LearnGrammar = Animated.createAnimatedComponent(FastImage);
  const AnimatedImage = Animated.createAnimatedComponent(Image);

  return (
    <View key={componentKey}>
    <SafeAreaView style={styles.backgroundStyle}>
      {learnGrammarClicked || makeConversationClicked ? (
        <View style={{height: '100%'}}>
          <Background />
          <View style={{paddingHorizontal: 5, paddingTop: 5}}>
            <View style={styles.topRectangle}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }}>
                <AnimatedTouchableOpacity
                  id="comfButton"
                  style={[styles.comfButton, blockStyle1]}
                  onPress={() =>
                    isComfRecording ? stopRecording() : startComfRecording()
                  }
                  disabled={playingAnim}>
                  {!playingAnim && (
                    <Text style={styles.buttonText}>
                      {isComfRecording ? `Stop` : `Speak \n${comfortableLang}`}
                    </Text>
                  )}
                </AnimatedTouchableOpacity>
                <AnimatedTouchableOpacity
                  id="tarButton"
                  style={[
                    styles.tarButton,
                    blockStyle2,
                    comfortableLang !== targetLanguage ? {} : {display: 'none'},
                  ]}
                  onPress={() =>
                    isTarRecording ? stopRecording() : startTarRecording()
                  }
                  disabled={!isLanguagesDifferent || playingAnim}>
                  {!playingAnim && (
                    <Text style={styles.buttonText}>
                      {isTarRecording ? `Stop` : `Speak \n${targetLanguage}`}
                    </Text>
                  )}
                </AnimatedTouchableOpacity>
                {animation.value === 1 && (
                  <AnimatedFastImage
                    source={require('../screens/assets/maroon.gif')}
                    style={gifStyle}
                  />
                )}
              </View>
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
                {learnGrammarClicked && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        position: 'absolute',
                        left: 80,
                        top: 20,
                        width: 120,
                      },
                      playingAnim ? {display: 'none'} : {},
                    ]}
                    onPress={goToNextTopic}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colorScheme === 'light' ? '#7F86F2' : '#7F86F2',
                        fontWeight: 'bold',
                      }}>
                      Change topic
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}

          <View style={styles.container}>
            {makeConversationClicked ? (
              <View style={styles.chatView}>
                <ScrollView
                  style={{height: '100%'}}
                  contentContainerStyle={{paddingBottom: 180}}>
                  {chatResult &&
                    chatResult.chatData.map((chat, index) => (
                      <View key={index}>
                        <View style={styles.chatSectionCon} id="userChat">
                          <Text style={styles.concatenatedChat}>
                            {chat.concatenated_chat}
                          </Text>
                        </View>
                        <View style={styles.chatSectionResp} id="responseChat">
                          <Text style={styles.chatResponse}>
                            {chat.chatResponse}
                          </Text>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              </View>
            ) : learnGrammarClicked ? (
              <View style={styles.chatView}>
                <ScrollView
                  style={{height: '100%'}}
                  contentContainerStyle={{paddingBottom: 180}}>
                  {grammarHist && grammarHist.length > 0 ? (
                    <>
                    <View style={{width:'95%', alignItems:'center'}}>
                      <View style={styles.internalContainer}>
                      <Text style={{fontWeight: 'bold', alignSelf: 'center', color:'black'}}>
                        You are learning about -
                        {grammarTopic}
                      </Text>
                      </View>
                      </View>
                      {grammarHist.map((entry, index) => (
                        <View key={index}>
                          {entry.userPart && entry.userPart.trim() !== '' && (
                            <View
                              style={styles.chatSectionCon}
                              id={`userChat_${index}`}>
                              <Text style={styles.concatenatedChat}>
                                {entry.userPart}
                              </Text>
                            </View>
                          )}
                          <View
                            style={styles.chatSectionResp}
                            id={`responseChat_${index}`}>
                            <Text style={styles.chatResponse}>
                              {entry.grammarPart}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={{paddingHorizontal: 20}}>
                      <View style={styles.internalContainer}>
                        <Text style={{fontWeight: 'bold', alignSelf: 'center', color:'black'}}>
                          First we will start with {' '}
                          {grammarTopic}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.firstContainer}>
          <View>
            <View style={{paddingHorizontal: 20}}>
              <View style={{paddingVertical: 20}}>
                <TouchableOpacity onPress={handleLearnGrammarClick}>
                  <Image
                    source={require('../screens/assets/learn_grammar.gif')}
                    style={{
                      width: 350,
                      height: 140,
                      borderRadius: 20,
                      paddingVertical: 30,
                      paddingHorizontal: 20,
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View>
                <TouchableOpacity onPress={handleMakeConversationClick}>
                  <Image
                    source={require('../screens/assets/do_conv.gif')}
                    style={{
                      width: 350,
                      height: 140,
                      borderRadius: 20,
                      paddingTop: 120,
                      paddingHorizontal: 20,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
    </View>
  );
};

export default Chat;
