import Event from '@/components/edit/Event'
import React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const editEvent = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Event />
    </GestureHandlerRootView>
  )
}

export default editEvent

const styles = StyleSheet.create({})