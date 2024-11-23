import React from 'react';
import { View, StyleSheet } from 'react-native';

export const homeStyle = StyleSheet.create({
  background: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle: (size) => ({
    position: 'absolute',
    borderRadius: size / 2,
    opacity: 0.5,
    backgroundColor: '#0D1BF7',
    width: size,
    height: size,
    // Set fixed positions for each circle
  }),
  topRectangle: {
    width: '100%',
    height: 160,
    backgroundColor: '#A6B4F2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  hollowCircle: (size, borderWidth = 5, color) => ({
    position: 'absolute',
    borderRadius: size / 2,
    backgroundColor: 'transparent', // Background is transparent
    borderColor: color, // Border color
    borderWidth: borderWidth, // Border width
    width: size,
    height: size,
    // Remove opacity as it's no longer needed
  }),
  oval: (width, height) => ({
    position: 'absolute',
    borderRadius: Math.min(width, height) / 2, // This ensures smooth curvature
    backgroundColor: '#0D1BF7', // Change the color as needed
    width: width,
    height: height,
  }),
  hollowOval: (width, height, borderWidth = 5, color) => ({
    position: 'absolute',
    backgroundColor: 'transparent', // Background is transparent
    borderColor: color, // Border color
    borderWidth: borderWidth, // Border width
    width: width,
    height: height,
    borderRadius: Math.min(width, height) / 2, // Ensures proper curvature
  }),
});

const Background = () => {
  return (
    <View style={homeStyle.background}>
      {/* Example of fixed positioned elements */}
      <View style={{...homeStyle.hollowCircle(70, 5, '#0D1BF7'), top: 360, left: 20}} />
      <View style={{...homeStyle.hollowCircle(40, 5, '#0D1BF7'), top: 500, left: 100}} />
      <View style={{...homeStyle.hollowCircle(20, 5, '#0D1BF7'), top: 200, left: 200}} />
      <View style={{...homeStyle.hollowCircle(75, 5, '#FFFF00'), top: 400, left: 170}} />
      <View style={{...homeStyle.hollowOval(160, 60, 5, '#FFFF00'), top: 300, left: 50}} />
      <View style={{...homeStyle.hollowOval(170, 75, 5, '#FFFF00'), top: 400, left: 170}} />
      <View style={{...homeStyle.hollowOval(180, 90, 5, '#FFFF00'), top: 500, left: 250}} />
      {/* Add more circles or ovals as needed */}
    </View>
  );
};

export default Background;
