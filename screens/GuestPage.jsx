import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Appearance,
  StyleSheet,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {ScrollView} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {OPENAI_KEY} from '@env';

const targetLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
];

function GuestPage() {
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState(null);
  const [chapterTopics, setChapterTopics] = useState([]);
  const [noCourseAvailable, setNoCourseAvailable] = useState(false);
  const [result, setResult] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingDots, setLoadingDots] = useState(1);

  const navigation = useNavigation(); // Get navigation object

  useEffect(() => {
    if (!selectedTargetLanguage) return; // Only proceed if targetLanguage is not null and data is loaded

    const getCourseDetails = async () => {
      const formData = new FormData();
      formData.append('tarLang', selectedTargetLanguage);
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
  }, [selectedTargetLanguage]);

  const toLogin = () => {
    navigation.navigate('Login');
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    container: {
      //   flex: 1,
      //   justifyContent: 'center',
      //   alignItems: 'center',
      paddingHorizontal: 10,
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
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
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
      flex: 1, // Ensure it takes the full height
    },
    chapterContainer: {
      backgroundColor: colorScheme === 'light' ? '#927E5D' : '#EC5C22',
      borderRadius: 20,
      marginVertical: 10,
      padding: 10,
      paddingHorizontal: 10,
      paddingVertical: 3,
      height: 'auto',
      verticalAlign: 'middle',
    },
    topicContainer: {
      backgroundColor: colorScheme === 'light' ? '#CC8A1D' : '#C4920B',
      borderRadius: 20,
      paddingVertical: 2,
      paddingHorizontal: 10,
      height: 'auto',
      verticalAlign: 'middle',
      marginVertical: 5,
    },
    chapterTitle: {
      fontWeight: 'bold',
      fontSize: 23,
      color: colorScheme === 'light' ? 'black' : 'black',
    },
    topicTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      color: colorScheme === 'light' ? 'black' : 'black',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'white' : 'lightgrey',
      alignSelf: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15,
      color: 'black',
    },
    displayText: {
      color: colorScheme === 'light' ? 'black' : 'black',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
    },
  });

  const indiExplanation = async item => {
    setResult('');
    setIsLoadingContent(true);
    setSelectedItem(item);
    let apiKey = `${OPENAI_KEY}`;
    const prompt = `Your are teaching about ${selectedTargetLanguage} language in english. Briefly 
                    explain about ${item} in the ${selectedTargetLanguage} language in a single paragraph.`;
    const data = {
      model: 'gpt-3.5-turbo-0125',
      messages: [{role: 'system', content: prompt}],
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
      console.log('chat response: ', responseData.choices[0].message.content);
      setIsLoadingContent(false);
      setResult(responseData.choices[0].message.content);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let interval;
    if (isLoadingContent) {
      // Start the interval when loading is true
      interval = setInterval(() => {
        setLoadingDots(prevDots => (prevDots % 3) + 1); // Cycle through 1, 2, 3
      }, 1000);
    } else {
      // Clear the interval when loading is false
      clearInterval(interval);
    }
    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [isLoadingContent]);
  const loadingText = `Preparing${'.'.repeat(loadingDots)}`; // Create loading text with dots
  return (
    <SafeAreaView style={[styles.backgroundStyle, {flex: 1}]}>
      <View style={styles.container}>
        <View style={styles.topicContainer}>
          <Text style={styles.displayText} onPress={toLogin}>
            To use all the features, click here to sign up or login.
          </Text>
        </View>
        <View style={styles.topicContainer}>
          <Text style={[styles.displayText, {paddingVertical: 20}]}>
            Select the language you want to learn
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
      {isLoadingContent && (
        // Show loading text or spinner while waiting for the response
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      )}
      {selectedTargetLanguage ? (
        chapterTopics.length > 0 ? (
          <ScrollView style={styles.backgroundStyle}>
            {chapterTopics.map(chapter => (
              <View key={chapter.id} style={styles.chapterContainer}>
                <Text style={styles.chapterTitle}>{chapter.name}</Text>
                {chapter.topics &&
                  chapter.topics.map((topic, index) => (
                    <View key={index} style={styles.topicContainer}>
                      <Text
                        style={styles.topicTitle}
                        onPress={() => indiExplanation(topic.name)}>
                        {topic.name}
                      </Text>
                      {selectedItem === topic.name && result && (
                        <Text style={styles.resultStyle}>{result}</Text> // Ensure you have defined styles for resultStyle
                      )}
                    </View>
                  ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.container}>
            <Text>No chapters available.</Text>
          </View>
        )
      ) : null}
    </SafeAreaView>
  );
}

export default GuestPage;
